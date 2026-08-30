import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HskGuidedLesson } from "@/components/hsk-guided-lesson";
import { getHskLearningLessonContent } from "@/lib/hsk-learning-content";

type PageProps = { params: Promise<{ level: string; lesson: string }> };

async function getLesson(params: PageProps["params"]) {
  const { level, lesson } = await params;
  return getHskLearningLessonContent(level, lesson);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const lesson = await getLesson(params);
  return { title: lesson ? `Học bài ${lesson.lessonNumber}: ${lesson.title}` : "Học bài HSK" };
}

export default async function HskGuidedLessonPage({ params }: PageProps) {
  const lesson = await getLesson(params);
  if (!lesson) notFound();
  return <HskGuidedLesson lesson={lesson} />;
}
