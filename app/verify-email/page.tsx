import type { Metadata } from "next";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { BrandMark, BrandWordmark } from "@/components/brand-logo";
import { validateAuthToken } from "@/lib/auth-validation";

export const metadata: Metadata = {
  title: "Xác minh email",
  referrer: "origin",
  robots: { index: false, follow: false },
};

const errors: Record<string, string> = {
  delivery_failed: "Chưa gửi được email. Hãy thử lại sau hoặc kiểm tra cấu hình email của hệ thống.",
  invalid_or_expired: "Liên kết xác minh không hợp lệ, đã hết hạn hoặc đã được sử dụng.",
  rate_limited: "Có quá nhiều yêu cầu. Hãy đợi một lúc rồi thử lại.",
};

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string; sent?: string; required?: string; error?: string }> }) {
  const params = await searchParams;
  const token = params.token?.slice(0, 128) ?? "";
  const hasToken = validateAuthToken(token);
  return <main className="auth-page"><section className="auth-card">
    <div className="auth-brand"><BrandMark priority /><BrandWordmark /></div>
    <div className="auth-icon"><MailCheck size={24} /></div>
    <div className="auth-heading"><span>Bảo mật tài khoản</span><h1>{hasToken ? "Xác nhận email" : "Kiểm tra hộp thư"}</h1><p>{hasToken ? "Bấm xác nhận để kích hoạt tài khoản. Liên kết này chỉ dùng được một lần." : "Himi Chinese yêu cầu xác minh email trước khi tạo phiên đăng nhập."}</p></div>
    {params.error && errors[params.error] ? <p className="auth-error" role="alert">{errors[params.error]}</p> : null}
    {!params.error && (params.sent === "1" || params.required === "1") ? <p className="auth-notice" role="status">Nếu email khớp với tài khoản chưa xác minh, một liên kết đã được gửi. Hãy kiểm tra cả thư rác.</p> : null}
    {hasToken ? <form action="/api/auth/verify-email" className="auth-form" method="post">
      <input name="token" type="hidden" value={token} />
      <button className="button button-primary button-full" type="submit">Xác minh và tiếp tục</button>
    </form> : <form action="/api/auth/resend-verification" className="auth-form" method="post">
      <label>Email<input autoCapitalize="none" autoComplete="email" inputMode="email" maxLength={255} name="email" required type="email" /></label>
      <button className="button button-secondary button-full" type="submit">Gửi lại email xác minh</button>
    </form>}
    <div className="auth-switch"><Link href="/login">Quay lại đăng nhập</Link></div>
  </section></main>;
}
