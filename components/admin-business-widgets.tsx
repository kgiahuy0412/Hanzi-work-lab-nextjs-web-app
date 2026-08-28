import Link from "next/link";
import { CreditCard, UserPlus } from "lucide-react";
import type { AdminPeriod, AdminTimeSeriesPoint } from "@/lib/admin-reporting";
import { formatAdminRelativeTime } from "@/lib/admin-reporting";

export function formatAdminCurrency(value: number): string {
  return new Intl.NumberFormat("vi-VN", {
    currency: "VND",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

export function formatAdminDateTime(value: Date | null): string {
  if (!value) return "—";
  return value.toLocaleString("vi-VN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
  });
}

const paymentStatusLabels = {
  expired: "Hết hạn",
  failed: "Thất bại",
  manual_review: "Chờ đối soát",
  paid: "Đã thanh toán",
  pending: "Chờ thanh toán",
  refunded: "Đã hoàn tiền",
} as const;

export function AdminPeriodFilter({ basePath, period }: { basePath: string; period: AdminPeriod }) {
  const options = [
    { label: "Ngày", value: "day" as const },
    { label: "Tuần", value: "week" as const },
    { label: "Tháng", value: "month" as const },
  ];
  return <nav aria-label="Bộ lọc thời gian" className="admin-period-filter">
    {options.map((option) => <Link
      aria-current={period === option.value ? "page" : undefined}
      href={`${basePath}?period=${option.value}`}
      key={option.value}
    >{option.label}</Link>)}
  </nav>;
}

export function AdminLineChart({
  id,
  series,
  title,
  valueLabel,
}: {
  id: string;
  series: AdminTimeSeriesPoint[];
  title: string;
  valueLabel: (value: number) => string;
}) {
  const width = 640;
  const height = 218;
  const left = 42;
  const right = 18;
  const top = 20;
  const bottom = 38;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const maximum = Math.max(1, ...series.map((point) => point.value));
  const coordinates = series.map((point, index) => ({
    ...point,
    x: left + (series.length <= 1 ? chartWidth / 2 : index / (series.length - 1) * chartWidth),
    y: top + chartHeight - point.value / maximum * chartHeight,
  }));
  const polyline = coordinates.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ");
  const area = coordinates.length
    ? `M ${left} ${top + chartHeight} L ${coordinates.map((point) => `${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(" L ")} L ${left + chartWidth} ${top + chartHeight} Z`
    : "";
  const labelStep = series.length > 12 ? Math.ceil(series.length / 6) : 1;

  return <div className="admin-chart" role="img" aria-label={`${title}. Giá trị cao nhất ${valueLabel(maximum)}.`}>
    <svg aria-hidden="true" viewBox={`0 0 ${width} ${height}`}>
      <defs><linearGradient id={`${id}-fill`} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#ef7b36" stopOpacity=".22" /><stop offset="100%" stopColor="#ef7b36" stopOpacity="0" /></linearGradient></defs>
      {[0, .25, .5, .75, 1].map((ratio) => {
        const y = top + chartHeight * ratio;
        return <line key={ratio} stroke="#eceef0" strokeWidth="1" x1={left} x2={left + chartWidth} y1={y} y2={y} />;
      })}
      {area ? <path d={area} fill={`url(#${id}-fill)`} /> : null}
      {polyline ? <polyline fill="none" points={polyline} stroke="#e86e29" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" /> : null}
      {coordinates.map((point, index) => <g key={`${point.label}-${index}`}>
        {point.value > 0 ? <circle cx={point.x} cy={point.y} fill="#fff" r="4" stroke="#e86e29" strokeWidth="2" /> : null}
        {index % labelStep === 0 || index === coordinates.length - 1 ? <text fill="#969ba4" fontSize="10" textAnchor="middle" x={point.x} y={height - 12}>{point.label}</text> : null}
      </g>)}
    </svg>
    <div className="sr-only"><ul>{series.map((point) => <li key={point.label}>{point.label}: {valueLabel(point.value)}</li>)}</ul></div>
  </div>;
}

export function AdminRecentActivity({
  activities,
  now = new Date(),
}: {
  activities: Array<{
    detail: string;
    id: string;
    occurredAt: Date;
    title: string;
    type: "payment" | "user";
  }>;
  now?: Date;
}) {
  return <div className="admin-business-activity-list">{activities.length ? activities.map((activity) => <article key={activity.id}>
    <span className={`admin-business-activity-icon is-${activity.type}`}>{activity.type === "payment" ? <CreditCard size={15} /> : <UserPlus size={15} />}</span>
    <div><strong>{activity.title}</strong><span>{activity.detail}</span></div>
    <time dateTime={activity.occurredAt.toISOString()}>{formatAdminRelativeTime(activity.occurredAt, now)}</time>
  </article>) : <p className="admin-empty">Chưa có hoạt động tài khoản hoặc thanh toán.</p>}</div>;
}

export function AdminTransactionTable({
  transactions,
}: {
  transactions: Array<{
    amountVnd: number;
    createdAt: Date;
    displayName: string | null;
    email: string;
    id: string;
    paidAt: Date | null;
    planName: string;
    status: keyof typeof paymentStatusLabels;
  }>;
}) {
  return <div className="table-scroll"><table className="data-table admin-transaction-table">
    <thead><tr><th>Người dùng</th><th>Gói</th><th>Số tiền</th><th>Trạng thái</th><th>Thời gian</th></tr></thead>
    <tbody>{transactions.length ? transactions.map((transaction) => <tr key={transaction.id}>
      <td><strong>{transaction.displayName || "Chưa đặt tên"}</strong><small>{transaction.email}</small></td>
      <td>{transaction.planName}</td>
      <td><strong>{formatAdminCurrency(transaction.amountVnd)}</strong></td>
      <td><span className={`admin-payment-status is-${transaction.status}`}>{paymentStatusLabels[transaction.status]}</span></td>
      <td>{formatAdminDateTime(transaction.paidAt ?? transaction.createdAt)}</td>
    </tr>) : <tr><td className="admin-table-empty" colSpan={5}>Chưa có giao dịch trong hệ thống.</td></tr>}</tbody>
  </table></div>;
}
