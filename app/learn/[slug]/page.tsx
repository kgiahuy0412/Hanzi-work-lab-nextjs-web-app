import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { LessonWorkspace } from "@/components/lesson-workspace";
import { getCurrentUser } from "@/lib/auth-session";
import { listPublishedCourses } from "@/lib/course-repository";
import { getLessonPageData } from "@/lib/lesson-repository";

export async function generateStaticParams() {
  const courses = await listPublishedCourses();
  return courses.map((course) => ({ slug: course.slug }));
}

export default async function LearnPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lesson?: string }>;
}) {
  const [{ slug }, { lesson: lessonSlug }, user] = await Promise.all([params, searchParams, getCurrentUser()]);
  const data = await getLessonPageData({ courseSlug: slug, lessonSlug, userId: user?.id ?? null });
  if (!data || data.invalidLesson) notFound();

  return <main className="lesson-page"><div className="section-shell">
    <div className="lesson-breadcrumb"><Link href="/courses">Lộ trình</Link><ChevronRight size={13} /><span>{data.course.title}</span></div>
    {data.lesson && data.access
      ? <LessonWorkspace course={data.course} lessons={data.lessons} lesson={data.lesson} access={data.access} progress={data.progress} authenticated={Boolean(user)} key={data.lesson.slug} />
      : <div className="empty-state"><h1>Nội dung đang được biên soạn</h1><p>Lộ trình này đã có trong catalog nhưng chưa có bài học được xuất bản.</p><Link className="button button-primary" href="/courses">Chọn lộ trình khác</Link></div>}
  </div></main>;
}
