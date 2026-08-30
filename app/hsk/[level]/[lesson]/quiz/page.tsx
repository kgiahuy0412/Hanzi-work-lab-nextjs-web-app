import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HskLessonWorkspace } from "@/components/hsk-lesson-workspace";
import { getHskLearningLessonContent } from "@/lib/hsk-learning-content";

type PageProps = { params: Promise<{ level: string; lesson: string }> };

async function getLesson(params: PageProps["params"]) {
  const { level, lesson } = await params;
  return getHskLearningLessonContent(level, lesson);
}

export const metadata: Metadata = { title: "Quiz HSK" };

export default async function HskQuizPage({ params }: PageProps) {
  const lesson = await getLesson(params);
  if (!lesson?.exercises.length) notFound();
  return <HskLessonWorkspace initialMode="exercise" lesson={lesson} showLaunchActions={false} />;
}
