import { getAdminUserConsole, parseAdminUserPeriod } from "@/lib/admin-user-service";
import { getCurrentUser } from "@/lib/auth-session";
import { escapeAdminCsvCell } from "@/lib/admin-reporting";

function spreadsheetSafe(value: string): string {
  return /^[=+\-@]/u.test(value) ? `'${value}` : value;
}

function csvDate(value: Date | null): string {
  if (!value) return "";
  return value.toLocaleString("vi-VN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
  });
}

export async function GET(request: Request) {
  const admin = await getCurrentUser();
  if (!admin) return Response.json({ error: "authentication_required" }, { status: 401 });
  if (admin.role !== "admin") return Response.json({ error: "forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const data = await getAdminUserConsole({
    limit: 5_000,
    period: parseAdminUserPeriod(searchParams.get("period")),
    search: searchParams.get("q") ?? "",
  });
  const rows = [
    ["Tên người dùng", "Email", "Vai trò", "Trạng thái", "Gói VIP", "Ngày hết hạn", "Thời gian đăng ký"],
    ...data.users.map((user) => [
      spreadsheetSafe(user.displayName || "Chưa đặt tên"),
      spreadsheetSafe(user.email),
      user.role,
      !user.isActive ? "Đã khóa" : user.subscription ? "VIP" : "Free",
      user.subscription?.planName ?? "",
      csvDate(user.subscription?.endsAt ?? null),
      csvDate(user.createdAt),
    ]),
  ];
  const csv = `\uFEFF${rows.map((row) => row.map(escapeAdminCsvCell).join(",")).join("\r\n")}`;
  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="himi-users-${date}.csv"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}
