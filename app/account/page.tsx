import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BadgeCheck, Clock3, Crown, ShieldCheck, UserRound } from "lucide-react";
import { getCurrentUser } from "@/lib/auth-session";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/lib/auth-validation";
import { getLearningSummary } from "@/lib/progress-repository";
import { LearnerPageHeader } from "@/components/learner-page-header";
import { getActiveVipSubscription, vipDaysRemaining } from "@/lib/vip-subscription";
import { getPendingVipActivationRequest } from "@/lib/vip-activation-request-service";
import { cancelVipActivationRequestAction } from "@/app/vip/actions";

export const metadata: Metadata = { title: "Tài khoản" };

const roleLabels = { learner: "Người học", editor: "Biên tập viên", reviewer: "Người duyệt", admin: "Quản trị viên" } as const;

const accountErrors = {
  invalid_current_password: "Mật khẩu hiện tại chưa đúng.",
  invalid_password: `Mật khẩu mới cần từ ${MIN_PASSWORD_LENGTH} đến ${MAX_PASSWORD_LENGTH} ký tự.`,
  password_mismatch: "Hai mật khẩu mới chưa trùng nhau.",
  invalid_input: "Yêu cầu chưa hợp lệ. Hãy tải lại trang và thử lại.",
  not_found: "Không tìm thấy yêu cầu VIP này.",
  vip_request_not_pending: "Yêu cầu VIP đã được xử lý trước đó.",
} as const;

const accountSuccess = {
  request_cancelled: "Đã hủy yêu cầu VIP đang chờ.",
} as const;

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ error?: keyof typeof accountErrors; success?: keyof typeof accountSuccess; verified?: string }> }) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);
  if (!user) redirect("/login?returnTo=/account&error=required");
  const [summary, vipSubscription, pendingVipRequest] = await Promise.all([
    getLearningSummary(user.id),
    getActiveVipSubscription(user.id),
    getPendingVipActivationRequest(user.id),
  ]);
  const daysRemaining = vipSubscription ? vipDaysRemaining(vipSubscription.endsAt) : null;
  const vipExpiry = vipSubscription?.endsAt?.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  });

  return <main className="account-page"><div className="section-shell account-page-inner">
    <LearnerPageHeader
      aside={<div className="account-header-avatar"><UserRound size={28} /><span>{roleLabels[user.role]}</span></div>}
      description={`${user.email} · Quản lý thông tin đăng nhập và tiến độ học của bạn.`}
      eyebrow="Tài khoản HanziWork"
      eyebrowIcon={UserRound}
      meta={<><span><BadgeCheck size={16} />Email đã xác minh</span><span><Crown size={16} /><strong>{vipSubscription ? "VIP đang mở" : "Gói miễn phí"}</strong></span><span><ShieldCheck size={16} /><strong>{summary.completedLessons}</strong> bài hoàn thành</span></>}
      title={user.displayName}
    />
    <section className="account-card">
    {params.verified === "1" ? <p className="auth-notice" role="status">Email đã được xác minh. Tài khoản của bạn đã sẵn sàng.</p> : null}
    {params.success && accountSuccess[params.success] ? <p className="auth-notice" role="status">{accountSuccess[params.success]}</p> : null}
    {params.error && accountErrors[params.error] ? <p className="auth-error" role="alert">{accountErrors[params.error]}</p> : null}
    <dl><div><dt>Vai trò</dt><dd><ShieldCheck size={16} /> {roleLabels[user.role]}</dd></div><div><dt>Email</dt><dd><BadgeCheck size={16} /> Đã xác minh</dd></div><div><dt>Tiến độ</dt><dd>{summary.completedLessons} bài hoàn thành · {summary.openedLessons} bài đã mở</dd></div></dl>
    <section className={`account-vip-status ${vipSubscription ? "is-active" : ""}`}>
      <span className="account-vip-icon"><Crown size={21} /></span>
      <div>
        <span>Quyền học hiện tại</span>
        <h2>{vipSubscription?.planName ?? "Gói miễn phí"}</h2>
        {vipSubscription ? <p><Clock3 size={14} /> {vipExpiry ? `Hiệu lực đến ${vipExpiry}` : "Không giới hạn thời gian"}{daysRemaining === null ? "" : ` · còn ${daysRemaining} ngày`}</p> : <p>Nội dung VIP trong Lộ trình và Luyện ca vẫn đang khóa.</p>}
      </div>
      <Link href={vipSubscription ? "/practice" : "/vip"}>{vipSubscription ? "Vào kho luyện" : "Xem quyền lợi VIP"} <ArrowRight size={15} /></Link>
    </section>
    {pendingVipRequest ? <section className="account-vip-request">
      <span className="account-vip-icon"><Clock3 size={21} /></span>
      <div>
        <span>Yêu cầu VIP đang chờ</span>
        <h2>{pendingVipRequest.planName}</h2>
        <p>Đã gửi ngày {pendingVipRequest.createdAt.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", timeZone: "Asia/Ho_Chi_Minh", year: "numeric" })} · {pendingVipRequest.durationDays} ngày</p>
      </div>
      <form action={cancelVipActivationRequestAction}>
        <input name="requestId" type="hidden" value={pendingVipRequest.id} />
        <input name="returnTo" type="hidden" value="account" />
        <button type="submit">Hủy yêu cầu</button>
      </form>
    </section> : null}
    <section className="account-security"><h2>Đổi mật khẩu</h2><p>Đổi xong, mọi phiên đăng nhập sẽ được thu hồi để bảo vệ tài khoản.</p>
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
