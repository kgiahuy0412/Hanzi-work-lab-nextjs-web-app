import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminConsoleHeader, AdminNotice, CourseForm, ModuleForm, StatusBadge } from "@/components/admin-console";
import { requireAdminUser } from "@/lib/admin-auth";
import { getAdminCourse } from "@/lib/admin-content-service";
import { deleteCourseAction, createModuleAction, updateCourseAction } from "../../actions";

export const metadata: Metadata = { title: "Chi tiết lộ trình" };

export default async function AdminCoursePage({ params, searchParams }: { params: Promise<{ courseId: string }>; searchParams: Promise<{ error?: string; success?: string }> }) {
  const [{ courseId }, query, user] = await Promise.all([params, searchParams, requireAdminUser()]);
  const data = await getAdminCourse(courseId);
  if (!data) notFound();
  return <main className="admin-page"><div className="section-shell">
    <AdminConsoleHeader backHref="/admin/courses" description={`${data.course.lessonCount} bài · ${data.course.totalMinutes} phút · ${data.course.freeLessonCount} bài miễn phí`} eyebrow="Lộ trình" title={data.course.titleVi} userName={user.displayName} />
    <AdminNotice error={query.error} success={query.success} />
    <div className="admin-detail-grid">
      <section className="admin-panel"><div className="panel-heading"><h2>Thông tin lộ trình</h2><StatusBadge status={data.course.status} /></div><CourseForm action={updateCourseAction} course={data.course} submitLabel="Lưu lộ trình" /></section>
      <aside className="admin-panel danger-panel"><h2>Xóa cứng</h2><p>Chỉ xóa được lộ trình chưa xuất bản và chưa có module.</p><form action={deleteCourseAction} className="admin-delete-form"><input name="courseId" type="hidden" value={data.course.id} /><label><input name="confirmDelete" type="checkbox" value="DELETE" /> Tôi hiểu dữ liệu sẽ bị xóa</label><button className="button button-danger" type="submit">Xóa lộ trình</button></form></aside>
    </div>
    <div className="admin-content-grid modules-section">
      <section className="admin-panel"><div className="panel-heading"><h2>Thêm module</h2><span>Trong {data.course.titleVi}</span></div><ModuleForm action={createModuleAction} courseId={data.course.id} submitLabel="Tạo module" /></section>
      <section className="admin-panel"><div className="panel-heading"><h2>{data.modules.length} module</h2><span>Theo thứ tự hiển thị</span></div><div className="admin-record-list">{data.modules.length ? data.modules.map((module) => <Link href={`/admin/modules/${module.id}`} key={module.id} prefetch={false}><span><strong>{module.title}</strong><small>{module.slug} · {module.lessonCount} bài</small></span><b>Chỉnh sửa →</b></Link>) : <p className="admin-empty">Chưa có module. Hãy tạo module đầu tiên.</p>}</div></section>
    </div>
  </div></main>;
}
