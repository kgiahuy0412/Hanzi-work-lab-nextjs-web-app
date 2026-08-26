import type { Metadata } from "next";
import { Suspense } from "react";
import { CourseGridSkeleton } from "@/components/course-catalog-skeleton";
import { CourseExplorer } from "@/components/course-explorer";
import { HimiSectionBanner } from "@/components/himi-section-banner";
import { listPublishedCourses } from "@/lib/course-repository";

export const metadata: Metadata = { title: "Lộ trình chuyên ngành" };

async function CourseCatalog() {
  const courses = await listPublishedCourses();
  return <CourseExplorer courses={courses} />;
}

export default function CoursesPage() {
  return <main className="course-library-page">
    <section className="section-shell himi-banner-shell">
      <HimiSectionBanner
        description="Khám phá lộ trình theo ngành để dùng tiếng Trung hiệu quả trong công việc thực tế."
        titleId="course-library-title"
        titleLines={["Bạn muốn dùng tiếng", "Trung để làm gì?"]}
        variant="courses"
      />
    </section>
    <div id="course-catalog">
      <Suspense fallback={<CourseGridSkeleton />}><CourseCatalog /></Suspense>
    </div>
  </main>;
}
