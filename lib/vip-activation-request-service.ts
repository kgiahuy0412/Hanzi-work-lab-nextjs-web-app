import "server-only";

import { and, asc, desc, eq } from "drizzle-orm";
import { readDb, writeDb } from "../db/index.ts";
import { auditLogs, users, vipActivationRequests, vipPlans } from "../db/schema.ts";
import type { MutationResult } from "./admin-content-service.ts";
import { grantOrExtendVipAccessInTransaction } from "./admin-subscription-service.ts";
import { getActiveVipSubscription } from "./vip-subscription.ts";
import { createNotificationInTransaction } from "./notification-service.ts";

function normalizedNote(value?: string | null): string | null {
  const note = value?.trim().slice(0, 500) ?? "";
  return note || null;
}

export async function getVipUpgradeOverview(userId?: string | null) {
  return readDb(async (db) => {
    const plansPromise = db.select({
      id: vipPlans.id,
      code: vipPlans.code,
      name: vipPlans.name,
      durationDays: vipPlans.durationDays,
      priceVnd: vipPlans.priceVnd,
      benefits: vipPlans.benefits,
    }).from(vipPlans)
      .where(eq(vipPlans.isActive, true))
      .orderBy(asc(vipPlans.durationDays), asc(vipPlans.name));

    if (!userId) {
      return {
        plans: await plansPromise,
        pendingRequest: null,
        activeSubscription: null,
      };
    }

    const [plans, pendingRows, activeSubscription] = await Promise.all([
      plansPromise,
      db.select({
        id: vipActivationRequests.id,
        planId: vipActivationRequests.planId,
        planCode: vipPlans.code,
        planName: vipPlans.name,
        durationDays: vipPlans.durationDays,
        priceVnd: vipPlans.priceVnd,
        userNote: vipActivationRequests.userNote,
        createdAt: vipActivationRequests.createdAt,
        updatedAt: vipActivationRequests.updatedAt,
      }).from(vipActivationRequests)
        .innerJoin(vipPlans, eq(vipActivationRequests.planId, vipPlans.id))
        .where(and(
          eq(vipActivationRequests.userId, userId),
          eq(vipActivationRequests.status, "pending"),
        ))
        .orderBy(desc(vipActivationRequests.updatedAt))
        .limit(1),
      getActiveVipSubscription(userId, db),
    ]);

    return {
      plans,
      pendingRequest: pendingRows[0] ?? null,
      activeSubscription,
    };
  });
}

export async function getPendingVipActivationRequest(userId: string) {
  return readDb(async (db) => {
    const rows = await db.select({
      id: vipActivationRequests.id,
      planId: vipActivationRequests.planId,
      planCode: vipPlans.code,
      planName: vipPlans.name,
      durationDays: vipPlans.durationDays,
      priceVnd: vipPlans.priceVnd,
      userNote: vipActivationRequests.userNote,
      createdAt: vipActivationRequests.createdAt,
      updatedAt: vipActivationRequests.updatedAt,
    }).from(vipActivationRequests)
      .innerJoin(vipPlans, eq(vipActivationRequests.planId, vipPlans.id))
      .where(and(
        eq(vipActivationRequests.userId, userId),
        eq(vipActivationRequests.status, "pending"),
      ))
      .orderBy(desc(vipActivationRequests.updatedAt))
      .limit(1);
    return rows[0] ?? null;
  });
}

export async function requestVipActivation(input: {
  userId: string;
  planId: string;
  userNote?: string | null;
  source?: string | null;
}): Promise<MutationResult> {
  return writeDb((db) => db.transaction(async (tx) => {
    const now = new Date();
    const learnerRows = await tx.select({
      id: users.id,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      emailVerifiedAt: users.emailVerifiedAt,
    }).from(users).where(eq(users.id, input.userId)).for("update").limit(1);
    const learner = learnerRows[0];
    if (!learner || learner.role !== "learner" || !learner.isActive || !learner.emailVerifiedAt) {
      return { ok: false, error: "vip_request_ineligible" };
    }

    const planRows = await tx.select({
      id: vipPlans.id,
      code: vipPlans.code,
      name: vipPlans.name,
      durationDays: vipPlans.durationDays,
    }).from(vipPlans)
      .where(and(eq(vipPlans.id, input.planId), eq(vipPlans.isActive, true)))
      .limit(1);
    const plan = planRows[0];
    if (!plan) return { ok: false, error: "vip_plan_inactive" };

    const pendingRows = await tx.select({ id: vipActivationRequests.id })
      .from(vipActivationRequests)
      .where(and(
        eq(vipActivationRequests.userId, learner.id),
        eq(vipActivationRequests.status, "pending"),
      ))
      .for("update")
      .limit(1);
    const existing = pendingRows[0] ?? null;
    const source = input.source?.trim().slice(0, 40) || "vip_page";
    const userNote = normalizedNote(input.userNote);
    let requestId: string;

    if (existing) {
      await tx.update(vipActivationRequests).set({
        planId: plan.id,
        source,
        userNote,
        updatedAt: now,
      }).where(eq(vipActivationRequests.id, existing.id));
      requestId = existing.id;
    } else {
      const inserted = await tx.insert(vipActivationRequests).values({
        userId: learner.id,
        planId: plan.id,
        source,
        userNote,
        createdAt: now,
        updatedAt: now,
      }).returning({ id: vipActivationRequests.id });
      requestId = inserted[0].id;
    }

    await tx.insert(auditLogs).values({
      actorId: learner.id,
      action: existing ? "vip.activation_request.updated" : "vip.activation_request.created",
      entityType: "vip_activation_request",
      entityId: requestId,
      metadata: {
        planId: plan.id,
        planCode: plan.code,
        durationDays: plan.durationDays,
        source,
      },
    });
    return { ok: true, id: requestId };
  }));
}

export async function cancelVipActivationRequest(requestId: string, userId: string): Promise<MutationResult> {
  return writeDb((db) => db.transaction(async (tx) => {
    const requestRows = await tx.select({ id: vipActivationRequests.id, planId: vipActivationRequests.planId })
      .from(vipActivationRequests)
      .where(and(
        eq(vipActivationRequests.id, requestId),
        eq(vipActivationRequests.userId, userId),
      ))
      .for("update")
      .limit(1);
    const request = requestRows[0];
    if (!request) return { ok: false, error: "not_found" };

    const updated = await tx.update(vipActivationRequests).set({
      status: "cancelled",
      updatedAt: new Date(),
    }).where(and(
      eq(vipActivationRequests.id, request.id),
      eq(vipActivationRequests.status, "pending"),
    )).returning({ id: vipActivationRequests.id });
    if (updated.length === 0) return { ok: false, error: "vip_request_not_pending" };

    await tx.insert(auditLogs).values({
      actorId: userId,
      action: "vip.activation_request.cancelled",
      entityType: "vip_activation_request",
      entityId: request.id,
      metadata: { planId: request.planId },
    });
    return { ok: true, id: request.id };
  }));
}

export async function approveVipActivationRequest(input: {
  requestId: string;
  adminNote?: string | null;
}, actorId: string): Promise<MutationResult> {
  return writeDb((db) => db.transaction(async (tx) => {
    const initialRows = await tx.select({ userId: vipActivationRequests.userId })
      .from(vipActivationRequests)
      .where(eq(vipActivationRequests.id, input.requestId))
      .limit(1);
    const initial = initialRows[0];
    if (!initial) return { ok: false, error: "not_found" };

    await tx.select({ id: users.id }).from(users).where(eq(users.id, initial.userId)).for("update").limit(1);
    const requestRows = await tx.select({
      id: vipActivationRequests.id,
      userId: vipActivationRequests.userId,
      planId: vipActivationRequests.planId,
      status: vipActivationRequests.status,
    }).from(vipActivationRequests)
      .where(eq(vipActivationRequests.id, input.requestId))
      .for("update")
      .limit(1);
    const request = requestRows[0];
    if (!request) return { ok: false, error: "not_found" };
    if (request.status !== "pending") return { ok: false, error: "vip_request_not_pending" };

    const activation = await grantOrExtendVipAccessInTransaction(tx, {
      userId: request.userId,
      planId: request.planId,
    }, actorId);
    if (!activation.ok) return activation;

    const now = new Date();
    await tx.update(vipActivationRequests).set({
      status: "approved",
      adminNote: normalizedNote(input.adminNote),
      reviewedBy: actorId,
      reviewedAt: now,
      subscriptionId: activation.id,
      updatedAt: now,
    }).where(eq(vipActivationRequests.id, request.id));
    await createNotificationInTransaction(tx, {
      userId: request.userId,
      type: "vip_request_approved",
      title: "VIP đã được kích hoạt",
      message: "Yêu cầu của bạn đã được duyệt. Toàn bộ quyền lợi VIP hiện đã sẵn sàng trên tài khoản.",
      href: "/account",
      entityType: "vip_activation_request",
      entityId: request.id,
    });
    await tx.insert(auditLogs).values({
      actorId,
      action: "admin.vip_activation_request.approved",
      entityType: "vip_activation_request",
      entityId: request.id,
      metadata: {
        userId: request.userId,
        planId: request.planId,
        subscriptionId: activation.id,
      },
    });
    return { ok: true, id: request.id };
  }));
}

export async function rejectVipActivationRequest(input: {
  requestId: string;
  adminNote: string;
}, actorId: string): Promise<MutationResult> {
  const adminNote = normalizedNote(input.adminNote);
  if (!adminNote) return { ok: false, error: "invalid_input" };

  return writeDb((db) => db.transaction(async (tx) => {
    const requestRows = await tx.select({
      id: vipActivationRequests.id,
      userId: vipActivationRequests.userId,
      planId: vipActivationRequests.planId,
      status: vipActivationRequests.status,
    }).from(vipActivationRequests)
      .where(eq(vipActivationRequests.id, input.requestId))
      .for("update")
      .limit(1);
    const request = requestRows[0];
    if (!request) return { ok: false, error: "not_found" };
    if (request.status !== "pending") return { ok: false, error: "vip_request_not_pending" };

    const now = new Date();
    await tx.update(vipActivationRequests).set({
      status: "rejected",
      adminNote,
      reviewedBy: actorId,
      reviewedAt: now,
      updatedAt: now,
    }).where(eq(vipActivationRequests.id, request.id));
    await createNotificationInTransaction(tx, {
      userId: request.userId,
      type: "vip_request_rejected",
      title: "Yêu cầu VIP cần xem lại",
      message: `Yêu cầu chưa được duyệt: ${adminNote}`,
      href: "/vip",
      entityType: "vip_activation_request",
      entityId: request.id,
    });
    await tx.insert(auditLogs).values({
      actorId,
      action: "admin.vip_activation_request.rejected",
      entityType: "vip_activation_request",
      entityId: request.id,
      metadata: {
        userId: request.userId,
        planId: request.planId,
        adminNote,
      },
    });
    return { ok: true, id: request.id };
  }));
}
