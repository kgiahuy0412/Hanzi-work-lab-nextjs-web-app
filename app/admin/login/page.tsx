import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth-card";
import { getCurrentUser } from "@/lib/auth-session";
import { isPracticeStaffRole } from "@/lib/practice-workflow";

export const metadata: Metadata = { title: "Đăng nhập quản trị" };

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string; returnTo?: string }> }) {
  const [params, user] = await Promise.all([searchParams, getCurrentUser()]);
  if (user?.role === "admin") redirect("/admin");
  if (user && isPracticeStaffRole(user.role)) redirect("/admin/practice");
  return <AuthCard error={params.error} mode="admin" returnTo={params.returnTo ?? "/admin"} />;
}
