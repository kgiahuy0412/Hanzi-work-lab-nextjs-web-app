import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { courses, getCourse } from "@/lib/course-data";
import { LessonWorkspace } from "@/components/lesson-workspace";

export function generateStaticParams() { return courses.map((course) => ({ slug: course.slug })); }

export default async function LearnPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = getCourse(slug);
  if (!course) notFound();
  return <main className="lesson-page"><div className="section-shell">
    <div className="lesson-breadcrumb"><Link href="/courses">Lộ trình</Link><ChevronRight size={13} /><span>{course.title}</span></div>
    <LessonWorkspace course={course} />
  </div></main>;
}
