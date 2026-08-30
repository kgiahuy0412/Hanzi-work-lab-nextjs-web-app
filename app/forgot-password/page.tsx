import type { Metadata } from "next";
import { AuthCard } from "@/components/auth-card";
import { safeReturnTo } from "@/lib/auth-validation";

export const metadata: Metadata = { title: "Quên mật khẩu", robots: { index: false, follow: false } };

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ returnTo?: string; sent?: string }> }) {
  const params = await searchParams;
  return <AuthCard mode="forgot-password" returnTo={safeReturnTo(params.returnTo)} sent={params.sent === "1"} />;
}
