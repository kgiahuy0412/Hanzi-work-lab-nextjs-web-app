import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { LessonWorkspace } from "@/components/lesson-workspace";
import { getCurrentUser } from "@/lib/auth-session";
import { listPublishedCourses } from "@/lib/course-repository";
import { getDailySessionSource } from "@/lib/daily-session-repository";
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
  searchParams: Promise<{ lesson?: string; session?: string }>;
}) {
  const [{ slug }, { lesson: lessonSlug, session }, user] = await Promise.all([params, searchParams, getCurrentUser()]);
  const dailyFlow = session === "today";
  const [data, dailySource] = await Promise.all([
    getLessonPageData({ courseSlug: slug, lessonSlug, userId: user?.id ?? null }),
    dailyFlow ? getDailySessionSource(user?.id ?? null) : Promise.resolve(null),
  ]);
  if (!data || data.invalidLesson) notFound();
  const dailyNextStep = !dailySource
    ? null
    : !dailySource.practiceCompletedToday
      ? dailySource.practice
      : !dailySource.gameCompletedToday
        ? dailySource.game
        : { href: "/#today-summary", title: "Tổng kết phiên 10 phút" };

  return <main className="lesson-page"><div className="section-shell">
    <div className="lesson-breadcrumb"><Link href="/courses">Lộ trình</Link><ChevronRight size={13} /><Link href={`/courses/${data.course.slug}`}>{data.course.title}</Link>{data.lesson ? <><ChevronRight size={13} /><span>{data.lesson.title}</span></> : null}</div>
    {data.lesson && data.access
      ? <LessonWorkspace
        course={data.course}
        lessons={data.lessons}
        lesson={data.lesson}
        access={data.access}
        progress={data.progress}
        authenticated={Boolean(user)}
        dailyFlow={dailyFlow}
        dailyNextStep={dailyNextStep}
        key={data.lesson.slug}
      />
      : <div className="empty-state"><h1>Nội dung đang được biên soạn</h1><p>Lộ trình này đã có trong catalog nhưng chưa có bài học được xuất bản.</p><Link className="button button-primary" href="/courses">Chọn lộ trình khác</Link></div>}
  </div></main>;
}
