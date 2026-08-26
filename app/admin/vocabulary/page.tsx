import type { Metadata } from "next";
import Link from "next/link";
import { AdminConsoleHeader, AdminNotice, VocabularyForm } from "@/components/admin-console";
import { requireAdminUser } from "@/lib/admin-auth";
import { listAdminVocabulary } from "@/lib/admin-content-service";
import { createVocabularyAction } from "../actions";

export const metadata: Metadata = { title: "Quản lý từ vựng" };

export default async function AdminVocabularyPage({ searchParams }: { searchParams: Promise<{ q?: string; error?: string; success?: string }> }) {
  const [query, user] = await Promise.all([searchParams, requireAdminUser()]);
  const search = query.q?.trim().slice(0, 100) ?? "";
  const words = await listAdminVocabulary(search);
  return <main className="admin-page"><div className="section-shell">
    <AdminConsoleHeader description="Tạo từ dùng chung rồi liên kết vào từng bài học trong Lesson editor." eyebrow="Vocabulary CRUD" title="Kho từ vựng" userName={user.displayName} />
    <AdminNotice error={query.error} success={query.success} />
    <div className="admin-content-grid vocabulary-layout">
      <section className="admin-panel"><div className="panel-heading"><h2>Thêm từ vựng</h2><span>Dùng chung nhiều bài</span></div><VocabularyForm action={createVocabularyAction} submitLabel="Tạo từ vựng" /></section>
      <section className="admin-panel"><div className="panel-heading"><h2>{words.length} từ</h2><span>Tối đa 300 kết quả</span></div><form className="admin-search" method="get"><input defaultValue={search} maxLength={100} name="q" placeholder="Tìm chữ Hán, pinyin, nghĩa hoặc slug" /><button className="button button-secondary" type="submit">Tìm</button></form><div className="admin-record-list vocabulary-list">{words.map((word) => <Link href={`/admin/vocabulary/${word.id}`} key={word.id} prefetch={false}><span><strong lang="zh">{word.hanzi}</strong><small>{word.pinyin} · {word.meaningVi}</small></span><b>{word.lessonCount} bài →</b></Link>)}</div></section>
    </div>
  </div></main>;
}
