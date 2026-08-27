import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, PenLine, Sparkles } from "lucide-react";
import { WRITING_TOPICS } from "@/lib/writing-content";

export const metadata: Metadata = {
  title: "Luyện viết",
  description: "Chọn chủ đề HSK 1–6 và luyện viết Hán tự theo từng bài cùng Himi Chinese.",
};

export default function WritingPage() {
  return <main className="learner-dashboard writing-catalog-page">
    <header className="writing-catalog-hero">
      <div className="writing-catalog-hero-copy">
        <span><Sparkles aria-hidden="true" size={16} /> Lộ trình viết Hán tự</span>
        <h1>Chọn cấp độ.<br />Viết từng nét thật chắc.</h1>
        <p>Sáu chủ đề từ HSK 1 đến HSK 6, mỗi chủ đề gồm một bài học ngắn trước khi vào bàn luyện viết tương tác.</p>
      </div>
      <div aria-hidden="true" className="writing-catalog-hero-mark">
        <span>写</span>
        <small>xiě · viết</small>
      </div>
    </header>

    <section className="writing-topic-section" aria-labelledby="writing-topic-heading">
      <div className="writing-topic-heading">
        <div>
          <span>6 chủ đề · 6 bài học</span>
          <h2 id="writing-topic-heading">Chủ đề theo cấp độ HSK</h2>
        </div>
        <p>Bắt đầu từ cấp phù hợp với bạn. Mỗi bài đều có xem nét, tô theo và tự viết.</p>
      </div>

      <div className="writing-topic-grid">
        {WRITING_TOPICS.map((topic, index) => (
          <article className={`writing-topic-card is-level-${index + 1}`} key={topic.slug}>
            <div className="writing-topic-card-topline">
              <span>{topic.level}</span>
              <small><BookOpen aria-hidden="true" size={14} /> 1 bài học</small>
            </div>
            <div aria-label={`Các chữ trọng tâm: ${topic.characters.map((character) => character.hanzi).join(", ")}`} className="writing-topic-characters" lang="zh-CN">
              {topic.characters.slice(0, 4).map((character) => <span key={character.hanzi}>{character.hanzi}</span>)}
            </div>
            <h3>{topic.title}</h3>
            <p>{topic.summary}</p>
            <div className="writing-topic-card-footer">
              <span><PenLine aria-hidden="true" size={15} /> {topic.characters.length} chữ trọng tâm</span>
              <Link href={`/writing/${topic.slug}`} prefetch>Vào chủ đề <ArrowRight aria-hidden="true" size={17} /></Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  </main>;
}
