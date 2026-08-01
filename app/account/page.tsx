import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BadgeCheck, Crown, ShieldCheck, UserRound } from "lucide-react";
import { getCurrentUser } from "@/lib/auth-session";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/lib/auth-validation";
import { getLearningSummary } from "@/lib/progress-repository";
import { LearnerPageHeader } from "@/components/learner-page-header";

export const metadata: Metadata = { title: "Tài khoản" };

const roleLabels = { learner: "Người học", editor: "Biên tập viên", reviewer: "Người duyệt", admin: "Quản trị viên" } as const;

const accountErrors = {
  invalid_current_password: "Mật khẩu hiện tại chưa đúng.",
  invalid_password: `Mật khẩu mới cần từ ${MIN_PASSWORD_LENGTH} đến ${MAX_PASSWORD_LENGTH} ký tự.`,
  password_mismatch: "Hai mật khẩu mới chưa trùng nhau.",
} as const;

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ error?: keyof typeof accountErrors; verified?: string }> }) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);
  if (!user) redirect("/login?returnTo=/account&error=required");
  const summary = await getLearningSummary(user.id);

  return <main className="account-page"><div className="section-shell account-page-inner">
    <LearnerPageHeader
      aside={<div className="account-header-avatar"><UserRound size={28} /><span>{roleLabels[user.role]}</span></div>}
      description={`${user.email} · Quản lý thông tin đăng nhập và tiến độ học của bạn.`}
      eyebrow="Tài khoản HanziWork"
      eyebrowIcon={UserRound}
      meta={<><span><BadgeCheck size={16} />Email đã xác minh</span><span><Crown size={16} /><strong>{summary.completedLessons}</strong> bài hoàn thành</span></>}
      title={user.displayName}
    />
    <section className="account-card">
    {params.verified === "1" ? <p className="auth-notice" role="status">Email đã được xác minh. Tài khoản của bạn đã sẵn sàng.</p> : null}
    <dl><div><dt>Vai trò</dt><dd><ShieldCheck size={16} /> {roleLabels[user.role]}</dd></div><div><dt>Email</dt><dd><BadgeCheck size={16} /> Đã xác minh</dd></div><div><dt>Tiến độ</dt><dd>{summary.completedLessons} bài hoàn thành · {summary.openedLessons} bài đã mở</dd></div><div><dt>Quyền VIP</dt><dd><Crown size={16} /> Được kiểm tra trực tiếp từ subscription khi mở bài</dd></div></dl>
    <section className="account-security"><h2>Đổi mật khẩu</h2><p>Đổi xong, mọi phiên đăng nhập sẽ được thu hồi để bảo vệ tài khoản.</p>
      {params.error && accountErrors[params.error] ? <p className="auth-error" role="alert">{accountErrors[params.error]}</p> : null}
      <form action="/api/auth/change-password" className="auth-form" method="post">
        <label>Mật khẩu hiện tại<input autoComplete="current-password" maxLength={MAX_PASSWORD_LENGTH} name="currentPassword" required type="password" /></label>
        <label>Mật khẩu mới<input autoComplete="new-password" maxLength={MAX_PASSWORD_LENGTH} minLength={MIN_PASSWORD_LENGTH} name="nextPassword" required type="password" /></label>
        <label>Nhập lại mật khẩu mới<input autoComplete="new-password" maxLength={MAX_PASSWORD_LENGTH} minLength={MIN_PASSWORD_LENGTH} name="confirmPassword" required type="password" /></label>
        <button className="button button-secondary" type="submit">Cập nhật mật khẩu</button>
      </form>
    </section>
    <form action="/api/auth/logout" method="post"><input name="returnTo" type="hidden" value="/" /><button className="button button-quiet" type="submit">Đăng xuất</button></form>
    </section>
  </div></main>;
}
