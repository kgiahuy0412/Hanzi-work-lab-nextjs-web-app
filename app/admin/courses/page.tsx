import type { Metadata } from "next";
import Link from "next/link";
import { AdminConsoleHeader, AdminNotice, CourseForm, StatusBadge } from "@/components/admin-console";
import { requireAdminUser } from "@/lib/admin-auth";
import { listAdminCourses } from "@/lib/admin-content-service";
import { createCourseAction } from "../actions";

export const metadata: Metadata = { title: "Quản lý nội dung" };

export default async function AdminCoursesPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  const [user, params] = await Promise.all([requireAdminUser(), searchParams]);
  const courses = await listAdminCourses();
  return <main className="admin-page"><div className="section-shell">
    <AdminConsoleHeader description="Tạo lộ trình mới hoặc mở từng lộ trình để quản lý module và bài học." eyebrow="Content CRUD" title="Lộ trình học" userName={user.displayName} />
    <AdminNotice error={params.error} success={params.success} />
    <div className="admin-content-grid">
      <section className="admin-panel"><div className="panel-heading"><h2>Tạo lộ trình</h2><span>Mặc định bản nháp</span></div><CourseForm action={createCourseAction} submitLabel="Tạo lộ trình" /></section>
      <section className="admin-panel"><div className="panel-heading"><h2>{courses.length} lộ trình</h2><span>PostgreSQL</span></div><div className="table-scroll"><table className="data-table"><thead><tr><th>Lộ trình</th><th>Bài</th><th>Miễn phí</th><th>Trạng thái</th></tr></thead><tbody>{courses.map((course) => <tr key={course.id}><td><Link className="table-course" href={`/admin/courses/${course.id}`} prefetch={false}><span className="table-mark">{course.hanzi}</span><span>{course.titleVi}<small>{course.slug}</small></span></Link></td><td>{course.lessonCount}</td><td>{course.freeLessonCount}</td><td><StatusBadge status={course.status} /></td></tr>)}</tbody></table></div></section>
    </div>
  </div></main>;
}
