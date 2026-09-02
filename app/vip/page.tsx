import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, Check, Clock3, Crown, Send } from "lucide-react";
import { cancelVipActivationRequestAction, requestVipActivationAction } from "@/app/vip/actions";
import { HimiSectionBanner } from "@/components/himi-section-banner";
import { getCurrentUser } from "@/lib/auth-session";
import { getVipUpgradeOverview } from "@/lib/vip-activation-request-service";
import { vipDaysRemaining } from "@/lib/vip-subscription";

export const metadata: Metadata = { title: "Gói Himi Chinese VIP" };

const defaultBenefits = [
  "Mở toàn bộ bài học VIP",
  "Luyện ca không giới hạn",
  "Ôn tập và lịch nhắc theo tiến độ",
  "Tập viết và trò chơi luyện phản xạ",
];

const noticeMessages: Record<string, string> = {
  requested: "Yêu cầu của bạn đã vào hàng đợi. Quản trị viên sẽ kiểm tra và kích hoạt trực tiếp trên tài khoản này.",
  request_cancelled: "Đã hủy yêu cầu đang chờ. Bạn có thể chọn lại gói khác bất cứ lúc nào.",
};

const errorMessages: Record<string, string> = {
  invalid_input: "Thông tin gói chưa hợp lệ. Hãy tải lại trang và thử lại.",
  not_found: "Không tìm thấy yêu cầu này hoặc yêu cầu không còn thuộc tài khoản của bạn.",
  vip_plan_inactive: "Gói này vừa ngừng nhận yêu cầu. Hãy chọn một gói còn hiển thị.",
  vip_request_ineligible: "Tài khoản hiện chưa đủ điều kiện gửi yêu cầu VIP.",
  vip_request_not_pending: "Yêu cầu đã được xử lý trước đó. Trạng thái mới nhất đã được cập nhật bên dưới.",
};

function formatPrice(value: number): string {
  return new Intl.NumberFormat("vi-VN").format(value) + "đ";
}

function formatDate(value: Date | null): string {
  if (!value) return "không giới hạn";
  return value.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
  });
}

function planBenefits(value: unknown): string[] {
  if (!Array.isArray(value)) return defaultBenefits;
  const benefits = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).slice(0, 5);
  return benefits.length ? benefits : defaultBenefits;
}

export default async function VipPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const [params, user] = await Promise.all([searchParams, getCurrentUser()]);
  const overview = await getVipUpgradeOverview(user?.id);
  const pending = overview.pendingRequest;
  const active = overview.activeSubscription;
  const daysRemaining = active ? vipDaysRemaining(active.endsAt) : null;
  const notice = params.success ? noticeMessages[params.success] : null;
  const error = params.error ? errorMessages[params.error] : null;
  const featuredPlanId = overview.plans.find((plan) => plan.durationDays >= 180)?.id ?? overview.plans[0]?.id;

  return <main className="vip-page">
    <section className="section-shell himi-banner-shell vip-page-header"><HimiSectionBanner
      description="Mở toàn bộ bài học, ca luyện và công cụ ôn tập để tiến bộ liền mạch cùng Himi."
      titleId="vip-page-title"
      titleLines={["Học liền mạch.", "Mở trọn hành trình."]}
      variant="vip"
    /></section>

    <section className="section-shell vip-request-feedback" aria-live="polite">
      {notice ? <p className="vip-request-notice success"><Check size={17} />{notice}</p> : null}
      {error ? <p className="vip-request-notice error" role="alert"><AlertCircle size={17} />{error}</p> : null}
      {active ? <div className="vip-current-status is-active">
        <span className="vip-current-status-icon"><Crown size={20} /></span>
        <div><span>VIP đang hoạt động</span><strong>{active.planName}</strong><small>Hiệu lực đến {formatDate(active.endsAt)}{daysRemaining === null ? "" : ` · còn ${daysRemaining} ngày`}</small></div>
        <Link href="/account">Xem tài khoản →</Link>
      </div> : null}
      {pending ? <div className="vip-current-status is-pending">
        <span className="vip-current-status-icon"><Clock3 size={20} /></span>
        <div><span>Đang chờ quản trị viên duyệt</span><strong>{pending.planName}</strong><small>Gửi ngày {formatDate(pending.createdAt)} · bạn vẫn có thể đổi gói ở bên dưới</small></div>
        <form action={cancelVipActivationRequestAction}>
          <input name="requestId" type="hidden" value={pending.id} />
          <input name="returnTo" type="hidden" value="vip" />
          <button type="submit">Hủy yêu cầu</button>
        </form>
      </div> : null}
    </section>

    <section className="section-shell pricing-grid vip-pricing-grid" aria-label="Các lựa chọn học">
      <article className="price-card vip-plan-card is-free">
        <span className="price-name">Học miễn phí</span>
        <div className="price"><strong>0đ</strong></div>
        <p className="price-description">Bắt đầu với các bài mở khóa sẵn và làm quen nhịp học trước khi nâng cấp.</p>
        <ul className="feature-list">
          {["Bài học thử trong Lộ trình", "Ca luyện mẫu", "Ôn tập từ đã học", "Không cần gửi yêu cầu"].map((feature) => <li key={feature}><Check size={15} />{feature}</li>)}
        </ul>
        <Link className="button button-full button-secondary" href="/courses">Tiếp tục học miễn phí</Link>
      </article>

      {overview.plans.map((plan) => {
        const featured = plan.id === featuredPlanId;
        const isPendingPlan = pending?.planId === plan.id;
        const buttonText = isPendingPlan
          ? "Đang chờ duyệt"
          : pending
            ? "Đổi sang gói này"
            : active
              ? "Yêu cầu gia hạn"
              : "Gửi yêu cầu kích hoạt";
        return <article className={`price-card vip-plan-card ${featured ? "featured" : ""}`} key={plan.id}>
          {featured ? <span className="price-badge">Được chọn nhiều</span> : null}
          <span className="price-name">{plan.name}</span>
          <div className="price"><strong>{formatPrice(plan.priceVnd)}</strong><span>/ {plan.durationDays} ngày</span></div>
          <p className="price-description">Mức dự kiến cho một lần kích hoạt. Yêu cầu này chưa tạo thanh toán tự động.</p>
          <ul className="feature-list">{planBenefits(plan.benefits).map((feature) => <li key={feature}><Check size={15} />{feature}</li>)}</ul>
          {user ? <form action={requestVipActivationAction} className="vip-plan-request-form">
            <input name="planId" type="hidden" value={plan.id} />
            <label><span>Ghi chú (không bắt buộc)</span><input disabled={isPendingPlan} maxLength={500} name="userNote" placeholder="Ví dụ: cần luyện ca văn phòng" /></label>
            <button className={`button button-full ${featured ? "button-light" : "button-primary"}`} disabled={isPendingPlan} type="submit"><Send size={15} />{buttonText}</button>
          </form> : <Link className={`button button-full ${featured ? "button-light" : "button-primary"}`} href="/login?returnTo=%2Fvip">Đăng nhập để gửi yêu cầu</Link>}
        </article>;
      })}
    </section>

  </main>;
}
