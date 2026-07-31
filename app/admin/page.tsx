import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenText, Crown, Languages, UsersRound } from "lucide-react";
import { AdminConsoleHeader, StatusBadge } from "@/components/admin-console";
import { requireAdminUser } from "@/lib/admin-auth";
import { getAdminDashboard } from "@/lib/admin-content-service";

export const metadata: Metadata = { title: "HanziWork Console" };

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
};

export default async function AdminPage() {
  const user = await requireAdminUser();
  const data = await getAdminDashboard();
  const stats = [
    { label: "Người dùng", value: data.stats.users, icon: UsersRound },
    { label: "VIP đang hoạt động", value: data.stats.activeVip, icon: Crown },
    { label: "Bài đã xuất bản", value: data.stats.publishedLessons, icon: BookOpenText },
    { label: "Lộ trình", value: data.stats.courses, icon: Languages },
  ];

  return <main className="admin-page"><div className="section-shell">
    <AdminConsoleHeader eyebrow="HanziWork Console" title="Tổng quan vận hành" userName={user.displayName} />
    <section className="admin-stats" aria-label="Chỉ số tổng quan">{stats.map(({ label, value, icon: Icon }) => <article className="admin-stat" key={label}><span className="admin-stat-icon"><Icon size={20} /></span><div><strong>{value}</strong><span>{label}</span></div></article>)}</section>
    <div className="admin-grid">
      <section className="admin-panel"><div className="panel-heading"><h2>Quản lý lộ trình</h2><Link href="/admin/courses">Mở CRUD nội dung</Link></div><div className="table-scroll"><table className="data-table"><thead><tr><th>Lộ trình</th><th>Bài học</th><th>Trạng thái</th><th>Cập nhật</th></tr></thead><tbody>{data.courses.map((course) => <tr key={course.id}><td><Link className="table-course" href={`/admin/courses/${course.id}`}><span className="table-mark">{course.hanzi}</span>{course.titleVi}</Link></td><td>{course.lessonCount}</td><td><StatusBadge status={course.status} /></td><td>{course.updatedAt.toLocaleDateString("vi-VN")}</td></tr>)}</tbody></table></div></section>
      <section className="admin-panel"><div className="panel-heading"><h2>Quy trình nội dung</h2><span>Dữ liệu thật</span></div><div className="pipeline"><div className="pipeline-step"><span>01</span><div><strong>Bản nháp</strong><span>Đang biên soạn</span></div><strong>{data.lessonStatuses.draft ?? 0} bài</strong></div><div className="pipeline-step"><span>02</span><div><strong>Chờ duyệt</strong><span>Sẵn sàng kiểm tra</span></div><strong>{data.lessonStatuses.review ?? 0} bài</strong></div><div className="pipeline-step"><span>03</span><div><strong>Đã xuất bản</strong><span>Người học đang thấy</span></div><strong>{data.lessonStatuses.published ?? 0} bài</strong></div><div className="pipeline-step"><span>04</span><div><strong>Lưu trữ</strong><span>Không còn công khai</span></div><strong>{data.lessonStatuses.archived ?? 0} bài</strong></div></div></section>
    </div>
    <div className="admin-lower one"><section className="admin-panel"><div className="panel-heading"><h2>Audit gần đây</h2><span>{data.activities.length} sự kiện</span></div><div className="activity-list">{data.activities.length ? data.activities.map((activity) => <div className="activity-item" key={activity.id}><i className="activity-dot" /><div><p>{actionLabels[activity.action] ?? activity.action}</p><span>{activity.actorName ?? "Hệ thống"} · {activity.createdAt.toLocaleString("vi-VN")}</span></div></div>) : <p className="admin-empty">Chưa có hoạt động quản trị.</p>}</div></section></div>
  </div></main>;
}
