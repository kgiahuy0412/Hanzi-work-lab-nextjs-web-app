export const ADMIN_PERIODS = ["day", "week", "month"] as const;

export type AdminPeriod = typeof ADMIN_PERIODS[number];

export type AdminTimeSeriesPoint = {
  label: string;
  value: number;
};

export type AdminPeriodRange = {
  bucketCount: number;
  bucketMilliseconds: number;
  end: Date;
  label: string;
  period: AdminPeriod;
  start: Date;
};

const hourMilliseconds = 60 * 60 * 1_000;
const dayMilliseconds = 24 * hourMilliseconds;

export function parseAdminPeriod(value: string | null | undefined): AdminPeriod {
  return ADMIN_PERIODS.find((period) => period === value) ?? "month";
}

export function adminPeriodRange(period: AdminPeriod, now = new Date()): AdminPeriodRange {
  const definition = period === "day"
    ? { bucketCount: 6, bucketMilliseconds: 4 * hourMilliseconds, label: "24 giờ qua" }
    : period === "week"
      ? { bucketCount: 7, bucketMilliseconds: dayMilliseconds, label: "7 ngày qua" }
      : { bucketCount: 30, bucketMilliseconds: dayMilliseconds, label: "30 ngày qua" };
  return {
    ...definition,
    end: new Date(now),
    period,
    start: new Date(now.getTime() - definition.bucketCount * definition.bucketMilliseconds),
  };
}

function bucketLabel(value: Date, period: AdminPeriod): string {
  return period === "day"
    ? value.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" })
    : value.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", timeZone: "Asia/Ho_Chi_Minh" });
}

export function buildAdminTimeSeries<T>(
  range: AdminPeriodRange,
  entries: readonly T[],
  timestampOf: (entry: T) => Date | null,
  valueOf: (entry: T) => number,
): AdminTimeSeriesPoint[] {
  const values = Array.from({ length: range.bucketCount }, () => 0);
  for (const entry of entries) {
    const timestamp = timestampOf(entry);
    if (!timestamp || timestamp < range.start || timestamp > range.end) continue;
    const index = Math.min(
      range.bucketCount - 1,
      Math.floor((timestamp.getTime() - range.start.getTime()) / range.bucketMilliseconds),
    );
    if (index >= 0) values[index] += valueOf(entry);
  }
  return values.map((value, index) => ({
    label: bucketLabel(new Date(range.start.getTime() + index * range.bucketMilliseconds), range.period),
    value,
  }));
}

export function formatAdminRelativeTime(value: Date, now = new Date()): string {
  const elapsedSeconds = Math.max(0, Math.floor((now.getTime() - value.getTime()) / 1_000));
  if (elapsedSeconds < 60) return "Vừa xong";
  const minutes = Math.floor(elapsedSeconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  return value.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
  });
}

export function escapeAdminCsvCell(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\r\n]/u.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
