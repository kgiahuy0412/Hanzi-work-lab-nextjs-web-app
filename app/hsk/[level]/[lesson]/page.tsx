import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HskLessonWorkspace } from "@/components/hsk-lesson-workspace";
import { getHskLearningLessonContent } from "@/lib/hsk-learning-content";

type HskLessonPageProps = {
  params: Promise<{ level: string; lesson: string }>;
};

async function getLessonFromParams(params: HskLessonPageProps["params"]) {
  const { level, lesson } = await params;
  return getHskLearningLessonContent(level, lesson);
}

export async function generateMetadata({ params }: HskLessonPageProps): Promise<Metadata> {
  const lesson = await getLessonFromParams(params);
  if (!lesson) return { title: "Bài học HSK" };
  return {
    title: `Bài ${lesson.lessonNumber}: ${lesson.title} · ${lesson.levelLabel}`,
    description: lesson.summary,
  };
}

export default async function HskLessonPage({ params }: HskLessonPageProps) {
  const lesson = await getLessonFromParams(params);
  if (!lesson) notFound();
  return <HskLessonWorkspace lesson={lesson} />;
}
