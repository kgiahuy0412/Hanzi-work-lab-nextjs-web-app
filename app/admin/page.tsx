import type { Metadata } from "next";
import Link from "next/link";
import { CircleDollarSign, Crown, TrendingUp, UsersRound } from "lucide-react";
import {
  AdminLineChart,
  AdminPeriodFilter,
  AdminRecentActivity,
  AdminTransactionTable,
  formatAdminCurrency,
} from "@/components/admin-business-widgets";
import { AdminConsoleHeader, StatusBadge } from "@/components/admin-console";
import { getAdminBusinessAnalytics } from "@/lib/admin-analytics-service";
import { requireAdminUser } from "@/lib/admin-auth";
import { getAdminDashboard } from "@/lib/admin-content-service";
import { parseAdminPeriod } from "@/lib/admin-reporting";

export const metadata: Metadata = { title: "Himi Chinese Console" };

const actionLabels: Record<string, string> = {
  "admin.course.created": "Đã tạo lộ trình",
  "admin.course.updated": "Đã cập nhật lộ trình",
  "admin.course.deleted": "Đã xóa lộ trình nháp",
  "admin.module.created": "Đã tạo module",
  "admin.module.updated": "Đã cập nhật module",
  "admin.module.deleted": "Đã xóa module trống",
  "admin.lesson.created": "Đã tạo bài học",
  "admin.lesson.updated": "Đã cập nhật bài học",
  "admin.lesson.deleted": "Đã xóa bài học nháp",
  "admin.vocabulary.created": "Đã tạo từ vựng",
  "admin.vocabulary.updated": "Đã cập nhật từ vựng",
  "admin.vocabulary.deleted": "Đã xóa từ vựng",
  "admin.practice_industry.created": "Đã tạo nhóm Luyện ca",
  "admin.practice_industry.updated": "Đã cập nhật nhóm Luyện ca",
  "admin.practice_industry.deleted": "Đã xóa nhóm Luyện ca",
  "admin.practice_scenario.created": "Đã tạo ca luyện",
  "admin.practice_scenario.updated": "Đã cập nhật ca luyện",
  "admin.practice_scenario.status_changed": "Đã chuyển trạng thái ca luyện",
  "admin.practice_scenario.review_assigned": "Đã cập nhật phân công kiểm duyệt",
  "admin.practice_scenario.review_claimed": "Reviewer đã nhận ca kiểm duyệt",
  "admin.practice_scenario.review_released": "Reviewer đã trả ca về hàng đợi",
  "admin.practice_scenario.version_restored": "Đã khôi phục phiên bản ca luyện",
  "admin.practice_scenario.deleted": "Đã xóa ca luyện",
  "admin.practice_exercise.created": "Đã thêm lượt nghe",
  "admin.practice_exercise.updated": "Đã cập nhật lượt nghe",
  "admin.practice_exercise.deleted": "Đã xóa lượt nghe",
  "admin.practice_exercise.audio_attached": "Đã tải audio cho lượt nghe",
  "admin.practice_exercise.audio_approved": "Reviewer đã duyệt audio",
  "admin.practice_exercise.audio_rerecord_requested": "Reviewer yêu cầu thu lại audio",
  "admin.practice_exercise.audio_removed": "Đã gỡ audio khỏi lượt nghe",
  "admin.user.role_updated": "Đã cập nhật vai trò đội nội dung",
  "admin.subscription.granted": "Đã cấp quyền VIP cho học viên",
  "admin.subscription.extended": "Đã gia hạn quyền VIP",
  "admin.subscription.revoked": "Đã thu hồi quyền VIP",
  "admin.user.deactivated": "Đã khóa tài khoản học viên",
  "admin.vip_plan.created": "Đã tạo gói VIP",
  "admin.vip_plan.updated": "Đã cập nhật gói VIP",
  "admin.vip_plan.activated": "Đã mở lại gói VIP",
  "admin.vip_plan.paused": "Đã tạm ngưng gói VIP",
  "admin.vip_plan.deleted": "Đã xóa gói VIP",
};

export default async function AdminPage({ searchParams }: {
  searchParams: Promise<{ period?: string }>;
}) {
  const [user, params] = await Promise.all([requireAdminUser(), searchParams]);
  const period = parseAdminPeriod(params.period);
  const [data, business] = await Promise.all([getAdminDashboard(), getAdminBusinessAnalytics(period)]);
  const stats = [
    { label: "Doanh thu", value: formatAdminCurrency(business.stats.revenue), hint: business.period.label, icon: CircleDollarSign },
    { label: "Người dùng", value: business.stats.totalUsers.toLocaleString("vi-VN"), hint: "Toàn hệ thống", icon: UsersRound },
    { label: "Đăng ký VIP", value: business.stats.vipRegistrations.toLocaleString("vi-VN"), hint: business.period.label, icon: Crown },
    { label: "Chuyển đổi VIP", value: `${business.stats.conversionRate.toFixed(1)}%`, hint: "VIP / tổng học viên", icon: TrendingUp },
  ];

  return <main className="admin-page"><div className="section-shell">
    <AdminConsoleHeader eyebrow="Himi Chinese Console" title="Tổng quan vận hành" userName={user.displayName} />
    <div className="admin-report-filter-row"><div><strong>Báo cáo kinh doanh</strong><span>{business.period.label}</span></div><AdminPeriodFilter basePath="/admin" period={period} /></div>
    <section className="admin-stats" aria-label="Chỉ số tổng quan">{stats.map(({ label, value, hint, icon: Icon }) => <article className="admin-stat" key={label}><span className="admin-stat-icon"><Icon size={18} /></span><div><span>{label}</span><strong>{value}</strong><small>{hint}</small></div></article>)}</section>
    <section className="admin-dashboard-business-grid">
      <article className="admin-panel"><div className="panel-heading"><div><span>Doanh thu theo thời gian</span><h2>{business.period.label}</h2></div><strong>{formatAdminCurrency(business.stats.revenue)}</strong></div><AdminLineChart id="dashboard-revenue" series={business.revenueSeries} title="Doanh thu dashboard" valueLabel={formatAdminCurrency} /></article>
      <article className="admin-panel"><div className="panel-heading"><div><span>Tài khoản & thanh toán</span><h2>Hoạt động gần đây</h2></div><Link href="/admin/analytics" prefetch={false}>Xem thống kê</Link></div><AdminRecentActivity activities={business.recentActivity} now={business.period.end} /></article>
    </section>
    <section className="admin-panel admin-dashboard-transactions"><div className="panel-heading"><div><span>Dòng tiền</span><h2>Giao dịch gần đây</h2></div><Link href="/admin/subscriptions#transactions" prefetch={false}>Xem lịch sử</Link></div><AdminTransactionTable transactions={business.recentTransactions} /></section>
    <div className="admin-grid">
      <section className="admin-panel"><div className="panel-heading"><div><span>Danh mục nội dung</span><h2>Quản lý lộ trình</h2></div><Link href="/admin/courses" prefetch={false}>Mở CRUD nội dung</Link></div><div className="table-scroll"><table className="data-table"><thead><tr><th>Lộ trình</th><th>Bài học</th><th>Trạng thái</th><th>Cập nhật</th></tr></thead><tbody>{data.courses.map((course) => <tr key={course.id}><td><Link className="table-course" href={`/admin/courses/${course.id}`} prefetch={false}><span className="table-mark">{course.hanzi}</span><span><strong>{course.titleVi}</strong><small>{course.slug}</small></span></Link></td><td>{course.lessonCount}</td><td><StatusBadge status={course.status} /></td><td>{course.updatedAt.toLocaleDateString("vi-VN")}</td></tr>)}</tbody></table></div></section>
      <section className="admin-panel"><div className="panel-heading"><h2>Quy trình nội dung</h2><span>Dữ liệu thật</span></div><div className="pipeline"><div className="pipeline-step"><span>01</span><div><strong>Bản nháp</strong><span>Đang biên soạn</span></div><strong>{data.lessonStatuses.draft ?? 0} bài</strong></div><div className="pipeline-step"><span>02</span><div><strong>Chờ duyệt</strong><span>Sẵn sàng kiểm tra</span></div><strong>{data.lessonStatuses.review ?? 0} bài</strong></div><div className="pipeline-step"><span>03</span><div><strong>Đã xuất bản</strong><span>Người học đang thấy</span></div><strong>{data.lessonStatuses.published ?? 0} bài</strong></div><div className="pipeline-step"><span>04</span><div><strong>Lưu trữ</strong><span>Không còn công khai</span></div><strong>{data.lessonStatuses.archived ?? 0} bài</strong></div></div></section>
    </div>
    <div className="admin-lower one"><section className="admin-panel"><div className="panel-heading"><h2>Audit gần đây</h2><span>{data.activities.length} sự kiện</span></div><div className="activity-list">{data.activities.length ? data.activities.map((activity) => <div className="activity-item" key={activity.id}><i className="activity-dot" /><div><p>{actionLabels[activity.action] ?? activity.action}</p><span>{activity.actorName ?? "Hệ thống"} · {activity.createdAt.toLocaleString("vi-VN")}</span></div></div>) : <p className="admin-empty">Chưa có hoạt động quản trị.</p>}</div></section></div>
  </div></main>;
}
