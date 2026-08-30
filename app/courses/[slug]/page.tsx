import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourseRoadmap } from "@/components/course-roadmap";
import { getCurrentUser } from "@/lib/auth-session";
import { getCourseRoadmapPageData } from "@/lib/course-roadmap-repository";
import { getPublishedCourse, listPublishedCourses } from "@/lib/course-repository";

export async function generateStaticParams() {
  const courses = await listPublishedCourses();
  return courses.map((course) => ({ slug: course.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = await getPublishedCourse(slug);
  return course
    ? { title: `Lộ trình ${course.title}`, description: course.description }
    : { title: "Lộ trình không tồn tại" };
}

export default async function CourseRoadmapPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [{ slug }, user] = await Promise.all([params, getCurrentUser()]);
  const data = await getCourseRoadmapPageData({ courseSlug: slug, userId: user?.id ?? null });
  if (!data) notFound();

  return <CourseRoadmap
    authenticated={Boolean(user)}
    course={data.course}
    roadmap={data.roadmap}
  />;
}
