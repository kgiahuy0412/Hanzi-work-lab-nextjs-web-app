import "server-only";

import { and, asc, count, countDistinct, desc, eq, gt, ilike, inArray, isNotNull, isNull, lte, ne, or, sql } from "drizzle-orm";
import { readDb, writeDb, type Database } from "../db/index.ts";
import { auditLogs, paymentOrders, subscriptions, users, vipActivationRequests, vipPlans } from "../db/schema.ts";
import type { MutationResult } from "./admin-content-service.ts";
import { calculateVipPlanEndsAt } from "./vip-subscription.ts";

function escapedSearch(value: string): string {
  return value.trim().slice(0, 120).replace(/[\\%_]/gu, "\\$&");
}

type DbTransaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

export type AdminVipPlanInput = {
  benefits: string[];
  code: string;
  discountPercent: number;
  durationDays: number;
  isActive: boolean;
  name: string;
  priceVnd: number;
  promotionLabel: string;
};

export async function getAdminVipConsole(search = "") {
  return readDb(async (db) => {
    const now = new Date();
    const normalizedSearch = escapedSearch(search);
    const learnerFilter = normalizedSearch
      ? and(
        eq(users.role, "learner"),
        or(
          ilike(users.email, `%${normalizedSearch}%`),
          ilike(users.displayName, `%${normalizedSearch}%`),
        ),
      )
      : eq(users.role, "learner");
    const activeSubscription = db.select({
      id: subscriptions.id,
      planId: subscriptions.planId,
      planCode: vipPlans.code,
      planName: vipPlans.name,
      startsAt: subscriptions.startsAt,
      endsAt: subscriptions.endsAt,
      createdAt: subscriptions.createdAt,
    }).from(subscriptions)
      .innerJoin(vipPlans, eq(subscriptions.planId, vipPlans.id))
      .where(and(
        eq(subscriptions.userId, users.id),
        eq(subscriptions.status, "active"),
        or(isNull(subscriptions.startsAt), lte(subscriptions.startsAt, now)),
        or(isNull(subscriptions.endsAt), gt(subscriptions.endsAt, now)),
      ))
      .orderBy(desc(subscriptions.endsAt), desc(subscriptions.createdAt))
      .limit(1)
      .as("active_subscription");
    const [learnerRows, planRows, activeCountRows, pendingCountRows, pendingRequestRows, subscriberRows, transactionRows] = await Promise.all([
      db.select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        isActive: users.isActive,
        emailVerifiedAt: users.emailVerifiedAt,
        createdAt: users.createdAt,
        subscriptionId: activeSubscription.id,
        subscriptionPlanId: activeSubscription.planId,
        subscriptionPlanCode: activeSubscription.planCode,
        subscriptionPlanName: activeSubscription.planName,
        subscriptionStartsAt: activeSubscription.startsAt,
        subscriptionEndsAt: activeSubscription.endsAt,
        subscriptionCreatedAt: activeSubscription.createdAt,
      }).from(users)
        .leftJoinLateral(activeSubscription, sql`true`)
        .where(learnerFilter)
        .orderBy(asc(users.createdAt), asc(users.email))
        .limit(100),
      db.select({
        id: vipPlans.id,
        code: vipPlans.code,
        name: vipPlans.name,
        durationDays: vipPlans.durationDays,
        priceVnd: vipPlans.priceVnd,
        discountPercent: vipPlans.discountPercent,
        promotionLabel: vipPlans.promotionLabel,
        benefits: vipPlans.benefits,
        isActive: vipPlans.isActive,
        subscriberCount: sql<number>`(select count(distinct ${subscriptions.userId})::int from ${subscriptions} where ${subscriptions.planId} = ${vipPlans.id})`,
      }).from(vipPlans).orderBy(asc(vipPlans.durationDays), asc(vipPlans.name)),
      db.select({ value: countDistinct(subscriptions.userId) }).from(subscriptions).where(and(
        eq(subscriptions.status, "active"),
        or(isNull(subscriptions.startsAt), lte(subscriptions.startsAt, now)),
        or(isNull(subscriptions.endsAt), gt(subscriptions.endsAt, now)),
      )),
      db.select({ value: count() }).from(vipActivationRequests)
        .where(eq(vipActivationRequests.status, "pending")),
      db.select({
        id: vipActivationRequests.id,
        userId: vipActivationRequests.userId,
        planId: vipActivationRequests.planId,
        userNote: vipActivationRequests.userNote,
        createdAt: vipActivationRequests.createdAt,
        updatedAt: vipActivationRequests.updatedAt,
        email: users.email,
        displayName: users.displayName,
        isActive: users.isActive,
        emailVerifiedAt: users.emailVerifiedAt,
        planCode: vipPlans.code,
        planName: vipPlans.name,
        durationDays: vipPlans.durationDays,
        priceVnd: vipPlans.priceVnd,
        planActive: vipPlans.isActive,
      }).from(vipActivationRequests)
        .innerJoin(users, eq(vipActivationRequests.userId, users.id))
        .innerJoin(vipPlans, eq(vipActivationRequests.planId, vipPlans.id))
        .where(eq(vipActivationRequests.status, "pending"))
        .orderBy(asc(vipActivationRequests.createdAt))
        .limit(50),
      db.select({
        id: subscriptions.id,
        userId: subscriptions.userId,
        displayName: users.displayName,
        email: users.email,
        planId: vipPlans.id,
        planName: vipPlans.name,
        status: subscriptions.status,
        startsAt: subscriptions.startsAt,
        endsAt: subscriptions.endsAt,
        createdAt: subscriptions.createdAt,
      }).from(subscriptions)
        .innerJoin(users, eq(subscriptions.userId, users.id))
        .innerJoin(vipPlans, eq(subscriptions.planId, vipPlans.id))
        .orderBy(desc(subscriptions.createdAt))
        .limit(200),
      db.select({
        id: paymentOrders.id,
        displayName: users.displayName,
        email: users.email,
        planName: vipPlans.name,
        amountVnd: paymentOrders.amountVnd,
        status: paymentOrders.status,
        paidAt: paymentOrders.paidAt,
        createdAt: paymentOrders.createdAt,
      }).from(paymentOrders)
        .innerJoin(users, eq(paymentOrders.userId, users.id))
        .innerJoin(vipPlans, eq(paymentOrders.planId, vipPlans.id))
        .orderBy(desc(sql`coalesce(${paymentOrders.paidAt}, ${paymentOrders.createdAt})`))
        .limit(200),
    ]);
    return {
      activeCount: activeCountRows[0]?.value ?? 0,
      pendingRequestCount: pendingCountRows[0]?.value ?? 0,
      pendingRequests: pendingRequestRows,
      learners: learnerRows.map(({
        subscriptionCreatedAt,
        subscriptionEndsAt,
        subscriptionId,
        subscriptionPlanCode,
        subscriptionPlanId,
        subscriptionPlanName,
        subscriptionStartsAt,
        ...learner
      }) => ({
        ...learner,
        subscription: subscriptionId ? {
          id: subscriptionId,
          userId: learner.id,
          planId: subscriptionPlanId!,
          planCode: subscriptionPlanCode!,
          planName: subscriptionPlanName!,
          startsAt: subscriptionStartsAt,
          endsAt: subscriptionEndsAt,
          createdAt: subscriptionCreatedAt!,
        } : null,
      })),
      plans: planRows,
      activePlans: planRows.filter((plan) => plan.isActive),
      subscribers: subscriberRows,
      transactions: transactionRows,
      search: search.trim().slice(0, 120),
    };
  });
}

export async function createVipPlan(input: AdminVipPlanInput, actorId: string): Promise<MutationResult> {
  return writeDb((db) => db.transaction(async (tx) => {
    const inserted = await tx.insert(vipPlans).values({
      ...input,
      promotionLabel: input.promotionLabel || null,
    }).onConflictDoNothing({ target: vipPlans.code }).returning({ id: vipPlans.id });
    if (!inserted[0]) return { ok: false, error: "duplicate_code" };
    await tx.insert(auditLogs).values({
      actorId,
      action: "admin.vip_plan.created",
      entityType: "vip_plan",
      entityId: inserted[0].id,
      metadata: { code: input.code, durationDays: input.durationDays, priceVnd: input.priceVnd },
    });
    return { ok: true, id: inserted[0].id };
  }));
}

export async function updateVipPlan(planId: string, input: AdminVipPlanInput, actorId: string): Promise<MutationResult> {
  return writeDb((db) => db.transaction(async (tx) => {
    const [existingRows, collisionRows] = await Promise.all([
      tx.select({ id: vipPlans.id, code: vipPlans.code }).from(vipPlans).where(eq(vipPlans.id, planId)).limit(1),
      tx.select({ id: vipPlans.id }).from(vipPlans).where(and(eq(vipPlans.code, input.code), ne(vipPlans.id, planId))).limit(1),
    ]);
    const existing = existingRows[0];
    if (!existing) return { ok: false, error: "not_found" };
    if (collisionRows[0]) return { ok: false, error: "duplicate_code" };
    await tx.update(vipPlans).set({
      ...input,
      promotionLabel: input.promotionLabel || null,
      updatedAt: new Date(),
    }).where(eq(vipPlans.id, planId));
    await tx.insert(auditLogs).values({
      actorId,
      action: "admin.vip_plan.updated",
      entityType: "vip_plan",
      entityId: planId,
      metadata: { fromCode: existing.code, code: input.code, durationDays: input.durationDays, priceVnd: input.priceVnd },
    });
    return { ok: true, id: planId };
  }));
}

export async function setVipPlanActive(planId: string, isActive: boolean, actorId: string): Promise<MutationResult> {
  return writeDb((db) => db.transaction(async (tx) => {
    const rows = await tx.update(vipPlans).set({ isActive, updatedAt: new Date() })
      .where(eq(vipPlans.id, planId)).returning({ id: vipPlans.id, code: vipPlans.code });
    const plan = rows[0];
    if (!plan) return { ok: false, error: "not_found" };
    await tx.insert(auditLogs).values({
      actorId,
      action: isActive ? "admin.vip_plan.activated" : "admin.vip_plan.paused",
      entityType: "vip_plan",
      entityId: plan.id,
      metadata: { code: plan.code, isActive },
    });
    return { ok: true, id: plan.id };
  }));
}

export async function deleteVipPlan(planId: string, actorId: string): Promise<MutationResult> {
  return writeDb((db) => db.transaction(async (tx) => {
    const [planRows, subscriptionRows, requestRows, paymentRows] = await Promise.all([
      tx.select({ id: vipPlans.id, code: vipPlans.code }).from(vipPlans).where(eq(vipPlans.id, planId)).limit(1),
      tx.select({ value: count() }).from(subscriptions).where(eq(subscriptions.planId, planId)),
      tx.select({ value: count() }).from(vipActivationRequests).where(eq(vipActivationRequests.planId, planId)),
      tx.select({ value: count() }).from(paymentOrders).where(eq(paymentOrders.planId, planId)),
    ]);
    const plan = planRows[0];
    if (!plan) return { ok: false, error: "not_found" };
    if ((subscriptionRows[0]?.value ?? 0) + (requestRows[0]?.value ?? 0) + (paymentRows[0]?.value ?? 0) > 0) {
      return { ok: false, error: "vip_plan_in_use" };
    }
    await tx.delete(vipPlans).where(eq(vipPlans.id, plan.id));
    await tx.insert(auditLogs).values({
      actorId,
      action: "admin.vip_plan.deleted",
      entityType: "vip_plan",
      metadata: { deletedId: plan.id, code: plan.code },
    });
    return { ok: true, id: plan.id };
  }));
}

export async function grantOrExtendVipAccessInTransaction(tx: DbTransaction, input: {
  userId: string;
  planId: string;
}, actorId: string | null, source: "admin" | "sepay" = "admin"): Promise<MutationResult> {
    const now = new Date();
    const targetRows = await tx.select({
      id: users.id,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      emailVerifiedAt: users.emailVerifiedAt,
    }).from(users).where(eq(users.id, input.userId)).for("update").limit(1);
    const target = targetRows[0];
    if (!target) return { ok: false, error: "not_found" };
    if (target.role !== "learner" || !target.isActive || !target.emailVerifiedAt) {
      return { ok: false, error: "vip_target_ineligible" };
    }
    const planRows = await tx.select({
      id: vipPlans.id,
      code: vipPlans.code,
      name: vipPlans.name,
      durationDays: vipPlans.durationDays,
    }).from(vipPlans).where(and(eq(vipPlans.id, input.planId), eq(vipPlans.isActive, true))).limit(1);
    const plan = planRows[0];
    if (!plan) return { ok: false, error: "vip_plan_inactive" };

    await tx.update(subscriptions).set({ status: "expired" }).where(and(
      eq(subscriptions.userId, target.id),
      eq(subscriptions.status, "active"),
      isNotNull(subscriptions.endsAt),
      lte(subscriptions.endsAt, now),
    ));
    const activeRows = await tx.select({
      id: subscriptions.id,
      planId: subscriptions.planId,
      startsAt: subscriptions.startsAt,
      endsAt: subscriptions.endsAt,
    }).from(subscriptions).where(and(
      eq(subscriptions.userId, target.id),
      eq(subscriptions.status, "active"),
      or(isNull(subscriptions.startsAt), lte(subscriptions.startsAt, now)),
      or(isNull(subscriptions.endsAt), gt(subscriptions.endsAt, now)),
    )).orderBy(desc(subscriptions.endsAt), desc(subscriptions.createdAt)).for("update");
    const active = activeRows[0] ?? null;
    const endsAt = calculateVipPlanEndsAt(now, active?.endsAt ?? null, plan.code, plan.durationDays);
    let subscriptionId: string;
    if (active) {
      await tx.update(subscriptions).set({
        planId: plan.id,
        startsAt: active.startsAt ?? now,
        endsAt,
        activatedBy: actorId,
      }).where(eq(subscriptions.id, active.id));
      if (activeRows.length > 1) {
        await tx.update(subscriptions).set({ status: "cancelled", endsAt: now })
          .where(inArray(subscriptions.id, activeRows.slice(1).map((item) => item.id)));
      }
      subscriptionId = active.id;
    } else {
      const inserted = await tx.insert(subscriptions).values({
        userId: target.id,
        planId: plan.id,
        status: "active",
        startsAt: now,
        endsAt,
        activatedBy: actorId,
      }).returning({ id: subscriptions.id });
      subscriptionId = inserted[0].id;
    }
    await tx.insert(auditLogs).values({
      actorId,
      action: source === "admin"
        ? (active ? "admin.subscription.extended" : "admin.subscription.granted")
        : (active ? "sepay.subscription.extended" : "sepay.subscription.granted"),
      entityType: "subscription",
      entityId: subscriptionId,
      metadata: {
        userId: target.id,
        email: target.email,
        planId: plan.id,
        planCode: plan.code,
        durationDays: plan.durationDays,
        source,
        previousEndsAt: active?.endsAt?.toISOString() ?? null,
        endsAt: endsAt?.toISOString() ?? null,
      },
    });
    return { ok: true, id: subscriptionId };
}

export async function grantOrExtendVipAccess(input: {
  userId: string;
  planId: string;
}, actorId: string): Promise<MutationResult> {
  return writeDb((db) => db.transaction((tx) => grantOrExtendVipAccessInTransaction(tx, input, actorId)));
}

export async function revokeVipAccess(userId: string, actorId: string): Promise<MutationResult> {
  return writeDb((db) => db.transaction(async (tx) => {
    const now = new Date();
    const targetRows = await tx.select({
      id: users.id,
      email: users.email,
      role: users.role,
    }).from(users).where(eq(users.id, userId)).for("update").limit(1);
    const target = targetRows[0];
    if (!target) return { ok: false, error: "not_found" };
    if (target.role !== "learner") return { ok: false, error: "vip_target_ineligible" };
    const revoked = await tx.update(subscriptions).set({ status: "cancelled", endsAt: now }).where(and(
      eq(subscriptions.userId, target.id),
      eq(subscriptions.status, "active"),
      or(isNull(subscriptions.endsAt), gt(subscriptions.endsAt, now)),
    )).returning({ id: subscriptions.id, planId: subscriptions.planId });
    if (revoked.length === 0) return { ok: false, error: "vip_not_active" };
    await tx.insert(auditLogs).values({
      actorId,
      action: "admin.subscription.revoked",
      entityType: "subscription",
      entityId: revoked[0].id,
      metadata: {
        userId: target.id,
        email: target.email,
        subscriptionIds: revoked.map((item) => item.id),
        planIds: revoked.map((item) => item.planId),
        revokedAt: now.toISOString(),
      },
    });
    return { ok: true, id: revoked[0].id };
  }));
}
