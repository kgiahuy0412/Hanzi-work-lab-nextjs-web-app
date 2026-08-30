import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HskFlashcardSession } from "@/components/hsk-flashcard-session";
import { getHskLessonContent, getHskLessonHref, normalizeHskLevelParam } from "@/lib/hsk-lesson-content";

type PageProps = { params: Promise<{ level: string; lesson: string }> };

async function getLesson(params: PageProps["params"]) {
  const { level, lesson } = await params;
  return getHskLessonContent(normalizeHskLevelParam(level), lesson);
}

export const metadata: Metadata = { title: "Flashcard HSK" };

export default async function HskFlashcardPage({ params }: PageProps) {
  const lesson = await getLesson(params);
  if (!lesson) notFound();
  return <HskFlashcardSession backHref={getHskLessonHref(lesson.levelId, lesson.id)} lesson={lesson} />;
}
