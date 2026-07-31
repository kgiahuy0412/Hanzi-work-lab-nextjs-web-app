"use client";

import { useState } from "react";
import { Check, CheckCircle2, LockKeyhole, Volume2 } from "lucide-react";
import type { Course } from "@/lib/course-data";
import { lessonTitles, officeVocabulary } from "@/lib/course-data";

const tabs = ["Từ vựng", "Hội thoại", "Ghi chú"] as const;

export function LessonWorkspace({ course }: { course: Course }) {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Từ vựng");
  const [completed, setCompleted] = useState(false);
  return <div className="lesson-shell">
    <aside className="lesson-sidebar">
      <div className="lesson-sidebar-header"><span>Lộ trình đang học</span><h2>{course.title}</h2><p>4 / {course.lessons} bài đã hoàn thành</p></div>
      <nav className="lesson-nav" aria-label="Danh sách bài học">{lessonTitles.map((title, index) => {
        const active = index === 4; const locked = index > 4;
        return <button className={active ? "active" : ""} key={title} type="button"><span className="lesson-number">{index < 4 ? <Check size={13} /> : index + 1}</span><span className="lesson-nav-copy"><strong>{title}</strong><span>{index < 4 ? "Đã học" : active ? "Đang học" : "VIP"}</span></span>{locked && <LockKeyhole className="lesson-lock" size={14} />}</button>;
      })}</nav>
    </aside>

    <section className="lesson-main">
      <div className="lesson-header-card">
        <div className="lesson-heading-row"><div><span className="section-kicker">Bài 05 · 12 phút</span><h1>Theo dõi tiến độ công việc</h1><p>Học cách hỏi, cập nhật và nhắc về tiến độ một cách tự nhiên tại nơi làm việc.</p></div><div className="lesson-progress-badge"><strong>4 / 6</strong><span>Mục đã học</span></div></div>
        <div className="lesson-tabs" role="tablist" aria-label="Nội dung bài học">{tabs.map((item) => <button className={`lesson-tab ${tab === item ? "active" : ""}`} key={item} onClick={() => setTab(item)} role="tab" aria-selected={tab === item} type="button">{item}</button>)}</div>
      </div>
      <div className="lesson-content-card">
        {tab === "Từ vựng" && <div className="word-list">{officeVocabulary.map((word) => <article className="vocab-row" key={word.hanzi}><div className="vocab-main"><span className="vocab-hanzi" lang="zh">{word.hanzi}</span><div><strong>{word.pinyin}</strong><span>{word.meaning}</span></div></div><div className="vocab-example"><strong lang="zh">{word.example}</strong><span>{word.translation}</span></div><button aria-label={`Âm thanh của từ ${word.hanzi} chưa có trong bản mẫu`} className="sound-button" disabled title="Âm thanh sẽ được bổ sung ở giai đoạn nội dung" type="button"><Volume2 size={18} /></button></article>)}</div>}
        {tab === "Hội thoại" && <div className="dialogue"><div className="dialogue-line"><strong lang="zh">A：项目进度怎么样？</strong><span>Dự án tiến triển thế nào rồi?</span></div><div className="dialogue-line"><strong lang="zh">B：已经完成百分之八十了。</strong><span>Đã hoàn thành 80% rồi.</span></div><div className="dialogue-line"><strong lang="zh">A：可以按时完成吗？</strong><span>Có thể hoàn thành đúng hạn không?</span></div><div className="dialogue-line"><strong lang="zh">B：没问题，明天下午向您汇报。</strong><span>Không vấn đề, chiều mai tôi sẽ báo cáo anh/chị.</span></div></div>}
        {tab === "Ghi chú" && <div className="note-panel"><h3>Mẫu câu nên ghi nhớ</h3><p><strong lang="zh">……进度怎么样？</strong> là mẫu hỏi tình trạng công việc trực tiếp nhưng trung tính. Khi nói với quản lý hoặc khách hàng, có thể thêm <strong lang="zh">请问</strong> ở đầu câu để lịch sự hơn.</p></div>}
        <div className="lesson-complete-row"><p>{completed ? "Tốt lắm! Bài học đã được lưu vào tiến độ." : "Hoàn thành cả ba phần rồi đánh dấu bài học."}</p><button className={`button ${completed ? "button-secondary" : "button-primary"}`} onClick={() => setCompleted(!completed)} type="button"><CheckCircle2 size={18} /> {completed ? "Đã hoàn thành" : "Hoàn thành bài"}</button></div>
      </div>
    </section>
  </div>;
}
