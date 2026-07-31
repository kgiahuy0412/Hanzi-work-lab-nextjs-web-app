import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminConsoleHeader, AdminNotice, VocabularyForm } from "@/components/admin-console";
import { requireAdminUser } from "@/lib/admin-auth";
import { getAdminVocabulary } from "@/lib/admin-content-service";
import { deleteVocabularyAction, updateVocabularyAction } from "../../actions";

export const metadata: Metadata = { title: "Chỉnh sửa từ vựng" };

export default async function AdminVocabularyDetailPage({ params, searchParams }: { params: Promise<{ vocabularyId: string }>; searchParams: Promise<{ error?: string; success?: string }> }) {
  const [{ vocabularyId }, query, user] = await Promise.all([params, searchParams, requireAdminUser()]);
  const data = await getAdminVocabulary(vocabularyId);
  if (!data) notFound();
  return <main className="admin-page"><div className="section-shell">
    <AdminConsoleHeader backHref="/admin/vocabulary" description={`${data.vocabulary.pinyin} · ${data.vocabulary.meaningVi}`} eyebrow="Vocabulary" title={data.vocabulary.hanzi} userName={user.displayName} />
    <AdminNotice error={query.error} success={query.success} />
    <div className="admin-detail-grid">
      <section className="admin-panel"><div className="panel-heading"><h2>Thông tin từ</h2><span>{data.lessonCount} bài đang dùng</span></div><VocabularyForm action={updateVocabularyAction} submitLabel="Lưu từ vựng" word={data.vocabulary} /></section>
      <aside className="admin-panel danger-panel"><h2>Xóa cứng</h2><p>Chỉ xóa được từ chưa liên kết bài học và chưa có lịch ôn. Hiện có {data.lessonCount} liên kết và {data.reviewCount} lịch ôn.</p><form action={deleteVocabularyAction} className="admin-delete-form"><input name="vocabularyId" type="hidden" value={data.vocabulary.id} /><label><input name="confirmDelete" type="checkbox" value="DELETE" /> Tôi hiểu dữ liệu sẽ bị xóa</label><button className="button button-danger" type="submit">Xóa từ vựng</button></form></aside>
    </div>
  </div></main>;
}
