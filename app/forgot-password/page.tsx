import type { Metadata } from "next";
import Link from "next/link";
import { MailQuestion } from "lucide-react";

export const metadata: Metadata = { title: "Quên mật khẩu", robots: { index: false, follow: false } };

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ sent?: string }> }) {
  const params = await searchParams;
  return <main className="auth-page"><section className="auth-card">
    <div className="auth-brand"><span className="brand-mark" lang="zh">汉</span><span>HanziWork</span></div>
    <div className="auth-icon"><MailQuestion size={24} /></div>
    <div className="auth-heading"><span>Bảo mật tài khoản</span><h1>Đặt lại mật khẩu</h1><p>Nhập email đã đăng ký. Nếu tài khoản tồn tại, HanziWork sẽ gửi một liên kết dùng một lần.</p></div>
    {params.sent === "1" ? <p className="auth-notice" role="status">Nếu email khớp với một tài khoản, liên kết đặt lại mật khẩu đã được gửi. Hãy kiểm tra cả thư rác.</p> : null}
    <form action="/api/auth/forgot-password" className="auth-form" method="post">
      <label>Email<input autoCapitalize="none" autoComplete="email" inputMode="email" maxLength={255} name="email" required type="email" /></label>
      <button className="button button-primary button-full" type="submit">Gửi liên kết đặt lại</button>
    </form>
    <div className="auth-switch"><Link href="/login">Quay lại đăng nhập</Link></div>
  </section></main>;
}
