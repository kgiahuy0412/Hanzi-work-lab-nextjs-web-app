import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HskLessonWorkspace } from "@/components/hsk-lesson-workspace";
import { getHskLessonContent, normalizeHskLevelParam } from "@/lib/hsk-lesson-content";

type PageProps = { params: Promise<{ level: string; lesson: string }> };

async function getLesson(params: PageProps["params"]) {
  const { level, lesson } = await params;
  return getHskLessonContent(normalizeHskLevelParam(level), lesson);
}

export const metadata: Metadata = { title: "Quiz HSK" };

export default async function HskQuizPage({ params }: PageProps) {
  const lesson = await getLesson(params);
  if (!lesson) notFound();
  return <HskLessonWorkspace initialMode="exercise" lesson={lesson} showLaunchActions={false} />;
}
