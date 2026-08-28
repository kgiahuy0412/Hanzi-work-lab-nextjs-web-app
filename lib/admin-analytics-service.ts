import "server-only";

import { and, asc, desc, eq, gte, gt, isNull, lte, or, sql } from "drizzle-orm";
import { readDb } from "../db/index.ts";
import { paymentOrders, subscriptions, users, vipPlans } from "../db/schema.ts";
import {
  adminPeriodRange,
  buildAdminTimeSeries,
  type AdminPeriod,
} from "./admin-reporting.ts";

export async function getAdminBusinessAnalytics(period: AdminPeriod, now = new Date()) {
  const range = adminPeriodRange(period, now);
  return readDb(async (db) => {
    const activeVipFilter = and(
      eq(subscriptions.status, "active"),
      or(isNull(subscriptions.startsAt), lte(subscriptions.startsAt, now)),
      or(isNull(subscriptions.endsAt), gt(subscriptions.endsAt, now)),
    );
    const [
      summaryRows,
      revenueEntries,
      newUserEntries,
      recentUsers,
      recentPayments,
    ] = await Promise.all([
      db.select({
        totalUsers: sql<number>`(select count(*)::int from ${users})`,
        learnerCount: sql<number>`(select count(*)::int from ${users} where ${users.role} = 'learner')`,
        activeVip: sql<number>`(select count(distinct ${subscriptions.userId})::int from ${subscriptions} where ${activeVipFilter})`,
        vipRegistrations: sql<number>`(select count(*)::int from ${subscriptions} where ${subscriptions.createdAt} >= ${range.start})`,
      }),
      db.select({ amountVnd: paymentOrders.amountVnd, paidAt: paymentOrders.paidAt })
        .from(paymentOrders)
        .where(and(eq(paymentOrders.status, "paid"), gte(paymentOrders.paidAt, range.start)))
        .orderBy(asc(paymentOrders.paidAt)),
      db.select({ createdAt: users.createdAt }).from(users)
        .where(gte(users.createdAt, range.start))
        .orderBy(asc(users.createdAt)),
      db.select({
        id: users.id,
        displayName: users.displayName,
        email: users.email,
        createdAt: users.createdAt,
      }).from(users).orderBy(desc(users.createdAt)).limit(8),
      db.select({
        id: paymentOrders.id,
        userId: paymentOrders.userId,
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
        .limit(12),
    ]);

    const totalUsers = summaryRows[0]?.totalUsers ?? 0;
    const learnerCount = summaryRows[0]?.learnerCount ?? 0;
    const activeVip = summaryRows[0]?.activeVip ?? 0;
    const revenue = revenueEntries.reduce((sum, entry) => sum + entry.amountVnd, 0);
    const recentActivity = [
      ...recentUsers.map((entry) => ({
        id: `user-${entry.id}`,
        type: "user" as const,
        title: "Đăng ký tài khoản mới",
        detail: entry.displayName || entry.email,
        occurredAt: entry.createdAt,
      })),
      ...recentPayments.map((entry) => ({
        id: `payment-${entry.id}`,
        type: "payment" as const,
        title: entry.status === "paid" ? "Thanh toán thành công" : "Cập nhật thanh toán",
        detail: `${entry.displayName || entry.email} · ${entry.planName}`,
        occurredAt: entry.paidAt ?? entry.createdAt,
      })),
    ].sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime()).slice(0, 10);

    return {
      period: range,
      stats: {
        activeVip,
        conversionRate: learnerCount > 0 ? activeVip / learnerCount * 100 : 0,
        newUsers: newUserEntries.length,
        revenue,
        totalUsers,
        vipRegistrations: summaryRows[0]?.vipRegistrations ?? 0,
      },
      revenueSeries: buildAdminTimeSeries(range, revenueEntries, (entry) => entry.paidAt, (entry) => entry.amountVnd),
      userSeries: buildAdminTimeSeries(range, newUserEntries, (entry) => entry.createdAt, () => 1),
      recentActivity,
      recentTransactions: recentPayments,
    };
  });
}
