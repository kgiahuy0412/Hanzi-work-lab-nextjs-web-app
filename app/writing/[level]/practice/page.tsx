import { notFound, redirect } from "next/navigation";
import { getWritingLessons, WRITING_LEVEL_IDS } from "@/lib/writing-content";

type LegacyWritingPracticePageProps = {
  params: Promise<{ level: string }>;
};

export function generateStaticParams() {
  return WRITING_LEVEL_IDS.map((level) => ({ level }));
}

export default async function LegacyWritingPracticePage({ params }: LegacyWritingPracticePageProps) {
  const { level } = await params;
  const firstLesson = getWritingLessons(level)[0];
  if (!firstLesson) notFound();
  redirect(`/writing/${level}/${firstLesson.id}/practice`);
}
