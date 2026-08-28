import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Clock3, PenLine } from "lucide-react";
import { getWritingTopic, WRITING_TOPICS } from "@/lib/writing-content";

type WritingTopicPageProps = {
  params: Promise<{ level: string }>;
};

export function generateStaticParams() {
  return WRITING_TOPICS.map((topic) => ({ level: topic.slug }));
}

export async function generateMetadata({ params }: WritingTopicPageProps): Promise<Metadata> {
  const { level } = await params;
  const topic = getWritingTopic(level);
  if (!topic) return { title: "Không tìm thấy chủ đề luyện viết" };
  return {
    title: `${topic.level} — ${topic.title}`,
    description: topic.summary,
  };
}

export default async function WritingTopicPage({ params }: WritingTopicPageProps) {
  const { level } = await params;
  const topic = getWritingTopic(level);
  if (!topic) notFound();

  return <main className="learner-dashboard writing-lesson-page">
    <nav aria-label="Điều hướng luyện viết" className="writing-breadcrumbs">
      <Link href="/writing"><ArrowLeft aria-hidden="true" size={16} /> Danh sách chủ đề</Link>
      <span aria-hidden="true">/</span>
      <strong>{topic.level}</strong>
    </nav>

    <header className="writing-lesson-hero">
      <div>
        <span>{topic.level} · Chủ đề luyện viết</span>
        <h1>{topic.title}</h1>
        <p>{topic.summary}</p>
      </div>
      <div aria-label={`Các chữ trong bài: ${topic.characters.map((character) => character.hanzi).join(", ")}`} className="writing-lesson-character-strip" lang="zh-CN">
        {topic.characters.map((character) => <span key={character.hanzi}>{character.hanzi}</span>)}
      </div>
    </header>

    <section className="writing-single-lesson" aria-labelledby="writing-lesson-title">
      <div className="writing-single-lesson-index"><BookOpen aria-hidden="true" size={24} /><span>Bài 01</span></div>
      <div className="writing-single-lesson-copy">
        <span>Bài học duy nhất trong chủ đề</span>
        <h2 id="writing-lesson-title">{topic.title}</h2>
        <p>Quan sát cấu trúc chữ, ghi nhớ quy tắc bút thuận rồi thực hành trực tiếp trên bàn viết.</p>
        <ul>
          {topic.outcomes.map((outcome) => <li key={outcome}><CheckCircle2 aria-hidden="true" size={17} /> {outcome}</li>)}
        </ul>
      </div>
      <div className="writing-single-lesson-action">
        <span><Clock3 aria-hidden="true" size={16} /> {topic.duration}</span>
        <span><PenLine aria-hidden="true" size={16} /> {topic.characters.length} chữ</span>
        <Link href={`/writing/${topic.slug}/practice`} prefetch>Bắt đầu bài học <ArrowRight aria-hidden="true" size={18} /></Link>
      </div>
    </section>
  </main>;
}
