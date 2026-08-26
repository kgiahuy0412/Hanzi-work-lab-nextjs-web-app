import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth-card";
import { getCurrentUser } from "@/lib/auth-session";
import { safeReturnTo } from "@/lib/auth-validation";

export const metadata: Metadata = { title: "Đăng ký" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string; preview?: string; returnTo?: string }> }) {
  const [params, user] = await Promise.all([searchParams, getCurrentUser()]);
  const returnTo = safeReturnTo(params.returnTo);
  if (user) redirect(returnTo);
  const previewSuccess = process.env.NODE_ENV !== "production" && params.preview === "success";
  return <AuthCard error={params.error} initialRegisterSuccess={previewSuccess} mode="register" returnTo={returnTo} />;
}
