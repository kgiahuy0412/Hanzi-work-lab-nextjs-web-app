import "server-only";

import { and, count, desc, eq, isNull } from "drizzle-orm";
import { readDb, writeDb, type Database } from "../db/index.ts";
import { notifications } from "../db/schema.ts";
import { safeReturnTo } from "./auth-validation.ts";

type DbTransaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

export type NotificationType = "payment_succeeded" | "vip_request_approved" | "vip_request_rejected" | "system";

function bounded(value: string, maximum: number): string {
  return value.trim().slice(0, maximum);
}

export async function createNotificationInTransaction(tx: DbTransaction, input: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  href: string;
  entityType?: string | null;
  entityId?: string | null;
}): Promise<string | null> {
  const title = bounded(input.title, 180);
  const message = bounded(input.message, 2_000);
  if (!title || !message) return null;
  const inserted = await tx.insert(notifications).values({
    userId: input.userId,
    type: input.type,
    title,
    message,
    href: safeReturnTo(input.href, "/notifications").slice(0, 500),
    entityType: input.entityType ? bounded(input.entityType, 80) : null,
    entityId: input.entityId ?? null,
  }).onConflictDoNothing().returning({ id: notifications.id });
  return inserted[0]?.id ?? null;
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  if (!process.env.DATABASE_URL) return 0;
  return readDb(async (db) => {
    const rows = await db.select({ value: count() }).from(notifications).where(and(
      eq(notifications.userId, userId),
      isNull(notifications.readAt),
    ));
    return rows[0]?.value ?? 0;
  });
}

export async function getUserNotifications(userId: string, limit = 50) {
  return readDb((db) => db.select({
    id: notifications.id,
    type: notifications.type,
    title: notifications.title,
    message: notifications.message,
    href: notifications.href,
    readAt: notifications.readAt,
    createdAt: notifications.createdAt,
  }).from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(Math.max(1, Math.min(limit, 100))));
}

export async function openUserNotification(notificationId: string, userId: string) {
  return writeDb((db) => db.transaction(async (tx) => {
    const rows = await tx.select({
      id: notifications.id,
      href: notifications.href,
      readAt: notifications.readAt,
    }).from(notifications).where(and(
      eq(notifications.id, notificationId),
      eq(notifications.userId, userId),
    )).for("update").limit(1);
    const notification = rows[0];
    if (!notification) return null;
    if (!notification.readAt) {
      await tx.update(notifications).set({ readAt: new Date() }).where(eq(notifications.id, notification.id));
    }
    return safeReturnTo(notification.href, "/notifications");
  }));
}

export async function markUserNotificationRead(notificationId: string, userId: string): Promise<boolean> {
  return writeDb(async (db) => {
    const rows = await db.update(notifications).set({ readAt: new Date() }).where(and(
      eq(notifications.id, notificationId),
      eq(notifications.userId, userId),
    )).returning({ id: notifications.id });
    return rows.length > 0;
  });
}

export async function markAllUserNotificationsRead(userId: string): Promise<number> {
  return writeDb(async (db) => {
    const rows = await db.update(notifications).set({ readAt: new Date() }).where(and(
      eq(notifications.userId, userId),
      isNull(notifications.readAt),
    )).returning({ id: notifications.id });
    return rows.length;
  });
}
