import "server-only";

import { and, desc, eq, gt, lte } from "drizzle-orm";
import { writeDb, type Database } from "../db/index.ts";
import {
  auditLogs,
  paymentEvents,
  paymentOrders,
  users,
  vipActivationRequests,
  vipPlans,
} from "../db/schema.ts";
import { grantOrExtendVipAccessInTransaction } from "./admin-subscription-service.ts";
import { createNotificationInTransaction } from "./notification-service.ts";
import {
  accountNumberMatchesSepayConfig,
  buildSepayVietQrUrl,
  createSepayPaymentCode,
  extractSepayPaymentCode,
  getSepayBankAccount,
  parseSepayTransactionDate,
  SEPAY_ORDER_TTL_MINUTES,
  SEPAY_PROVIDER,
  type SepayWebhookPayload,
} from "./sepay.ts";

type DbTransaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
type PaymentStatus = "expired" | "failed" | "manual_review" | "paid" | "pending" | "refunded";

export type SepayPaymentOrder = {
  id: string;
  planId: string;
  planName: string;
  amountVnd: number;
  referenceCode: string;
  status: PaymentStatus;
  qrImageUrl: string;
  bankAccount: {
    bankCode: string;
    accountNumber: string;
    accountName: string;
  };
  paidAt: string | null;
  expiresAt: string;
};

type CreatePaymentOrderResult =
  | { ok: true; order: SepayPaymentOrder }
  | { ok: false; error: "payment_configuration_invalid" | "vip_plan_inactive" | "vip_request_ineligible" };

export type SepayWebhookProcessingResult =
  | { outcome: "duplicate" | "ignored" | "manual_review" | "paid" | "unmatched"; orderId?: string };

function paymentOrderDto(row: {
  id: string;
  planId: string;
  planName: string;
  amountVnd: number;
  referenceCode: string;
  status: PaymentStatus;
  qrContent: string | null;
  paidAt: Date | null;
  expiresAt: Date;
}): SepayPaymentOrder {
  const bankAccount = getSepayBankAccount();
  return {
    id: row.id,
    planId: row.planId,
    planName: row.planName,
    amountVnd: row.amountVnd,
    referenceCode: row.referenceCode,
    status: row.status,
    qrImageUrl: row.qrContent || buildSepayVietQrUrl({
      amountVnd: row.amountVnd,
      bankAccount,
      paymentCode: row.referenceCode,
    }),
    bankAccount,
    paidAt: row.paidAt?.toISOString() ?? null,
    expiresAt: row.expiresAt.toISOString(),
  };
}

function configuredBankAccountIsValid(): boolean {
  const account = getSepayBankAccount();
  return /^[A-Z0-9]{2,30}$/u.test(account.bankCode)
    && /^[A-Z0-9]{4,60}$/u.test(account.accountNumber)
    && account.accountName.length >= 2;
}

async function readPaymentOrderInTransaction(tx: DbTransaction, orderId: string, userId: string) {
  const rows = await tx.select({
    id: paymentOrders.id,
    planId: paymentOrders.planId,
    planName: vipPlans.name,
    amountVnd: paymentOrders.amountVnd,
    referenceCode: paymentOrders.referenceCode,
    status: paymentOrders.status,
    qrContent: paymentOrders.qrContent,
    paidAt: paymentOrders.paidAt,
    expiresAt: paymentOrders.expiresAt,
  }).from(paymentOrders)
    .innerJoin(vipPlans, eq(paymentOrders.planId, vipPlans.id))
    .where(and(eq(paymentOrders.id, orderId), eq(paymentOrders.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function createOrReuseSepayPaymentOrder(input: {
  planId: string;
  userId: string;
}): Promise<CreatePaymentOrderResult> {
  if (!configuredBankAccountIsValid()) return { ok: false, error: "payment_configuration_invalid" };

  return writeDb((db) => db.transaction(async (tx) => {
    const now = new Date();
    const userRows = await tx.select({
      id: users.id,
      role: users.role,
      isActive: users.isActive,
      emailVerifiedAt: users.emailVerifiedAt,
    }).from(users).where(eq(users.id, input.userId)).for("update").limit(1);
    const user = userRows[0];
    if (!user || user.role !== "learner" || !user.isActive || !user.emailVerifiedAt) {
      return { ok: false, error: "vip_request_ineligible" };
    }

    const planRows = await tx.select({
      id: vipPlans.id,
      name: vipPlans.name,
      priceVnd: vipPlans.priceVnd,
    }).from(vipPlans)
      .where(and(eq(vipPlans.id, input.planId), eq(vipPlans.isActive, true)))
      .limit(1);
    const plan = planRows[0];
    if (!plan || !Number.isSafeInteger(plan.priceVnd) || plan.priceVnd < 1) {
      return { ok: false, error: "vip_plan_inactive" };
    }

    await tx.update(paymentOrders).set({ status: "expired", updatedAt: now }).where(and(
      eq(paymentOrders.userId, user.id),
      eq(paymentOrders.provider, SEPAY_PROVIDER),
      eq(paymentOrders.status, "pending"),
      lte(paymentOrders.expiresAt, now),
    ));

    const existingRows = await tx.select({
      id: paymentOrders.id,
      planId: paymentOrders.planId,
      planName: vipPlans.name,
      amountVnd: paymentOrders.amountVnd,
      referenceCode: paymentOrders.referenceCode,
      status: paymentOrders.status,
      qrContent: paymentOrders.qrContent,
      paidAt: paymentOrders.paidAt,
      expiresAt: paymentOrders.expiresAt,
    }).from(paymentOrders)
      .innerJoin(vipPlans, eq(paymentOrders.planId, vipPlans.id))
      .where(and(
        eq(paymentOrders.userId, user.id),
        eq(paymentOrders.planId, plan.id),
        eq(paymentOrders.provider, SEPAY_PROVIDER),
        eq(paymentOrders.status, "pending"),
        gt(paymentOrders.expiresAt, now),
      ))
      .orderBy(desc(paymentOrders.createdAt))
      .for("update")
      .limit(1);
    if (existingRows[0]) return { ok: true, order: paymentOrderDto(existingRows[0]) };

    const expiresAt = new Date(now.getTime() + SEPAY_ORDER_TTL_MINUTES * 60_000);
    const bankAccount = getSepayBankAccount();
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const referenceCode = createSepayPaymentCode();
      const qrContent = buildSepayVietQrUrl({
        amountVnd: plan.priceVnd,
        bankAccount,
        paymentCode: referenceCode,
      });
      const inserted = await tx.insert(paymentOrders).values({
        userId: user.id,
        planId: plan.id,
        referenceCode,
        amountVnd: plan.priceVnd,
        provider: SEPAY_PROVIDER,
        status: "pending",
        qrContent,
        expiresAt,
        createdAt: now,
        updatedAt: now,
      }).onConflictDoNothing({ target: paymentOrders.referenceCode }).returning({ id: paymentOrders.id });
      const orderId = inserted[0]?.id;
      if (!orderId) continue;

      await tx.insert(auditLogs).values({
        actorId: user.id,
        action: "payment.sepay.created",
        entityType: "payment_order",
        entityId: orderId,
        metadata: { planId: plan.id, amountVnd: plan.priceVnd, referenceCode },
      });
      return {
        ok: true,
        order: paymentOrderDto({
          id: orderId,
          planId: plan.id,
          planName: plan.name,
          amountVnd: plan.priceVnd,
          referenceCode,
          status: "pending",
          qrContent,
          paidAt: null,
          expiresAt,
        }),
      };
    }
    return { ok: false, error: "payment_configuration_invalid" };
  }));
}

export async function getSepayPaymentOrder(orderId: string, userId: string): Promise<SepayPaymentOrder | null> {
  return writeDb((db) => db.transaction(async (tx) => {
    const now = new Date();
    await tx.update(paymentOrders).set({ status: "expired", updatedAt: now }).where(and(
      eq(paymentOrders.id, orderId),
      eq(paymentOrders.userId, userId),
      eq(paymentOrders.status, "pending"),
      lte(paymentOrders.expiresAt, now),
    ));
    const order = await readPaymentOrderInTransaction(tx, orderId, userId);
    return order ? paymentOrderDto(order) : null;
  }));
}

async function markEventProcessed(tx: DbTransaction, eventId: string, now: Date): Promise<void> {
  await tx.update(paymentEvents).set({ processedAt: now }).where(eq(paymentEvents.id, eventId));
}

async function flagPaymentForReview(tx: DbTransaction, input: {
  eventId: string;
  now: Date;
  order: { id: string; userId: string; planId: string; referenceCode: string };
  payload: SepayWebhookPayload;
  reason: "amount_mismatch" | "order_expired";
}): Promise<void> {
  await tx.update(paymentOrders).set({ status: "manual_review", updatedAt: input.now })
    .where(eq(paymentOrders.id, input.order.id));
  await markEventProcessed(tx, input.eventId, input.now);
  await tx.insert(auditLogs).values({
    action: `payment.sepay.${input.reason}`,
    entityType: "payment_order",
    entityId: input.order.id,
    metadata: {
      planId: input.order.planId,
      referenceCode: input.order.referenceCode,
      sepayTransactionId: input.payload.id,
      transferAmount: input.payload.transferAmount,
    },
  });
  await createNotificationInTransaction(tx, {
    userId: input.order.userId,
    type: "system",
    title: "Thanh toán cần được đối soát",
    message: "Himi đã nhận giao dịch nhưng cần kiểm tra thủ công. Vui lòng giữ lại biên lai chuyển khoản.",
    href: "/vip",
    entityType: "payment_order",
    entityId: input.order.id,
  });
}

export async function processSepayWebhook(payload: SepayWebhookPayload): Promise<SepayWebhookProcessingResult> {
  return writeDb((db) => db.transaction(async (tx) => {
    const now = new Date();
    const providerEventId = `${SEPAY_PROVIDER}:${payload.id}`;
    const paymentCode = extractSepayPaymentCode(payload);
    const candidateRows = paymentCode
      ? await tx.select({ id: paymentOrders.id, userId: paymentOrders.userId })
        .from(paymentOrders)
        .where(and(
          eq(paymentOrders.referenceCode, paymentCode),
          eq(paymentOrders.provider, SEPAY_PROVIDER),
        ))
        .limit(1)
      : [];
    const candidate = candidateRows[0] ?? null;

    if (candidate) {
      await tx.select({ id: users.id }).from(users).where(eq(users.id, candidate.userId)).for("update").limit(1);
    }
    const orderRows = candidate
      ? await tx.select({
        id: paymentOrders.id,
        userId: paymentOrders.userId,
        planId: paymentOrders.planId,
        referenceCode: paymentOrders.referenceCode,
        amountVnd: paymentOrders.amountVnd,
        status: paymentOrders.status,
        expiresAt: paymentOrders.expiresAt,
      }).from(paymentOrders).where(eq(paymentOrders.id, candidate.id)).for("update").limit(1)
      : [];
    const order = orderRows[0] ?? null;

    const insertedEvents = await tx.insert(paymentEvents).values({
      orderId: order?.id ?? null,
      providerEventId,
      payload,
      signatureValid: true,
      createdAt: now,
    }).onConflictDoNothing({ target: paymentEvents.providerEventId }).returning({ id: paymentEvents.id });
    const eventId = insertedEvents[0]?.id;
    if (!eventId) return { outcome: "duplicate", ...(order ? { orderId: order.id } : {}) };
    if (!order) {
      await markEventProcessed(tx, eventId, now);
      return { outcome: "unmatched" };
    }

    const bankAccount = getSepayBankAccount();
    if (payload.transferType !== "in"
      || !accountNumberMatchesSepayConfig(payload.accountNumber, bankAccount.accountNumber)) {
      await markEventProcessed(tx, eventId, now);
      return { outcome: "ignored", orderId: order.id };
    }
    if (order.status !== "pending") {
      await markEventProcessed(tx, eventId, now);
      return { outcome: order.status === "paid" ? "duplicate" : "ignored", orderId: order.id };
    }
    if (order.expiresAt.getTime() <= now.getTime()) {
      await flagPaymentForReview(tx, { eventId, now, order, payload, reason: "order_expired" });
      return { outcome: "manual_review", orderId: order.id };
    }
    if (payload.transferAmount !== order.amountVnd) {
      await flagPaymentForReview(tx, { eventId, now, order, payload, reason: "amount_mismatch" });
      return { outcome: "manual_review", orderId: order.id };
    }

    const activation = await grantOrExtendVipAccessInTransaction(tx, {
      userId: order.userId,
      planId: order.planId,
    }, null, "sepay");
    if (!activation.ok) throw new Error(`Không thể kích hoạt VIP từ SePay: ${activation.error}`);

    const paidAt = parseSepayTransactionDate(payload.transactionDate) ?? now;
    await tx.update(paymentOrders).set({
      status: "paid",
      subscriptionId: activation.id,
      providerTransactionId: String(payload.id),
      paidAt,
      updatedAt: now,
    }).where(eq(paymentOrders.id, order.id));

    const pendingRequests = await tx.select({
      id: vipActivationRequests.id,
      planId: vipActivationRequests.planId,
    }).from(vipActivationRequests).where(and(
      eq(vipActivationRequests.userId, order.userId),
      eq(vipActivationRequests.status, "pending"),
    )).for("update").limit(1);
    const pendingRequest = pendingRequests[0];
    if (pendingRequest) {
      const samePlan = pendingRequest.planId === order.planId;
      await tx.update(vipActivationRequests).set({
        status: samePlan ? "approved" : "cancelled",
        adminNote: samePlan
          ? "Tự động kích hoạt sau khi SePay xác nhận thanh toán."
          : "Tự động đóng do người học đã thanh toán một gói khác qua SePay.",
        reviewedAt: now,
        subscriptionId: samePlan ? activation.id : null,
        updatedAt: now,
      }).where(eq(vipActivationRequests.id, pendingRequest.id));
    }

    await createNotificationInTransaction(tx, {
      userId: order.userId,
      type: "payment_succeeded",
      title: "Thanh toán SePay thành công",
      message: "Giao dịch đã được đối soát và quyền học VIP đã được kích hoạt trên tài khoản của bạn.",
      href: "/account",
      entityType: "payment_order",
      entityId: order.id,
    });
    await tx.insert(auditLogs).values({
      action: "payment.sepay.completed",
      entityType: "payment_order",
      entityId: order.id,
      metadata: {
        planId: order.planId,
        referenceCode: order.referenceCode,
        sepayTransactionId: payload.id,
        bankReferenceCode: payload.referenceCode,
        gateway: payload.gateway,
        transferAmount: payload.transferAmount,
        subscriptionId: activation.id,
      },
    });
    await markEventProcessed(tx, eventId, now);
    return { outcome: "paid", orderId: order.id };
  }));
}
