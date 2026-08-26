import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminConsoleHeader, AdminNotice, LessonCreateForm, ModuleForm, StatusBadge } from "@/components/admin-console";
import { requireAdminUser } from "@/lib/admin-auth";
import { getAdminModule } from "@/lib/admin-content-service";
import { createLessonAction, deleteModuleAction, updateModuleAction } from "../../actions";

export const metadata: Metadata = { title: "Quản lý module" };

export default async function AdminModulePage({ params, searchParams }: { params: Promise<{ moduleId: string }>; searchParams: Promise<{ error?: string; success?: string }> }) {
  const [{ moduleId }, query, user] = await Promise.all([params, searchParams, requireAdminUser()]);
  const data = await getAdminModule(moduleId);
  if (!data) notFound();
  const nextOrder = data.lessons.reduce((highest, lesson) => Math.max(highest, lesson.sortOrder), -1) + 1;
  return <main className="admin-page"><div className="section-shell">
    <AdminConsoleHeader backHref={`/admin/courses/${data.module.courseId}`} description={`Thuộc lộ trình ${data.module.courseTitle}`} eyebrow="Module" title={data.module.title} userName={user.displayName} />
    <AdminNotice error={query.error} success={query.success} />
    <div className="admin-detail-grid">
      <section className="admin-panel"><div className="panel-heading"><h2>Thông tin module</h2><span>{data.lessons.length} bài</span></div><ModuleForm action={updateModuleAction} courseId={data.module.courseId} module={data.module} submitLabel="Lưu module" /></section>
      <aside className="admin-panel danger-panel"><h2>Xóa cứng</h2><p>Chỉ xóa được module không còn bài học.</p><form action={deleteModuleAction} className="admin-delete-form"><input name="moduleId" type="hidden" value={data.module.id} /><input name="courseId" type="hidden" value={data.module.courseId} /><label><input name="confirmDelete" type="checkbox" value="DELETE" /> Tôi hiểu dữ liệu sẽ bị xóa</label><button className="button button-danger" type="submit">Xóa module</button></form></aside>
    </div>
    <div className="admin-content-grid modules-section">
      <section className="admin-panel"><div className="panel-heading"><h2>Tạo bài học</h2><span>Soạn chi tiết sau khi tạo</span></div><LessonCreateForm action={createLessonAction} moduleId={data.module.id} nextOrder={nextOrder} /></section>
      <section className="admin-panel"><div className="panel-heading"><h2>{data.lessons.length} bài học</h2><span>Dữ liệu thật</span></div><div className="admin-record-list">{data.lessons.length ? data.lessons.map((lesson) => <Link href={`/admin/lessons/${lesson.id}`} key={lesson.id} prefetch={false}><span><strong>{lesson.title}</strong><small>{lesson.estimatedMinutes} phút · {lesson.vocabularyCount} từ · {lesson.isFree ? "Miễn phí" : "VIP"}</small></span><StatusBadge status={lesson.status} /></Link>) : <p className="admin-empty">Chưa có bài học trong module.</p>}</div></section>
    </div>
  </div></main>;
}
