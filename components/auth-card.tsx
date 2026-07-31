import Link from "next/link";
import { KeyRound, ShieldCheck, UserPlus } from "lucide-react";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/lib/auth-validation";

type AuthMode = "login" | "register" | "admin";

const errorMessages: Record<string, string> = {
  duplicate: "Email này đã được sử dụng.",
  email_in_use: "Email này đã được sử dụng. Hãy đăng nhập hoặc dùng email khác.",
  invalid_credentials: "Email hoặc mật khẩu không đúng. Với trang quản trị, tài khoản cũng phải có quyền admin.",
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
  const registering = mode === "register";
  const admin = mode === "admin";
  const title = registering ? "Tạo tài khoản học" : admin ? "Đăng nhập quản trị" : "Chào mừng bạn trở lại";
  const description = registering
    ? "Tạo tài khoản learner để chuẩn bị lưu tiến độ và lịch ôn của riêng bạn."
    : admin
      ? "Khu vực này dùng chung hệ thống tài khoản nhưng chỉ chấp nhận vai trò admin."
      : "Đăng nhập để nhận đúng quyền VIP và tiếp tục hành trình học của bạn.";
  const Icon = registering ? UserPlus : admin ? ShieldCheck : KeyRound;
  const action = registering ? "/api/auth/register" : "/api/auth/login";
  const notice = error === "password_changed" || error === "password_reset";

  return <main className="auth-page"><section className={`auth-card ${admin ? "auth-card-admin" : ""}`}>
    <div className="auth-brand"><span className="brand-mark" lang="zh">汉</span><span>HanziWork</span></div>
    <div className="auth-icon"><Icon size={24} /></div>
    <div className="auth-heading"><span>{admin ? "HanziWork Console" : "Tài khoản HanziWork"}</span><h1>{title}</h1><p>{description}</p></div>
    {error && errorMessages[error] ? <p className={notice ? "auth-notice" : "auth-error"} role="status">{errorMessages[error]}</p> : null}
    <form action={action} className="auth-form" method="post">
      <input name="returnTo" type="hidden" value={returnTo} />
      {admin ? <input name="mode" type="hidden" value="admin" /> : null}
      {registering ? <label>Họ và tên<input autoComplete="name" maxLength={120} minLength={2} name="displayName" required type="text" /></label> : null}
      <label>Email<input autoCapitalize="none" autoComplete="email" inputMode="email" maxLength={255} name="email" required type="email" /></label>
      <label>Mật khẩu<input autoComplete={registering ? "new-password" : "current-password"} maxLength={MAX_PASSWORD_LENGTH} minLength={MIN_PASSWORD_LENGTH} name="password" required type="password" /></label>
      {registering ? <label>Nhập lại mật khẩu<input autoComplete="new-password" maxLength={MAX_PASSWORD_LENGTH} minLength={MIN_PASSWORD_LENGTH} name="confirmPassword" required type="password" /></label> : null}
      <button className="button button-primary button-full" type="submit">{registering ? "Tạo tài khoản" : "Đăng nhập"}</button>
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
