import "server-only";

import { and, asc, count, desc, eq, gt, ilike, inArray, isNull, lte, or } from "drizzle-orm";
import { readDb, writeDb } from "../db/index.ts";
import {
  auditLogs,
  authSessions,
  authTokens,
  subscriptions,
  users,
  vipActivationRequests,
  vipPlans,
} from "../db/schema.ts";
import type { MutationResult } from "./admin-content-service.ts";
import { adminPeriodRange, type AdminPeriod } from "./admin-reporting.ts";
import type { UserRole } from "./auth-service.ts";

export type AdminUserPeriod = "all" | AdminPeriod;

function escapedSearch(value: string): string {
  return value.trim().slice(0, 120).replace(/[\\%_]/gu, "\\$&");
}

export function parseAdminUserPeriod(value: string | null | undefined): AdminUserPeriod {
  return value === "day" || value === "week" || value === "month" ? value : "all";
}

export async function listAdminUsers() {
  return readDb((db) => db.select({
    id: users.id,
    email: users.email,
    displayName: users.displayName,
    role: users.role,
    isActive: users.isActive,
    emailVerifiedAt: users.emailVerifiedAt,
    createdAt: users.createdAt,
  }).from(users).orderBy(asc(users.createdAt), asc(users.email)));
}

export async function getAdminUserConsole(input: {
  limit?: number;
  period?: AdminUserPeriod;
  search?: string;
} = {}) {
  const now = new Date();
  const period = input.period ?? "all";
  const search = input.search?.trim().slice(0, 120) ?? "";
  const normalizedSearch = escapedSearch(search);
  const createdAfter = period === "all" ? null : adminPeriodRange(period, now).start;
  const userFilter = and(
    normalizedSearch ? or(
      ilike(users.email, `%${normalizedSearch}%`),
      ilike(users.displayName, `%${normalizedSearch}%`),
    ) : undefined,
    createdAfter ? gt(users.createdAt, createdAfter) : undefined,
  );

  return readDb(async (db) => {
    const [userRows, planRows] = await Promise.all([
      db.select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        role: users.role,
        isActive: users.isActive,
        emailVerifiedAt: users.emailVerifiedAt,
        createdAt: users.createdAt,
      }).from(users)
        .where(userFilter)
        .orderBy(desc(users.createdAt), asc(users.email))
        .limit(Math.min(Math.max(input.limit ?? 300, 1), 5_000)),
      db.select({
        id: vipPlans.id,
        name: vipPlans.name,
        durationDays: vipPlans.durationDays,
        priceVnd: vipPlans.priceVnd,
      }).from(vipPlans).where(eq(vipPlans.isActive, true)).orderBy(asc(vipPlans.durationDays), asc(vipPlans.name)),
    ]);
    const userIds = userRows.map((user) => user.id);
    const subscriptionRows = userIds.length ? await db.select({
      id: subscriptions.id,
      userId: subscriptions.userId,
      planId: subscriptions.planId,
      planName: vipPlans.name,
      endsAt: subscriptions.endsAt,
    }).from(subscriptions)
      .innerJoin(vipPlans, eq(subscriptions.planId, vipPlans.id))
      .where(and(
        inArray(subscriptions.userId, userIds),
        eq(subscriptions.status, "active"),
        or(isNull(subscriptions.startsAt), lte(subscriptions.startsAt, now)),
        or(isNull(subscriptions.endsAt), gt(subscriptions.endsAt, now)),
      ))
      .orderBy(desc(subscriptions.endsAt), desc(subscriptions.createdAt)) : [];
    const subscriptionByUser = new Map<string, (typeof subscriptionRows)[number]>();
    for (const subscription of subscriptionRows) {
      if (!subscriptionByUser.has(subscription.userId)) subscriptionByUser.set(subscription.userId, subscription);
    }
    return {
      period,
      plans: planRows,
      search,
      users: userRows.map((user) => ({ ...user, subscription: subscriptionByUser.get(user.id) ?? null })),
    };
  });
}

export async function deactivateAdminUser(userId: string, actorId: string): Promise<MutationResult> {
  return writeDb((db) => db.transaction(async (tx) => {
    const rows = await tx.select({
      id: users.id,
      email: users.email,
      isActive: users.isActive,
      role: users.role,
    }).from(users).where(eq(users.id, userId)).for("update").limit(1);
    const target = rows[0];
    if (!target) return { ok: false, error: "not_found" };
    if (target.id === actorId || target.role !== "learner" || !target.isActive) {
      return { ok: false, error: "user_delete_forbidden" };
    }
    const now = new Date();
    await tx.update(users).set({ isActive: false, updatedAt: now }).where(eq(users.id, target.id));
    await Promise.all([
      tx.delete(authSessions).where(eq(authSessions.userId, target.id)),
      tx.delete(authTokens).where(eq(authTokens.userId, target.id)),
      tx.update(subscriptions).set({ status: "cancelled", endsAt: now }).where(and(
        eq(subscriptions.userId, target.id),
        eq(subscriptions.status, "active"),
      )),
      tx.update(vipActivationRequests).set({ status: "cancelled", updatedAt: now }).where(and(
        eq(vipActivationRequests.userId, target.id),
        eq(vipActivationRequests.status, "pending"),
      )),
    ]);
    await tx.insert(auditLogs).values({
      actorId,
      action: "admin.user.deactivated",
      entityType: "user",
      entityId: target.id,
      metadata: { email: target.email, deactivatedAt: now.toISOString() },
    });
    return { ok: true, id: target.id };
  }));
}

export async function updateUserRole(userId: string, role: UserRole, actorId: string): Promise<MutationResult> {
  return writeDb((db) => db.transaction(async (tx) => {
    const rows = await tx.select({ id: users.id, email: users.email, role: users.role, emailVerifiedAt: users.emailVerifiedAt })
      .from(users).where(eq(users.id, userId)).limit(1);
    const target = rows[0];
    if (!target) return { ok: false, error: "not_found" };
    if (target.id === actorId || (!target.emailVerifiedAt && role !== "learner")) {
      return { ok: false, error: "role_change_forbidden" };
    }
    if (target.role === "admin" && role !== "admin") {
      const adminRows = await tx.select({ value: count() }).from(users).where(eq(users.role, "admin"));
      if ((adminRows[0]?.value ?? 0) <= 1) return { ok: false, error: "role_change_forbidden" };
    }
    await tx.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, userId));
    await tx.insert(auditLogs).values({
      actorId,
      action: "admin.user.role_updated",
      entityType: "user",
      entityId: userId,
      metadata: { email: target.email, fromRole: target.role, toRole: role },
    });
    return { ok: true, id: userId };
  }));
}
