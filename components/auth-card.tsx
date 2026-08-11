"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Home, KeyRound, LockKeyhole, Mail, RotateCcw, ShieldCheck, UserPlus } from "lucide-react";
import { BrandMark } from "@/components/brand-logo";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/lib/auth-validation";

type AuthMode = "login" | "register" | "admin";

const errorMessages: Record<string, string> = {
  duplicate: "Email này đã được sử dụng.",
  email_in_use: "Email này đã được sử dụng. Hãy đăng nhập hoặc dùng email khác.",
  invalid_credentials: "Email hoặc mật khẩu không đúng. Với Console, tài khoản cũng phải có quyền editor, reviewer hoặc admin.",
  invalid_email: "Địa chỉ email chưa đúng định dạng.",
  invalid_name: "Tên hiển thị cần từ 2 đến 120 ký tự.",
  invalid_password: `Mật khẩu cần từ ${MIN_PASSWORD_LENGTH} đến ${MAX_PASSWORD_LENGTH} ký tự.`,
  password_mismatch: "Hai mật khẩu chưa trùng nhau.",
  password_changed: "Mật khẩu đã được đổi. Hãy đăng nhập lại bằng mật khẩu mới.",
  password_reset: "Mật khẩu đã được đặt lại và các phiên cũ đã bị thu hồi. Hãy đăng nhập lại.",
  rate_limited: "Có quá nhiều yêu cầu trong thời gian ngắn. Hãy đợi một lúc rồi thử lại.",
  required: "Hãy đăng nhập để tiếp tục.",
  forbidden: "Tài khoản hiện tại không có quyền truy cập khu vực quản trị.",
};

export function AuthCard({ mode, error, returnTo }: { mode: AuthMode; error?: string; returnTo: string }) {
  const [motionRun, setMotionRun] = useState(0);
  const [motionReady, setMotionReady] = useState(false);
  const registering = mode === "register";
  const admin = mode === "admin";
  const learnerLogin = mode === "login";
  const title = registering ? "Tạo tài khoản học" : admin ? "Đăng nhập quản trị" : "Sẵn sàng cho ca học hôm nay?";
  const description = registering
    ? "Tạo tài khoản để đồng bộ bài học, Luyện ca, trò chơi và lịch ôn trên các thiết bị của bạn."
    : admin
      ? "Console dành cho biên tập viên, kiểm duyệt viên và quản trị viên đã được phân quyền."
      : "Đăng nhập để tiếp tục đúng bài đang học.";
  const Icon = registering ? UserPlus : admin ? ShieldCheck : KeyRound;
  const action = registering ? "/api/auth/register" : "/api/auth/login";
  const notice = error === "password_changed" || error === "password_reset";

  useEffect(() => {
    if (!learnerLogin) return;
    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => setMotionReady(true));
    });
    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
    };
  }, [learnerLogin, motionRun]);

  return <main className={`auth-page ${learnerLogin ? "auth-page-login-scene" : ""} ${motionReady ? "auth-login-motion-ready" : ""}`.trim()}>
    {learnerLogin ? <>
      <div aria-hidden="true" className="auth-login-scene-art" />
      <div aria-hidden="true" className="auth-login-scene-foreground" />
      <Link aria-label="HanziWork - Về trang chủ" className="auth-scene-brand" href="/"><BrandMark priority /><span>HanziWork</span></Link>
      <Link className="auth-scene-home" href="/"><Home aria-hidden="true" size={17} />Về trang chủ</Link>
      <button aria-label="Phát lại chuyển động" className="auth-scene-replay" onClick={() => { setMotionReady(false); setMotionRun((run) => run + 1); }} title="Xem lại chuyển động" type="button"><RotateCcw aria-hidden="true" size={17} /></button>
      <span aria-hidden="true" className="auth-motion-walker"><span className="auth-motion-walker-shadow" /><span className="auth-motion-walker-sprite" /></span>
    </> : null}
    <section className={`auth-card ${admin ? "auth-card-admin" : ""} ${learnerLogin ? "auth-card-login-scene" : ""}`.trim()}>
    {!learnerLogin ? <div className="auth-brand"><BrandMark priority /><span>HanziWork</span></div> : null}
    {!learnerLogin ? <div className="auth-icon"><Icon size={24} /></div> : null}
    <div className="auth-heading"><span>{admin ? "HanziWork Console" : "Tài khoản HanziWork"}</span><h1>{title}</h1><p>{description}</p></div>
    {error && errorMessages[error] ? <p className={notice ? "auth-notice" : "auth-error"} role="status">{errorMessages[error]}</p> : null}
    <form action={action} className="auth-form" method="post">
      <input name="returnTo" type="hidden" value={returnTo} />
      {admin ? <input name="mode" type="hidden" value="admin" /> : null}
      {registering ? <label>Họ và tên<input autoComplete="name" maxLength={120} minLength={2} name="displayName" required type="text" /></label> : null}
      <label><span>Email</span><span className="auth-input-shell"><Mail aria-hidden="true" size={18} /><input autoCapitalize="none" autoComplete="email" inputMode="email" maxLength={255} name="email" placeholder={learnerLogin ? "Nhập email của bạn" : undefined} required type="email" /></span></label>
      <label><span>Mật khẩu</span><span className="auth-input-shell"><LockKeyhole aria-hidden="true" size={18} /><input autoComplete={registering ? "new-password" : "current-password"} maxLength={MAX_PASSWORD_LENGTH} minLength={MIN_PASSWORD_LENGTH} name="password" placeholder={learnerLogin ? "Nhập mật khẩu của bạn" : undefined} required type="password" /></span></label>
      {registering ? <label><span>Nhập lại mật khẩu</span><span className="auth-input-shell"><LockKeyhole aria-hidden="true" size={18} /><input autoComplete="new-password" maxLength={MAX_PASSWORD_LENGTH} minLength={MIN_PASSWORD_LENGTH} name="confirmPassword" required type="password" /></span></label> : null}
      <button className="button button-primary button-full" type="submit"><span>{registering ? "Tạo tài khoản" : "Đăng nhập"}</span>{learnerLogin ? <ArrowRight aria-hidden="true" size={18} /> : null}</button>
    </form>
    <div className="auth-switch">
      {admin
        ? <><Link href="/login">Đăng nhập người học</Link><span>·</span><Link href="/">Về trang chủ</Link></>
        : registering
          ? <p>Đã có tài khoản? <Link href={`/login?returnTo=${encodeURIComponent(returnTo)}`}>Đăng nhập</Link></p>
          : <div><p><Link href="/forgot-password">Quên mật khẩu?</Link></p><p>Chưa có tài khoản? <Link href={`/register?returnTo=${encodeURIComponent(returnTo)}`}>Đăng ký miễn phí</Link></p></div>}
    </div>
  </section></main>;
}
