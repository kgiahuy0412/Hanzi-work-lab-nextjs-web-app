import type { Metadata } from "next";
import { CircleDollarSign, Crown, TrendingUp, UserPlus } from "lucide-react";
import {
  AdminLineChart,
  AdminPeriodFilter,
  formatAdminCurrency,
} from "@/components/admin-business-widgets";
import { AdminConsoleHeader } from "@/components/admin-console";
import { getAdminBusinessAnalytics } from "@/lib/admin-analytics-service";
import { requireAdminUser } from "@/lib/admin-auth";
import { parseAdminPeriod } from "@/lib/admin-reporting";

export const metadata: Metadata = { title: "Thống kê kinh doanh" };

export default async function AdminAnalyticsPage({ searchParams }: {
  searchParams: Promise<{ period?: string }>;
}) {
  const [admin, params] = await Promise.all([requireAdminUser(), searchParams]);
  const period = parseAdminPeriod(params.period);
  const data = await getAdminBusinessAnalytics(period);
  const stats = [
    { icon: UserPlus, label: "User mới", value: data.stats.newUsers.toLocaleString("vi-VN"), hint: data.period.label },
    { icon: CircleDollarSign, label: "Doanh thu", value: formatAdminCurrency(data.stats.revenue), hint: "Giao dịch đã thanh toán" },
    { icon: Crown, label: "VIP đang hoạt động", value: data.stats.activeVip.toLocaleString("vi-VN"), hint: "Quyền còn hiệu lực" },
    { icon: TrendingUp, label: "Chuyển đổi VIP", value: `${data.stats.conversionRate.toFixed(1)}%`, hint: "VIP / tổng học viên" },
  ];

  return <main className="admin-page"><div className="section-shell">
    <AdminConsoleHeader
      description="Theo dõi tăng trưởng người dùng và doanh thu thực thu từ các giao dịch đã thanh toán."
      eyebrow="Báo cáo"
      title="Thống kê"
      userName={admin.displayName}
    />
    <div className="admin-report-filter-row"><div><strong>Khoảng thời gian</strong><span>{data.period.label}</span></div><AdminPeriodFilter basePath="/admin/analytics" period={period} /></div>
    <section className="admin-stats" aria-label="Chỉ số thống kê">{stats.map(({ icon: Icon, label, value, hint }) => <article className="admin-stat" key={label}><span className="admin-stat-icon"><Icon size={18} /></span><div><span>{label}</span><strong>{value}</strong><small>{hint}</small></div></article>)}</section>
    <section className="admin-analytics-grid">
      <article className="admin-panel"><div className="panel-heading"><div><span>Tăng trưởng</span><h2>Đồ thị người dùng mới</h2></div><strong>{data.stats.newUsers} user</strong></div><AdminLineChart id="analytics-users" series={data.userSeries} title="Người dùng mới" valueLabel={(value) => `${value} user`} /></article>
      <article className="admin-panel"><div className="panel-heading"><div><span>Dòng tiền</span><h2>Đồ thị doanh thu</h2></div><strong>{formatAdminCurrency(data.stats.revenue)}</strong></div><AdminLineChart id="analytics-revenue" series={data.revenueSeries} title="Doanh thu" valueLabel={formatAdminCurrency} /></article>
    </section>
  </div></main>;
}
