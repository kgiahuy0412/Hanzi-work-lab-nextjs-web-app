import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminConsoleHeader, AdminNotice, LessonEditForm, StatusBadge } from "@/components/admin-console";
import { requireAdminUser } from "@/lib/admin-auth";
import { getAdminLesson } from "@/lib/admin-content-service";
import { deleteLessonAction, updateLessonAction } from "../../actions";

export const metadata: Metadata = { title: "Biên tập bài học" };

export default async function AdminLessonPage({ params, searchParams }: { params: Promise<{ lessonId: string }>; searchParams: Promise<{ error?: string; success?: string }> }) {
  const [{ lessonId }, query, user] = await Promise.all([params, searchParams, requireAdminUser()]);
  const data = await getAdminLesson(lessonId);
  if (!data) notFound();
  return <main className="admin-page"><div className="section-shell">
    <AdminConsoleHeader backHref={`/admin/modules/${data.lesson.moduleId}`} description={`${data.lesson.courseTitle} · ${data.lesson.moduleTitle}`} eyebrow="Lesson editor" title={data.lesson.title} userName={user.displayName} />
    <AdminNotice error={query.error} success={query.success} />
    <div className="admin-detail-grid lesson-layout">
      <section className="admin-panel"><div className="panel-heading"><h2>Nội dung bài học</h2><StatusBadge status={data.lesson.status} /></div><LessonEditForm action={updateLessonAction} lesson={data.lesson} linkedVocabularyIds={data.linkedVocabularyIds} vocabulary={data.vocabulary} /></section>
      <aside className="admin-side-stack">
        <section className="admin-panel"><div className="panel-heading"><h2>Phiên bản</h2><span>{data.versions.length} gần nhất</span></div><div className="version-list">{data.versions.map((version) => <div key={version.id}><strong>v{version.version}</strong><span>{version.changeNote || "Không có ghi chú"}</span><small>{version.createdAt.toLocaleString("vi-VN")}</small></div>)}</div></section>
        <section className="admin-panel danger-panel"><h2>Xóa cứng</h2><p>Chỉ xóa được bài draft/review chưa có tiến độ. Bài đã xuất bản cần chuyển sang Lưu trữ.</p><form action={deleteLessonAction} className="admin-delete-form"><input name="lessonId" type="hidden" value={data.lesson.id} /><input name="moduleId" type="hidden" value={data.lesson.moduleId} /><label><input name="confirmDelete" type="checkbox" value="DELETE" /> Tôi hiểu dữ liệu sẽ bị xóa</label><button className="button button-danger" type="submit">Xóa bài học</button></form></section>
      </aside>
    </div>
  </div></main>;
}
