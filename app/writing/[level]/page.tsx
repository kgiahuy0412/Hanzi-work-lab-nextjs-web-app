import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, Clock3, PenLine } from "lucide-react";
import { getWritingLevel, getWritingLessons, WRITING_LEVEL_IDS } from "@/lib/writing-content";

type WritingLevelPageProps = {
  params: Promise<{ level: string }>;
};

export function generateStaticParams() {
  return WRITING_LEVEL_IDS.map((level) => ({ level }));
}

export async function generateMetadata({ params }: WritingLevelPageProps): Promise<Metadata> {
  const { level: levelParam } = await params;
  const level = getWritingLevel(levelParam);
  if (!level) return { title: "Không tìm thấy cấp độ luyện viết" };
  return {
    title: `Luyện viết theo bài · ${level.label}`,
    description: `Chọn một trong ${level.lessonCount} bài ${level.label} để luyện viết đúng từ vựng của bài.`,
  };
}

export default async function WritingLevelPage({ params }: WritingLevelPageProps) {
  const { level: levelParam } = await params;
  const level = getWritingLevel(levelParam);
  if (!level) notFound();

  const lessons = getWritingLessons(level.id);
  const heroCharacters = lessons
    .flatMap((lesson) => lesson.previewCharacters)
    .filter((character, index, characters) => characters.indexOf(character) === index)
    .slice(0, 6);

  return <main className="learner-dashboard writing-lesson-page">
    <nav aria-label="Điều hướng luyện viết" className="writing-breadcrumbs">
      <Link href="/writing"><ArrowLeft aria-hidden="true" size={16} /> Các cấp độ</Link>
      <span aria-hidden="true">/</span>
      <strong>{level.label}</strong>
    </nav>

    <header className="writing-lesson-hero">
      <div>
        <span>{level.label} · {lessons.length} bài có thể luyện</span>
        <h1>Luyện viết theo từng bài học</h1>
        <p>Chọn đúng bài bạn đang học. Kho chữ và tiến độ luyện viết sẽ được tách riêng cho từng bài.</p>
      </div>
      <div aria-label={`Một số chữ trong cấp độ: ${heroCharacters.join(", ")}`} className="writing-lesson-character-strip" lang="zh-CN">
        {heroCharacters.map((character) => <span key={character}>{character}</span>)}
      </div>
    </header>

    <section className="writing-lesson-list-section" aria-labelledby="writing-lesson-list-title">
      <div className="writing-lesson-list-heading">
        <div>
          <span>Danh sách bài học</span>
          <h2 id="writing-lesson-list-title">Chọn bài để bắt đầu viết</h2>
        </div>
        <p>{lessons.length} bài · dữ liệu chữ lấy trực tiếp từ giáo trình {level.label}</p>
      </div>

      <div className="writing-lesson-grid">
        {lessons.map((lesson) => (
          <article className="writing-lesson-card" key={lesson.id}>
            <div className="writing-lesson-card-header">
              <span><BookOpen aria-hidden="true" size={16} /> {lesson.sourceLabel} · Bài {String(lesson.lessonNumber).padStart(2, "0")}</span>
              <small>{lesson.topicTitle}</small>
            </div>
            <div aria-label={`Các chữ đầu tiên: ${lesson.previewCharacters.join(", ")}`} className="writing-lesson-card-characters" lang="zh-CN">
              {lesson.previewCharacters.map((character, index) => <span key={`${character}-${index}`}>{character}</span>)}
            </div>
            <h3>{lesson.title}</h3>
            <p>{lesson.summary}</p>
            <div className="writing-lesson-card-footer">
              <div>
                <span><Clock3 aria-hidden="true" size={15} /> {lesson.minutes} phút</span>
                <span><PenLine aria-hidden="true" size={15} /> {lesson.characterCount} chữ</span>
              </div>
              <Link href={`/writing/${level.id}/${lesson.id}/practice`} prefetch>
                Luyện viết <ArrowRight aria-hidden="true" size={17} />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  </main>;
}
