import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { BrandMark, BrandWordmark } from "@/components/brand-logo";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH, validateAuthToken } from "@/lib/auth-validation";

export const metadata: Metadata = {
  title: "Đặt lại mật khẩu",
  referrer: "origin",
  robots: { index: false, follow: false },
};

const errors: Record<string, string> = {
  invalid_or_expired: "Liên kết đặt lại mật khẩu không hợp lệ, đã hết hạn hoặc đã được sử dụng.",
  invalid_password: `Mật khẩu mới cần từ ${MIN_PASSWORD_LENGTH} đến ${MAX_PASSWORD_LENGTH} ký tự.`,
  password_mismatch: "Hai mật khẩu mới chưa trùng nhau.",
  rate_limited: "Có quá nhiều yêu cầu. Hãy đợi một lúc rồi thử lại.",
};

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const params = await searchParams;
  const token = params.token?.slice(0, 128) ?? "";
  const hasToken = validateAuthToken(token);
  return <main className="auth-page"><section className="auth-card">
    <div className="auth-brand"><BrandMark priority /><BrandWordmark /></div>
    <div className="auth-icon"><KeyRound size={24} /></div>
    <div className="auth-heading"><span>Bảo mật tài khoản</span><h1>Chọn mật khẩu mới</h1><p>Đặt mật khẩu mới cho tài khoản. Sau khi hoàn tất, mọi phiên đăng nhập cũ sẽ bị thu hồi.</p></div>
    {params.error && errors[params.error] ? <p className="auth-error" role="alert">{errors[params.error]}</p> : null}
    {hasToken ? <form action="/api/auth/reset-password" className="auth-form" method="post">
      <input name="token" type="hidden" value={token} />
      <label>Mật khẩu mới<input autoComplete="new-password" maxLength={MAX_PASSWORD_LENGTH} minLength={MIN_PASSWORD_LENGTH} name="password" required type="password" /></label>
      <label>Nhập lại mật khẩu mới<input autoComplete="new-password" maxLength={MAX_PASSWORD_LENGTH} minLength={MIN_PASSWORD_LENGTH} name="confirmPassword" required type="password" /></label>
      <button className="button button-primary button-full" type="submit">Đặt lại mật khẩu</button>
    </form> : <div className="auth-switch"><Link href="/forgot-password">Yêu cầu liên kết mới</Link></div>}
  </section></main>;
}
