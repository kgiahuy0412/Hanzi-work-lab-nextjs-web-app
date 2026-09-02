import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  ChevronRight,
  Clock3,
  Crown,
  Gift,
  LockKeyhole,
  LogOut,
  Mail,
  UserRound,
} from "lucide-react";
import { AccountAvatarUploader } from "@/components/account-avatar-uploader";
import { cancelVipActivationRequestAction } from "@/app/vip/actions";
import { getCurrentUser } from "@/lib/auth-session";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/lib/auth-validation";
import { getPendingVipActivationRequest } from "@/lib/vip-activation-request-service";
import { vipPlanDurationLabel } from "@/lib/vip-plan";
import { getActiveVipSubscription, vipDaysRemaining } from "@/lib/vip-subscription";

export const metadata: Metadata = { title: "Tài khoản" };

const roleLabels = {
  learner: "Người học",
  editor: "Biên tập viên",
  reviewer: "Người duyệt",
  admin: "Quản trị viên",
} as const;

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

type AccountError = keyof typeof accountErrors;

function initials(value: string): string {
  return value
    .split(/\s+/u)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase("vi-VN") || "HW";
}

function formatDate(value: Date): string {
  return value.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  });
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: AccountError;
    success?: keyof typeof accountSuccess;
    verified?: string;
  }>;
}) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);
  if (!user) redirect("/login?returnTo=/account&error=required");

  const [vipSubscription, pendingVipRequest] = await Promise.all([
    getActiveVipSubscription(user.id),
    getPendingVipActivationRequest(user.id),
  ]);
  const daysRemaining = vipSubscription ? vipDaysRemaining(vipSubscription.endsAt) : null;
  const vipExpiry = vipSubscription?.endsAt ? formatDate(vipSubscription.endsAt) : null;
  const joinedAt = formatDate(user.createdAt);
  const today = formatDate(new Date());
  const passwordErrors: AccountError[] = ["invalid_current_password", "invalid_password", "password_mismatch"];
  const showPasswordEditor = Boolean(params.error && passwordErrors.includes(params.error));

  return (
    <main className="account-page">
      <div className="account-page-inner">
        <h1 className="account-page-title">Tài khoản của tôi</h1>

        {params.verified === "1" ? <p className="auth-notice account-feedback" role="status">Email đã được xác minh. Tài khoản của bạn đã sẵn sàng.</p> : null}
        {params.success && accountSuccess[params.success] ? <p className="auth-notice account-feedback" role="status">{accountSuccess[params.success]}</p> : null}
        {params.error && accountErrors[params.error] ? <p className="auth-error account-feedback" role="alert">{accountErrors[params.error]}</p> : null}

        <section className="account-profile-hero" aria-labelledby="account-profile-name">
          <AccountAvatarUploader
            avatarUrl={user.avatarUrl}
            displayName={user.displayName}
            initials={initials(user.displayName)}
          />
          <div className="account-profile-copy">
            <h2 id="account-profile-name">{user.displayName}</h2>
            <p>{roleLabels[user.role]} Himi Chinese</p>
            <div className="account-profile-email"><Mail size={18} /><span>{user.email}</span><em><BadgeCheck size={14} />Đã xác minh</em></div>
            <Link className="account-vip-outline" href="/vip"><Crown size={19} />Xem quyền lợi VIP</Link>
          </div>
        </section>

        <section className={`account-membership-band ${vipSubscription ? "is-active" : ""}`} aria-label="Gói thành viên hiện tại">
          <span className="account-membership-icon">{vipSubscription ? <Crown size={22} /> : <Gift size={22} />}</span>
          <div>
            <h2>{vipSubscription?.planName ?? "Gói miễn phí"}</h2>
            <p>{vipSubscription
              ? vipExpiry
                ? `Quyền VIP có hiệu lực đến ${vipExpiry}${daysRemaining === null ? "" : ` · còn ${daysRemaining} ngày`}.`
                : "Toàn bộ quyền lợi VIP đang được mở cho tài khoản này."
              : "Nâng cấp lên gói VIP để mở khóa toàn bộ lộ trình và tính năng nâng cao."}</p>
          </div>
          <Link href="/vip">Xem quyền lợi VIP <ArrowRight size={18} /></Link>
        </section>

        {pendingVipRequest ? <section className="account-pending-request" aria-label="Yêu cầu VIP đang chờ">
          <Clock3 size={21} />
          <div>
            <strong>Yêu cầu {pendingVipRequest.planName} đang chờ</strong>
            <span>Đã gửi ngày {formatDate(pendingVipRequest.createdAt)} · {vipPlanDurationLabel(pendingVipRequest.planCode, pendingVipRequest.durationDays)}</span>
          </div>
          <form action={cancelVipActivationRequestAction}>
            <input name="requestId" type="hidden" value={pendingVipRequest.id} />
            <input name="returnTo" type="hidden" value="account" />
            <button type="submit">Hủy yêu cầu</button>
          </form>
        </section> : null}

        <section className="account-information" id="account-information" aria-labelledby="account-information-title">
          <h2 id="account-information-title">Thông tin tài khoản</h2>
          <dl>
            <div><dt><UserRound size={20} /><span>Vai trò</span></dt><dd>{roleLabels[user.role]}</dd></div>
            <div id="account-email"><dt><Mail size={20} /><span>Email</span></dt><dd><span>{user.email}</span><em><BadgeCheck size={14} />Đã xác minh</em></dd></div>
            <div><dt><CalendarDays size={20} /><span>Ngày tham gia</span></dt><dd>{joinedAt}</dd></div>
          </dl>
        </section>

        <section className="account-security-panel" aria-labelledby="account-security-title">
          <h2 id="account-security-title">Tài khoản &amp; bảo mật</h2>
          <div className="account-security-list">
            <a className="account-security-row" href="#account-information">
              <UserRound size={22} />
              <span><strong>Thông tin đăng nhập</strong><small>Xem email đang dùng cho tài khoản của bạn</small></span>
              <ChevronRight size={20} />
            </a>
            <details className="account-security-details" open={showPasswordEditor || undefined}>
              <summary className="account-security-row">
                <LockKeyhole size={22} />
                <span><strong>Đổi mật khẩu</strong><small>Cập nhật mật khẩu để bảo vệ tài khoản</small></span>
                <ChevronRight size={20} />
              </summary>
              <div className="account-password-editor">
                <p>Đổi xong, mọi phiên đăng nhập sẽ được thu hồi để bảo vệ tài khoản.</p>
                <form action="/api/auth/change-password" className="auth-form account-password-form" method="post">
                  <label>Mật khẩu hiện tại<input autoComplete="current-password" maxLength={MAX_PASSWORD_LENGTH} name="currentPassword" required type="password" /></label>
                  <label>Mật khẩu mới<input autoComplete="new-password" maxLength={MAX_PASSWORD_LENGTH} minLength={MIN_PASSWORD_LENGTH} name="nextPassword" required type="password" /></label>
                  <label>Nhập lại mật khẩu mới<input autoComplete="new-password" maxLength={MAX_PASSWORD_LENGTH} minLength={MIN_PASSWORD_LENGTH} name="confirmPassword" required type="password" /></label>
                  <button className="button button-secondary" type="submit">Cập nhật mật khẩu</button>
                </form>
              </div>
            </details>
            <form action="/api/auth/logout" className="account-logout-form" method="post">
              <input name="returnTo" type="hidden" value="/" />
              <button className="account-security-row" type="submit">
                <LogOut size={22} />
                <span><strong>Đăng xuất</strong><small>Đăng xuất khỏi tài khoản trên thiết bị này</small></span>
                <ChevronRight size={20} />
              </button>
            </form>
          </div>
        </section>

        <footer className="account-page-footer">Himi Chinese © {new Date().getFullYear()} <span>·</span> {today}</footer>
      </div>
    </main>
  );
}
