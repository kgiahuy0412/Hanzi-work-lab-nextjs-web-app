import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, PenLine } from "lucide-react";
import { HimiSectionBanner } from "@/components/himi-section-banner";
import { getWritingLevels } from "@/lib/writing-content";

export const metadata: Metadata = {
  title: "Luyện viết",
  description: "Chọn chủ đề HSK 1–6 và luyện viết Hán tự theo từng bài cùng Himi Chinese.",
};

export default function WritingPage() {
  const levels = getWritingLevels();
  const lessonCount = levels.reduce((total, level) => total + level.lessonCount, 0);

  return <main className="learner-dashboard writing-catalog-page">
    <HimiSectionBanner
      className="writing-catalog-banner"
      description={`Chọn trong ${lessonCount} bài học HSK 1–6 và luyện đúng những chữ xuất hiện trong từng bài trên bàn viết tương tác.`}
      titleId="writing-catalog-title"
      titleLines={["Chọn bài đã học.", "Viết từng nét thật chắc."]}
      variant="writing"
    />

    <section className="writing-topic-section" aria-labelledby="writing-topic-heading">
      <div className="writing-topic-heading">
        <div>
          <span>6 cấp độ · {lessonCount} bài học</span>
          <h2 id="writing-topic-heading">Bài luyện viết theo HSK</h2>
        </div>
        <p>Chọn cấp độ rồi vào đúng bài đang học. Mỗi bài đều có xem nét, tô theo và tự viết.</p>
      </div>

      <div className="writing-topic-grid">
        {levels.map((level, index) => (
          <article className={`writing-topic-card is-level-${index + 1}`} key={level.id}>
            <div className="writing-topic-card-topline">
              <span>{level.label}</span>
              <small><BookOpen aria-hidden="true" size={14} /> {level.lessonCount} bài học</small>
            </div>
            <div aria-label={`Một số chữ trong cấp độ: ${level.previewCharacters.join(", ")}`} className="writing-topic-characters" lang="zh-CN">
              {level.previewCharacters.map((character) => <span key={character}>{character}</span>)}
            </div>
            <h3>Luyện viết {level.label}</h3>
            <p>{level.description}</p>
            <div className="writing-topic-card-footer">
              <span><PenLine aria-hidden="true" size={15} /> {level.characterCount} lượt chữ</span>
              <Link href={`/writing/${level.id}`} prefetch>Xem bài học <ArrowRight aria-hidden="true" size={17} /></Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  </main>;
}
