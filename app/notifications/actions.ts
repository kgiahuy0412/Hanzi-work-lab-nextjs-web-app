"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isUuid, valueString } from "@/lib/admin-content-validation";
import { getCurrentUser } from "@/lib/auth-session";
import {
  markAllUserNotificationsRead,
  markUserNotificationRead,
  openUserNotification,
} from "@/lib/notification-service";

async function requireNotificationUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?returnTo=%2Fnotifications");
  return user;
}

function refreshNotifications() {
  revalidatePath("/", "layout");
  revalidatePath("/notifications");
}

export async function openNotificationAction(formData: FormData) {
  const user = await requireNotificationUser();
  const notificationId = valueString(formData, "notificationId", 40);
  if (!isUuid(notificationId)) redirect("/notifications?error=invalid_input");
  const href = await openUserNotification(notificationId, user.id);
  if (!href) redirect("/notifications?error=not_found");
  refreshNotifications();
  redirect(href);
}

export async function markNotificationReadAction(formData: FormData) {
  const user = await requireNotificationUser();
  const notificationId = valueString(formData, "notificationId", 40);
  if (!isUuid(notificationId)) redirect("/notifications?error=invalid_input");
  const marked = await markUserNotificationRead(notificationId, user.id);
  if (!marked) redirect("/notifications?error=not_found");
  refreshNotifications();
  redirect("/notifications?success=read");
}

export async function markAllNotificationsReadAction() {
  const user = await requireNotificationUser();
  await markAllUserNotificationsRead(user.id);
  refreshNotifications();
  redirect("/notifications?success=all_read");
}
