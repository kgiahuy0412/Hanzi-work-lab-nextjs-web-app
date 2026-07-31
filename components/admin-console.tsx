import Link from "next/link";
import { ArrowLeft, BookOpenText, Languages, LayoutDashboard } from "lucide-react";
import type { ContentStatus } from "@/lib/admin-content-validation";
import { serializeDialogue, serializeNotes } from "@/lib/admin-content-validation";

type FormAction = (formData: FormData) => void | Promise<void>;

const statusLabels: Record<ContentStatus, string> = {
  draft: "Bản nháp",
  review: "Chờ duyệt",
  published: "Đã xuất bản",
  archived: "Lưu trữ",
};

const errorMessages: Record<string, string> = {
  duplicate_slug: "Slug đã tồn tại trong phạm vi này. Hãy chọn slug khác.",
  invalid_input: "Dữ liệu chưa hợp lệ. Hãy kiểm tra các trường bắt buộc và định dạng nội dung.",
  invalid_parent: "Lộ trình hoặc module cha không còn tồn tại.",
  not_found: "Không tìm thấy bản ghi cần cập nhật.",
  unsafe_delete: "Không thể xóa cứng vì nội dung đã xuất bản hoặc đang có dữ liệu phụ thuộc. Hãy chuyển trạng thái sang Lưu trữ.",
};

const successMessages: Record<string, string> = {
  created: "Đã tạo nội dung và ghi audit log.",
  deleted: "Đã xóa bản nháp an toàn và ghi audit log.",
  saved: "Đã lưu thay đổi và ghi audit log.",
};

export function AdminConsoleHeader({ title, eyebrow, description, userName, backHref }: {
  title: string;
  eyebrow: string;
  description?: string;
  userName: string;
  backHref?: string;
}) {
  return <>
    <div className="admin-top">
      <div className="admin-title">
        {backHref ? <Link className="admin-back" href={backHref}><ArrowLeft size={14} /> Quay lại</Link> : null}
        <span>{eyebrow}</span><h1>{title}</h1>{description ? <p>{description}</p> : null}
      </div>
      <span className="demo-badge">{userName} · Admin đã xác thực</span>
    </div>
    <nav aria-label="Điều hướng Console" className="admin-nav">
      <Link href="/admin"><LayoutDashboard size={16} /> Tổng quan</Link>
      <Link href="/admin/courses"><BookOpenText size={16} /> Nội dung</Link>
      <Link href="/admin/vocabulary"><Languages size={16} /> Từ vựng</Link>
      <Link href="/account">Tài khoản</Link>
    </nav>
  </>;
}

export function AdminNotice({ error, success }: { error?: string; success?: string }) {
  if (error && errorMessages[error]) return <p className="admin-message error" role="alert">{errorMessages[error]}</p>;
  if (success && successMessages[success]) return <p className="admin-message success" role="status">{successMessages[success]}</p>;
  return null;
}

export function StatusBadge({ status }: { status: ContentStatus }) {
  return <span className={`status ${status}`}>{statusLabels[status]}</span>;
}

export function CourseForm({ action, course, submitLabel }: {
  action: FormAction;
  course?: {
    id: string; slug: string; titleVi: string; titleZh: string; hanzi: string; category: string; description: string;
    level: string; themeColor: string; themeInk: string; status: ContentStatus; sortOrder: number;
  };
  submitLabel: string;
}) {
  return <form action={action} className="admin-form" key={course?.id ?? "new-course"}>
    {course ? <input name="courseId" type="hidden" value={course.id} /> : null}
    <div className="admin-form-grid two">
      <label>Tên tiếng Việt<input defaultValue={course?.titleVi} maxLength={180} name="titleVi" required /></label>
      <label>Tên tiếng Trung<input defaultValue={course?.titleZh} maxLength={180} name="titleZh" required /></label>
      <label>Slug<input defaultValue={course?.slug} maxLength={160} name="slug" placeholder="Tự tạo từ tên nếu để trống" /></label>
      <label>Chữ đại diện<input defaultValue={course?.hanzi} maxLength={12} name="hanzi" required /></label>
      <label>Nhóm nội dung<input defaultValue={course?.category} maxLength={100} name="category" required /></label>
      <label>Cấp độ<input defaultValue={course?.level} maxLength={40} name="level" required /></label>
      <label>Trạng thái<select defaultValue={course?.status ?? "draft"} name="status"><option value="draft">Bản nháp</option><option value="review">Chờ duyệt</option><option value="published">Xuất bản</option><option value="archived">Lưu trữ</option></select></label>
      <label>Thứ tự<input defaultValue={course?.sortOrder ?? 0} max={10000} min={0} name="sortOrder" type="number" /></label>
      <label>Màu nền<input defaultValue={course?.themeColor ?? "#dcebe2"} name="themeColor" type="color" /></label>
      <label>Màu chữ<input defaultValue={course?.themeInk ?? "#176b5b"} name="themeInk" type="color" /></label>
    </div>
    <label>Mô tả<textarea defaultValue={course?.description} maxLength={4000} name="description" required rows={4} /></label>
    <button className="button button-primary" type="submit">{submitLabel}</button>
  </form>;
}

export function ModuleForm({ action, courseId, module, submitLabel }: {
  action: FormAction;
  courseId: string;
  module?: { id: string; slug: string; title: string; description: string | null; sortOrder: number };
  submitLabel: string;
}) {
  return <form action={action} className="admin-form" key={module?.id ?? `new-module-${courseId}`}>
    <input name="courseId" type="hidden" value={courseId} />
    {module ? <input name="moduleId" type="hidden" value={module.id} /> : null}
    <div className="admin-form-grid two">
      <label>Tên module<input defaultValue={module?.title} maxLength={180} name="title" required /></label>
      <label>Slug<input defaultValue={module?.slug} maxLength={160} name="slug" placeholder="Tự tạo nếu để trống" /></label>
      <label>Thứ tự<input defaultValue={module?.sortOrder ?? 0} max={10000} min={0} name="sortOrder" type="number" /></label>
    </div>
    <label>Mô tả<textarea defaultValue={module?.description ?? ""} maxLength={4000} name="description" rows={3} /></label>
    <button className="button button-secondary" type="submit">{submitLabel}</button>
  </form>;
}

export function LessonCreateForm({ action, moduleId, nextOrder }: { action: FormAction; moduleId: string; nextOrder: number }) {
  return <form action={action} className="admin-form" key={`new-lesson-${moduleId}`}>
    <input name="moduleId" type="hidden" value={moduleId} />
    <div className="admin-form-grid two">
      <label>Tên bài học<input maxLength={180} name="title" required /></label>
      <label>Slug<input maxLength={160} name="slug" placeholder="Tự tạo nếu để trống" /></label>
      <label>Tình huống<input maxLength={180} name="situation" required /></label>
      <label>Thời lượng<input defaultValue={10} max={180} min={1} name="estimatedMinutes" type="number" /></label>
      <label>Trạng thái<select defaultValue="draft" name="status"><option value="draft">Bản nháp</option><option value="review">Chờ duyệt</option><option value="published">Xuất bản</option></select></label>
      <label>Thứ tự<input defaultValue={nextOrder} max={10000} min={0} name="sortOrder" type="number" /></label>
    </div>
    <label>Tóm tắt<textarea maxLength={4000} name="summary" required rows={3} /></label>
    <label className="admin-check"><input name="isFree" type="checkbox" /> Bài miễn phí</label>
    <input name="changeNote" type="hidden" value="Tạo bài học từ Console" />
    <button className="button button-primary" type="submit">Tạo bài học</button>
  </form>;
}

export function LessonEditForm({ action, lesson, vocabulary, linkedVocabularyIds }: {
  action: FormAction;
  lesson: {
    id: string; moduleId: string; slug: string; title: string; summary: string | null; situation: string | null;
    estimatedMinutes: number; isFree: boolean; status: ContentStatus; sortOrder: number; content: unknown;
  };
  vocabulary: Array<{ id: string; hanzi: string; pinyin: string; meaningVi: string }>;
  linkedVocabularyIds: Set<string>;
}) {
  return <form action={action} className="admin-form lesson-editor" key={lesson.id}>
    <input name="lessonId" type="hidden" value={lesson.id} />
    <input name="moduleId" type="hidden" value={lesson.moduleId} />
    <div className="admin-form-grid two">
      <label>Tên bài học<input defaultValue={lesson.title} maxLength={180} name="title" required /></label>
      <label>Slug<input defaultValue={lesson.slug} maxLength={160} name="slug" required /></label>
      <label>Tình huống<input defaultValue={lesson.situation ?? ""} maxLength={180} name="situation" required /></label>
      <label>Thời lượng<input defaultValue={lesson.estimatedMinutes} max={180} min={1} name="estimatedMinutes" type="number" /></label>
      <label>Trạng thái<select defaultValue={lesson.status} name="status"><option value="draft">Bản nháp</option><option value="review">Chờ duyệt</option><option value="published">Xuất bản</option><option value="archived">Lưu trữ</option></select></label>
      <label>Thứ tự<input defaultValue={lesson.sortOrder} max={10000} min={0} name="sortOrder" type="number" /></label>
    </div>
    <label>Tóm tắt<textarea defaultValue={lesson.summary ?? ""} maxLength={4000} name="summary" required rows={3} /></label>
    <label className="admin-check"><input defaultChecked={lesson.isFree} name="isFree" type="checkbox" /> Bài miễn phí</label>
    <div className="admin-editor-help"><strong>Hội thoại</strong><span>Mỗi dòng: Người nói | Chữ Hán | Pinyin | Dịch Việt</span></div>
    <textarea defaultValue={serializeDialogue(lesson.content)} name="dialogue" placeholder="A | 你好 | Nǐ hǎo | Xin chào" rows={8} />
    <div className="admin-editor-help"><strong>Ghi chú</strong><span>Mỗi dòng: Tiêu đề | Mẫu câu | Giải thích</span></div>
    <textarea defaultValue={serializeNotes(lesson.content)} name="notes" placeholder="Cách chào | 您好 | Dùng trong ngữ cảnh lịch sự" rows={6} />
    <fieldset className="vocabulary-picker"><legend>Từ vựng trong bài ({vocabulary.length} từ có sẵn)</legend><div>{vocabulary.map((word) => <label key={word.id}><input defaultChecked={linkedVocabularyIds.has(word.id)} name="vocabularyIds" type="checkbox" value={word.id} /><span lang="zh">{word.hanzi}</span><small>{word.pinyin} · {word.meaningVi}</small></label>)}</div></fieldset>
    <label>Ghi chú thay đổi<input maxLength={500} name="changeNote" placeholder="Ví dụ: Sửa pinyin và bổ sung hội thoại" /></label>
    <button className="button button-primary" type="submit">Lưu bài học và tạo phiên bản</button>
  </form>;
}

export function VocabularyForm({ action, word, submitLabel }: {
  action: FormAction;
  word?: { id: string; slug: string; hanzi: string; pinyin: string; meaningVi: string; exampleZh: string | null; exampleVi: string | null; audioUrl: string | null; tags: unknown };
  submitLabel: string;
}) {
  const tags = Array.isArray(word?.tags) ? word.tags.filter((tag): tag is string => typeof tag === "string").join(", ") : "";
  return <form action={action} className="admin-form" key={word?.id ?? "new-vocabulary"}>
    {word ? <input name="vocabularyId" type="hidden" value={word.id} /> : null}
    <div className="admin-form-grid two">
      <label>Chữ Hán<input defaultValue={word?.hanzi} maxLength={120} name="hanzi" required /></label>
      <label>Pinyin<input defaultValue={word?.pinyin} maxLength={220} name="pinyin" required /></label>
      <label>Slug<input defaultValue={word?.slug} maxLength={180} name="slug" placeholder="Tự tạo từ pinyin nếu để trống" /></label>
      <label>Nghĩa tiếng Việt<input defaultValue={word?.meaningVi} maxLength={2000} name="meaningVi" required /></label>
    </div>
    <label>Ví dụ tiếng Trung<textarea defaultValue={word?.exampleZh ?? ""} maxLength={2000} name="exampleZh" rows={2} /></label>
    <label>Dịch ví dụ<textarea defaultValue={word?.exampleVi ?? ""} maxLength={2000} name="exampleVi" rows={2} /></label>
    <div className="admin-form-grid two"><label>Audio URL<input defaultValue={word?.audioUrl ?? ""} maxLength={2000} name="audioUrl" type="url" /></label><label>Tags, phân cách bằng dấu phẩy<input defaultValue={tags} maxLength={1000} name="tags" /></label></div>
    <button className="button button-primary" type="submit">{submitLabel}</button>
  </form>;
}
