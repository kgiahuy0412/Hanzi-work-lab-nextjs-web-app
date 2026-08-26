import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, CalendarDays, Check, Clock3, Crown, Route, Send, ShieldCheck } from "lucide-react";
import { cancelVipActivationRequestAction, requestVipActivationAction } from "@/app/vip/actions";
import { LearnerPageHeader } from "@/components/learner-page-header";
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

  return <main>
    <section className="section-shell learner-page-header-shell vip-page-header"><LearnerPageHeader
      description="Chọn thời hạn phù hợp rồi gửi yêu cầu trong một phút. Đây là luồng kích hoạt thủ công: không tự trừ tiền, không yêu cầu nhập thông tin thanh toán."
      eyebrow="Quyền lợi học tập"
      eyebrowIcon={Crown}
      meta={<><span><Route size={16} />Mở Lộ trình, Luyện ca và Tập viết</span><span><ShieldCheck size={16} />Duyệt trực tiếp trên tài khoản</span></>}
      title="Giữ nhịp học liền mạch với Himi Chinese VIP."
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

    <section className="section-shell vip-flow" id="quy-trinh-kich-hoat">
      <h2>Từ yêu cầu đến lúc bắt đầu học</h2>
      <div className="flow-grid">
        <article className="flow-step"><span>01</span><h3>Chọn gói</h3><p>Chọn thời hạn phù hợp với nhịp học và gửi yêu cầu bằng đúng tài khoản đang dùng.</p></article>
        <article className="flow-step"><span>02</span><h3>Vào hàng đợi</h3><p>Bạn thấy ngay trạng thái “đang chờ” tại trang VIP và trong Tài khoản.</p></article>
        <article className="flow-step"><span>03</span><h3>Admin kiểm tra</h3><p>Quản trị viên xác nhận yêu cầu, tài khoản và thời hạn trước khi kích hoạt.</p></article>
        <article className="flow-step"><span>04</span><h3>Mở quyền học</h3><p>Khi duyệt, quyền VIP được cấp ngay và ngày hết hạn hiển thị rõ trên tài khoản.</p></article>
      </div>
      <div className="prototype-note"><AlertCircle size={19} /><span>Himi Chinese hiện dùng quy trình beta thủ công và chưa thu tiền tự động. Mức giá hiển thị là mức dự kiến để thử nghiệm sản phẩm; việc tích hợp thanh toán sẽ được bổ sung sau.</span></div>
    </section>

    <section className="section-shell policy-section" id="chinh-sach">
      <span className="section-kicker">Rõ ràng trước khi kích hoạt</span><h2>Thông tin bạn luôn nhìn thấy</h2>
      <div className="policy-grid">
        <article className="policy-card"><h3>Trạng thái yêu cầu</h3><p>Yêu cầu đang chờ có thể hủy hoặc đổi gói. Một tài khoản chỉ có một yêu cầu chờ tại một thời điểm.</p></article>
        <article className="policy-card"><h3>Thời hạn VIP</h3><p>Thời hạn tính từ lúc admin duyệt. Nếu đang còn VIP, lần duyệt mới sẽ cộng tiếp từ ngày hết hạn hiện tại.</p></article>
        <article className="policy-card"><h3>Lịch sử minh bạch</h3><p>Mọi thao tác gửi, đổi, hủy, duyệt và từ chối đều được ghi lại để có thể đối soát khi cần.</p></article>
      </div>
      <div className="prototype-note"><CalendarDays size={19} /><span>Luồng này chưa thay thế điều khoản bán hàng chính thức. Trước khi nhận thanh toán thật cần hoàn thiện chính sách bảo mật, sử dụng, hoàn tiền và thông tin chủ sở hữu.</span></div>
    </section>
  </main>;
}
