import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser } from "./auth-session.ts";
import { isPracticeStaffRole } from "./practice-workflow.ts";

export async function requireAdminUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login?error=required");
  if (user.role !== "admin") redirect("/admin/login?error=forbidden");
  return user;
}

export async function requirePracticeStaffUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login?error=required&returnTo=/admin/practice");
  if (!isPracticeStaffRole(user.role)) redirect("/admin/login?error=forbidden&returnTo=/admin/practice");
  return { ...user, role: user.role };
}
