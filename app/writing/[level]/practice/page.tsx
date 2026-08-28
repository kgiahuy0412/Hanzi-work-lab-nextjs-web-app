import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HimiWritingStudio } from "@/components/himi-writing-studio";
import { getWritingTopic, WRITING_TOPICS } from "@/lib/writing-content";

type WritingPracticePageProps = {
  params: Promise<{ level: string }>;
};

export function generateStaticParams() {
  return WRITING_TOPICS.map((topic) => ({ level: topic.slug }));
}

export async function generateMetadata({ params }: WritingPracticePageProps): Promise<Metadata> {
  const { level } = await params;
  const topic = getWritingTopic(level);
  if (!topic) return { title: "Không tìm thấy bài luyện viết" };
  return {
    title: `Luyện viết ${topic.level}`,
    description: `Bàn luyện viết tương tác cho bài ${topic.title}.`,
  };
}

export default async function WritingPracticePage({ params }: WritingPracticePageProps) {
  const { level } = await params;
  const topic = getWritingTopic(level);
  if (!topic) notFound();

  return <HimiWritingStudio key={topic.slug} topic={topic} />;
}
