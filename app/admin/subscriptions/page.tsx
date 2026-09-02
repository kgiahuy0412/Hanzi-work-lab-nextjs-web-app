import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarDays,
  Crown,
  Inbox,
  PackagePlus,
  PauseCircle,
  PlayCircle,
  Search,
  ShieldCheck,
  Trash2,
  WalletCards,
} from "lucide-react";
import {
  approveVipActivationRequestAction,
  createVipPlanAction,
  deleteVipPlanAction,
  grantOrExtendVipAction,
  rejectVipActivationRequestAction,
  revokeVipAction,
  toggleVipPlanAction,
  updateVipPlanAction,
} from "@/app/admin/actions";
import {
  AdminTransactionTable,
  formatAdminCurrency,
  formatAdminDateTime,
} from "@/components/admin-business-widgets";
import { AdminConsoleHeader, AdminNotice } from "@/components/admin-console";
import { requireAdminUser } from "@/lib/admin-auth";
import { getAdminVipConsole } from "@/lib/admin-subscription-service";
import { vipPlanDurationLabel } from "@/lib/vip-plan";
import { vipDaysRemaining } from "@/lib/vip-subscription";

export const metadata: Metadata = { title: "VIP & Thanh toán" };

function formatDate(value: Date | null): string {
  if (!value) return "Không giới hạn";
  return value.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
  });
}

function benefitsText(value: unknown): string {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").join("\n") : "";
}

type VipPlanEditorValue = {
  benefits: unknown;
  code: string;
  discountPercent: number;
  durationDays: number;
  id: string;
  isActive: boolean;
  name: string;
  priceVnd: number;
  promotionLabel: string | null;
};

function VipPlanFields({ plan }: { plan?: VipPlanEditorValue }) {
  return <>
    <div className="admin-form-grid two">
      <label>Tên gói<input defaultValue={plan?.name} maxLength={100} name="name" placeholder="VIP 6 tháng" required /></label>
      <label>Mã gói<input defaultValue={plan?.code} maxLength={50} name="code" placeholder="VIP_6M" required /></label>
      <label>Thời hạn (ngày)<input defaultValue={plan?.durationDays ?? 30} max={3650} min={1} name="durationDays" required type="number" /></label>
      <label>Giá bán (VND)<input defaultValue={plan?.priceVnd ?? 0} max={100000000} min={0} name="priceVnd" required step={1000} type="number" /></label>
      <label>Giảm giá (%)<input defaultValue={plan?.discountPercent ?? 0} max={90} min={0} name="discountPercent" type="number" /></label>
      <label>Khuyến mãi<input defaultValue={plan?.promotionLabel ?? ""} maxLength={160} name="promotionLabel" placeholder="Tặng thêm 14 ngày" /></label>
    </div>
    <label>Quyền lợi — mỗi dòng một mục<textarea defaultValue={benefitsText(plan?.benefits)} maxLength={4000} name="benefits" placeholder={'Mở toàn bộ bài học\nLuyện tập không giới hạn'} rows={4} /></label>
    <label className="admin-check"><input defaultChecked={plan?.isActive ?? true} name="isActive" type="checkbox" /> Đang hoạt động và hiển thị cho người học</label>
  </>;
}

const subscriptionStatusLabels = {
  active: "Đang hoạt động",
  cancelled: "Đã hủy",
  expired: "Hết hạn",
  pending: "Chờ kích hoạt",
  refunded: "Đã hoàn tiền",
} as const;

export default async function AdminSubscriptionsPage({ searchParams }: {
  searchParams: Promise<{ error?: string; q?: string; success?: string }>;
}) {
  const [admin, params] = await Promise.all([requireAdminUser(), searchParams]);
  const data = await getAdminVipConsole(params.q ?? "");

  return <main className="admin-page"><div className="section-shell">
    <AdminConsoleHeader
      description="Quản lý vòng đời gói VIP, người đăng ký, yêu cầu kích hoạt và toàn bộ lịch sử thanh toán trong một màn hình."
      eyebrow="Kinh doanh"
      title="VIP & Thanh toán"
      userName={admin.displayName}
    />
    <AdminNotice error={params.error} success={params.success} />

    <section className="admin-vip-summary" aria-label="Tổng quan VIP và thanh toán">
      <article><Crown size={19} /><div><strong>{data.activeCount}</strong><span>VIP đang hoạt động</span></div></article>
      <article><Inbox size={19} /><div><strong>{data.pendingRequestCount}</strong><span>Yêu cầu chờ duyệt</span></div></article>
      <article><CalendarDays size={19} /><div><strong>{data.activePlans.length}</strong><span>Gói đang mở</span></div></article>
      <article><WalletCards size={19} /><div><strong>{data.transactions.length}</strong><span>Giao dịch gần nhất</span></div></article>
    </section>

    <section className="admin-vip-plan-layout">
      <article className="admin-panel">
        <div className="admin-vip-heading"><div><span>Danh mục sản phẩm</span><h2>Danh sách các gói VIP</h2><p>Gói tạm ngưng vẫn giữ nguyên quyền của người đã mua nhưng không xuất hiện cho lượt nâng cấp mới.</p></div><strong>{data.plans.length} gói</strong></div>
        <div className="admin-vip-plan-list">{data.plans.length ? data.plans.map((plan) => <article key={plan.id}>
          <div className="admin-vip-plan-main"><span className={plan.isActive ? "is-active" : "is-paused"}>{plan.isActive ? "Đang hoạt động" : "Tạm ngưng"}</span><strong>{plan.name}</strong><small>{plan.code} · {vipPlanDurationLabel(plan.code, plan.durationDays)}</small>{plan.promotionLabel ? <em>{plan.promotionLabel}</em> : null}</div>
          <div className="admin-vip-plan-price"><strong>{formatAdminCurrency(plan.priceVnd)}</strong><span>{plan.discountPercent > 0 ? `Giảm ${plan.discountPercent}%` : "Giá tiêu chuẩn"}</span></div>
          <div className="admin-vip-plan-buyers"><strong>{plan.subscriberCount}</strong><span>người đã đăng ký</span></div>
          <div className="admin-vip-plan-actions">
            <form action={toggleVipPlanAction}><input name="planId" type="hidden" value={plan.id} /><input name="isActive" type="hidden" value={plan.isActive ? "false" : "true"} /><button className="button button-secondary" type="submit">{plan.isActive ? <PauseCircle size={13} /> : <PlayCircle size={13} />}{plan.isActive ? "Ẩn / tạm ngưng" : "Kích hoạt"}</button></form>
            <details><summary>Chỉnh sửa</summary><form action={updateVipPlanAction} className="admin-form admin-vip-plan-edit"><input name="planId" type="hidden" value={plan.id} /><VipPlanFields plan={plan} /><button className="button button-primary" type="submit">Lưu thay đổi</button></form></details>
            <form action={deleteVipPlanAction} className="admin-vip-plan-delete"><input name="planId" type="hidden" value={plan.id} /><label><input name="confirmDelete" required type="checkbox" value="DELETE" /> Xác nhận</label><button className="button button-danger" type="submit"><Trash2 size={13} /> Xóa</button></form>
          </div>
        </article>) : <p className="admin-empty">Chưa có gói VIP nào.</p>}</div>
      </article>
      <aside className="admin-panel admin-vip-plan-create"><div className="panel-heading"><div><span>Gói mới</span><h2>Tạo gói VIP</h2></div><PackagePlus size={18} /></div><form action={createVipPlanAction} className="admin-form"><VipPlanFields /><button className="button button-primary" type="submit"><PackagePlus size={14} /> Tạo gói</button></form></aside>
    </section>

    <section className="admin-panel admin-vip-requests">
      <div className="admin-vip-heading"><div><span>Hàng đợi kích hoạt</span><h2>Yêu cầu mới từ người học</h2><p>Duyệt sẽ cấp hoặc cộng thêm thời hạn VIP ngay trong cùng một giao dịch.</p></div><strong>{data.pendingRequestCount} đang chờ</strong></div>
      {data.pendingRequests.length ? <div className="admin-vip-request-list">{data.pendingRequests.map((request) => {
        const eligible = request.isActive && Boolean(request.emailVerifiedAt) && request.planActive;
        return <article className="admin-vip-request" key={request.id}>
          <div className="admin-vip-request-main"><span className="admin-vip-avatar">{(request.displayName || request.email).trim().slice(0, 1).toUpperCase()}</span><div><strong>{request.displayName || "Chưa đặt tên"}</strong><span>{request.email}</span><small>Gửi lúc {formatAdminDateTime(request.createdAt)}</small></div></div>
          <div className="admin-vip-request-plan"><span>Gói yêu cầu</span><strong>{request.planName}</strong><small>{vipPlanDurationLabel(request.planCode, request.durationDays)} · {formatAdminCurrency(request.priceVnd)}</small></div>
          <div className="admin-vip-request-note"><span>Ghi chú người học</span><p>{request.userNote || "Không có ghi chú."}</p></div>
          <div className="admin-vip-request-actions">
            <form action={approveVipActivationRequestAction}><input name="requestId" type="hidden" value={request.id} /><input aria-label="Ghi chú khi duyệt" name="adminNote" placeholder="Ghi chú nội bộ" /><button className="button button-primary" disabled={!eligible} type="submit"><ShieldCheck size={15} /> Duyệt & kích hoạt</button></form>
            <form action={rejectVipActivationRequestAction}><input name="requestId" type="hidden" value={request.id} /><input aria-label="Lý do từ chối" name="adminNote" placeholder="Lý do từ chối" required /><button className="button button-secondary" type="submit">Từ chối</button></form>
            {!eligible ? <small className="admin-vip-ineligible">Tài khoản hoặc gói VIP không còn đủ điều kiện kích hoạt.</small> : null}
          </div>
        </article>;
      })}</div> : <p className="admin-empty">Không có yêu cầu nào đang chờ.</p>}
    </section>

    <section className="admin-panel admin-vip-subscribers">
      <div className="admin-vip-heading"><div><span>Chi tiết đăng ký</span><h2>Danh sách người dùng đăng ký gói</h2><p>Bao gồm cả đăng ký đang hoạt động, hết hạn hoặc đã hủy để đối soát.</p></div><strong>{data.subscribers.length} bản ghi</strong></div>
      <div className="table-scroll"><table className="data-table"><thead><tr><th>Người dùng</th><th>Gói đăng ký</th><th>Ngày đăng ký</th><th>Ngày hết hạn</th><th>Trạng thái</th></tr></thead><tbody>{data.subscribers.length ? data.subscribers.map((subscription) => <tr key={subscription.id}><td><strong>{subscription.displayName || "Chưa đặt tên"}</strong><small>{subscription.email}</small></td><td>{subscription.planName}</td><td>{formatAdminDateTime(subscription.startsAt ?? subscription.createdAt)}</td><td>{formatDate(subscription.endsAt)}</td><td><span className={`admin-payment-status is-${subscription.status}`}>{subscriptionStatusLabels[subscription.status]}</span></td></tr>) : <tr><td className="admin-table-empty" colSpan={5}>Chưa có người dùng đăng ký VIP.</td></tr>}</tbody></table></div>
    </section>

    <section className="admin-panel admin-vip-transactions" id="transactions">
      <div className="admin-vip-heading"><div><span>Đối soát</span><h2>Lịch sử giao dịch</h2><p>Chỉ giao dịch trạng thái “Đã thanh toán” mới được cộng vào doanh thu.</p></div><strong>{data.transactions.length} giao dịch</strong></div>
      <AdminTransactionTable transactions={data.transactions} />
    </section>

    <section className="admin-panel admin-vip-panel">
      <div className="admin-vip-heading"><div><span>Quản lý thủ công</span><h2>Tìm và cập nhật quyền học</h2><p>Gia hạn sẽ cộng tiếp từ hạn hiện tại nếu học viên vẫn còn VIP.</p></div><Link href="/vip" prefetch={false}>Xem bảng giá người học →</Link></div>
      <form action="/admin/subscriptions" className="admin-search" method="get"><label className="sr-only" htmlFor="vip-member-search">Tìm theo tên hoặc email</label><input defaultValue={data.search} id="vip-member-search" name="q" placeholder="Tìm tên hoặc email học viên…" type="search" /><button className="button button-secondary" type="submit"><Search size={15} /> Tìm học viên</button></form>
      <div className="admin-vip-list">{data.learners.length ? data.learners.map((learner) => {
        const subscription = learner.subscription;
        const eligible = learner.isActive && Boolean(learner.emailVerifiedAt) && data.activePlans.length > 0;
        const daysRemaining = subscription ? vipDaysRemaining(subscription.endsAt) : null;
        return <article className="admin-vip-member" key={learner.id}>
          <div className="admin-vip-identity"><span className="admin-vip-avatar">{(learner.displayName || learner.email).trim().slice(0, 1).toUpperCase()}</span><div><strong>{learner.displayName || "Chưa đặt tên"}</strong><span>{learner.email}</span><small>{learner.emailVerifiedAt ? "Email đã xác minh" : "Chưa xác minh email"} · {learner.isActive ? "Đang hoạt động" : "Đã khóa"}</small></div></div>
          <div className={`admin-vip-status ${subscription ? "is-active" : ""}`}><span>{subscription ? "VIP đang mở" : "Gói miễn phí"}</span><strong>{subscription?.planName ?? "Chưa kích hoạt"}</strong><small>{subscription ? `Đến ${formatDate(subscription.endsAt)}${daysRemaining === null ? "" : ` · còn ${daysRemaining} ngày`}` : "Nội dung VIP vẫn đang khóa"}</small></div>
          <div className="admin-vip-actions"><form action={grantOrExtendVipAction} className="admin-vip-grant-form"><input name="userId" type="hidden" value={learner.id} /><label>Gói muốn {subscription ? "gia hạn" : "cấp"}<select defaultValue={subscription?.planId ?? data.activePlans[0]?.id} disabled={!eligible} name="planId" required>{data.activePlans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name} · {vipPlanDurationLabel(plan.code, plan.durationDays)} · {formatAdminCurrency(plan.priceVnd)}</option>)}</select></label><button className="button button-primary" disabled={!eligible} type="submit"><ShieldCheck size={15} /> {subscription ? "Gia hạn VIP" : "Cấp VIP"}</button></form>
            {subscription ? <form action={revokeVipAction} className="admin-vip-revoke-form"><input name="userId" type="hidden" value={learner.id} /><label><input name="confirmRevoke" required type="checkbox" value="REVOKE" /> Xác nhận thu hồi ngay</label><button className="button button-danger" type="submit">Thu hồi</button></form> : null}
            {!eligible ? <small className="admin-vip-ineligible">Cần tài khoản đang hoạt động, email đã xác minh và ít nhất một gói đang mở.</small> : null}</div>
        </article>;
      }) : <p className="admin-empty">Không tìm thấy học viên phù hợp.</p>}</div>
    </section>
  </div></main>;
}
