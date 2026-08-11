import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Crown, Inbox, Search, ShieldCheck, UserRoundCheck } from "lucide-react";
import {
  approveVipActivationRequestAction,
  grantOrExtendVipAction,
  rejectVipActivationRequestAction,
  revokeVipAction,
} from "@/app/admin/actions";
import { AdminConsoleHeader, AdminNotice } from "@/components/admin-console";
import { requireAdminUser } from "@/lib/admin-auth";
import { getAdminVipConsole } from "@/lib/admin-subscription-service";
import { vipDaysRemaining } from "@/lib/vip-subscription";

export const metadata: Metadata = { title: "Thành viên VIP" };

function formatDate(value: Date | null): string {
  if (!value) return "Không giới hạn";
  return value.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  });
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat("vi-VN").format(value) + "đ";
}

function formatRequestedAt(value: Date): string {
  return value.toLocaleString("vi-VN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
  });
}

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; q?: string; success?: string }>;
}) {
  const [admin, params] = await Promise.all([requireAdminUser(), searchParams]);
  const data = await getAdminVipConsole(params.q ?? "");

  return <main className="admin-page"><div className="section-shell">
    <AdminConsoleHeader
      description="Cấp quyền thủ công cho học viên, gia hạn từ ngày hết hạn hiện tại và thu hồi khi cần. Mọi thao tác đều được lưu vào audit log."
      eyebrow="Quyền truy cập"
      title="Thành viên VIP"
      userName={admin.displayName}
    />
    <AdminNotice error={params.error} success={params.success} />

    <section className="admin-vip-summary" aria-label="Tổng quan thành viên VIP">
      <article><Crown size={19} /><div><strong>{data.activeCount}</strong><span>VIP đang hoạt động</span></div></article>
      <article><Inbox size={19} /><div><strong>{data.pendingRequestCount}</strong><span>Yêu cầu chờ duyệt</span></div></article>
      <article><UserRoundCheck size={19} /><div><strong>{data.learners.length}</strong><span>Học viên trong kết quả</span></div></article>
      <article><CalendarDays size={19} /><div><strong>{data.plans.length}</strong><span>Gói đang mở</span></div></article>
    </section>

    <section className="admin-panel admin-vip-requests">
      <div className="admin-vip-heading">
        <div><span>Hàng đợi kích hoạt</span><h2>Yêu cầu mới từ người học</h2><p>Duyệt sẽ cấp hoặc cộng thêm thời hạn VIP ngay trong cùng một giao dịch.</p></div>
        <strong>{data.pendingRequestCount} đang chờ</strong>
      </div>
      {data.pendingRequests.length ? <div className="admin-vip-request-list">
        {data.pendingRequests.map((request) => {
          const eligible = request.isActive && Boolean(request.emailVerifiedAt);
          return <article className="admin-vip-request" key={request.id}>
            <div className="admin-vip-request-main">
              <span className="admin-vip-avatar">{(request.displayName || request.email).trim().slice(0, 1).toUpperCase()}</span>
              <div>
                <strong>{request.displayName || "Chưa đặt tên"}</strong>
                <span>{request.email}</span>
                <small>Gửi lúc {formatRequestedAt(request.createdAt)}</small>
              </div>
            </div>
            <div className="admin-vip-request-plan">
              <span>Gói yêu cầu</span>
              <strong>{request.planName}</strong>
              <small>{request.durationDays} ngày · {formatPrice(request.priceVnd)}</small>
            </div>
            <div className="admin-vip-request-note">
              <span>Ghi chú người học</span>
              <p>{request.userNote || "Không có ghi chú."}</p>
            </div>
            <div className="admin-vip-request-actions">
              <form action={approveVipActivationRequestAction}>
                <input name="requestId" type="hidden" value={request.id} />
                <input aria-label="Ghi chú khi duyệt" name="adminNote" placeholder="Ghi chú nội bộ (không bắt buộc)" />
                <button className="button button-primary" disabled={!eligible} type="submit"><ShieldCheck size={15} /> Duyệt & kích hoạt</button>
              </form>
              <form action={rejectVipActivationRequestAction}>
                <input name="requestId" type="hidden" value={request.id} />
                <input aria-label="Lý do từ chối" name="adminNote" placeholder="Lý do từ chối" required />
                <button className="button button-secondary" type="submit">Từ chối</button>
              </form>
              {!eligible ? <small className="admin-vip-ineligible">Tài khoản đã khóa hoặc chưa xác minh email; không thể kích hoạt.</small> : null}
            </div>
          </article>;
        })}
      </div> : <p className="admin-empty">Không có yêu cầu nào đang chờ. Hàng đợi đã được xử lý hết.</p>}
    </section>

    <section className="admin-panel admin-vip-panel">
      <div className="admin-vip-heading">
        <div><span>Quản lý thủ công</span><h2>Tìm và cập nhật quyền học</h2><p>Gia hạn sẽ cộng tiếp từ hạn hiện tại nếu học viên vẫn còn VIP.</p></div>
        <Link href="/vip">Xem bảng giá người học →</Link>
      </div>
      <form action="/admin/subscriptions" className="admin-search" method="get">
        <label className="sr-only" htmlFor="vip-member-search">Tìm theo tên hoặc email</label>
        <input defaultValue={data.search} id="vip-member-search" name="q" placeholder="Tìm tên hoặc email học viên…" type="search" />
        <button className="button button-secondary" type="submit"><Search size={15} /> Tìm học viên</button>
      </form>

      <div className="admin-vip-list">
        {data.learners.length ? data.learners.map((learner) => {
          const subscription = learner.subscription;
          const eligible = learner.isActive && Boolean(learner.emailVerifiedAt) && data.plans.length > 0;
          const daysRemaining = subscription ? vipDaysRemaining(subscription.endsAt) : null;
          return <article className="admin-vip-member" key={learner.id}>
            <div className="admin-vip-identity">
              <span className="admin-vip-avatar">{(learner.displayName || learner.email).trim().slice(0, 1).toUpperCase()}</span>
              <div><strong>{learner.displayName || "Chưa đặt tên"}</strong><span>{learner.email}</span><small>{learner.emailVerifiedAt ? "Email đã xác minh" : "Chưa xác minh email"} · {learner.isActive ? "Đang hoạt động" : "Đã khóa"}</small></div>
            </div>

            <div className={`admin-vip-status ${subscription ? "is-active" : ""}`}>
              <span>{subscription ? "VIP đang mở" : "Gói miễn phí"}</span>
              <strong>{subscription?.planName ?? "Chưa kích hoạt"}</strong>
              <small>{subscription ? `Đến ${formatDate(subscription.endsAt)}${daysRemaining === null ? "" : ` · còn ${daysRemaining} ngày`}` : "Nội dung VIP vẫn đang khóa"}</small>
            </div>

            <div className="admin-vip-actions">
              <form action={grantOrExtendVipAction} className="admin-vip-grant-form">
                <input name="userId" type="hidden" value={learner.id} />
                <label>Gói muốn {subscription ? "gia hạn" : "cấp"}<select defaultValue={subscription?.planId ?? data.plans[0]?.id} disabled={!eligible} name="planId" required>
                  {data.plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name} · {plan.durationDays} ngày · {formatPrice(plan.priceVnd)}</option>)}
                </select></label>
                <button className="button button-primary" disabled={!eligible} type="submit"><ShieldCheck size={15} /> {subscription ? "Gia hạn VIP" : "Cấp VIP"}</button>
              </form>
              {subscription ? <form action={revokeVipAction} className="admin-vip-revoke-form">
                <input name="userId" type="hidden" value={learner.id} />
                <label><input name="confirmRevoke" required type="checkbox" value="REVOKE" /> Xác nhận thu hồi ngay</label>
                <button className="button button-danger" type="submit">Thu hồi</button>
              </form> : null}
              {!eligible ? <small className="admin-vip-ineligible">Cần tài khoản đang hoạt động và email đã xác minh.</small> : null}
            </div>
          </article>;
        }) : <p className="admin-empty">Không tìm thấy học viên phù hợp. Hãy thử email hoặc tên khác.</p>}
      </div>
    </section>
  </div></main>;
}
