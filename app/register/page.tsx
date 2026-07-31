import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth-card";
import { getCurrentUser } from "@/lib/auth-session";
import { safeReturnTo } from "@/lib/auth-validation";

export const metadata: Metadata = { title: "Đăng ký" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string; returnTo?: string }> }) {
  const [params, user] = await Promise.all([searchParams, getCurrentUser()]);
  const returnTo = safeReturnTo(params.returnTo);
  if (user) redirect(returnTo);
  return <AuthCard error={params.error} mode="register" returnTo={returnTo} />;
}
