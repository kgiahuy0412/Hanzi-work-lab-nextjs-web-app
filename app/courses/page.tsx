import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { BookOpenCheck, BriefcaseBusiness, Compass } from "lucide-react";
import { CourseGridSkeleton } from "@/components/course-catalog-skeleton";
import { CourseExplorer } from "@/components/course-explorer";
import { LearnerPageHeader } from "@/components/learner-page-header";
import { listPublishedCourses } from "@/lib/course-repository";

export const metadata: Metadata = { title: "Lộ trình chuyên ngành" };

async function CourseCatalog() {
  const courses = await listPublishedCourses();
  return <CourseExplorer courses={courses} />;
}

export default function CoursesPage() {
  return <main className="course-library-page">
    <section className="section-shell learner-page-header-shell">
      <LearnerPageHeader
        aside={<div className="course-header-image"><Image alt="Nhóm đồng nghiệp trao đổi trong buổi họp công việc" fill priority sizes="(max-width: 720px) calc(100vw - 24px), 360px" src="/assets/courses/workplace-communication.webp" unoptimized /></div>}
        description="Tiếng Trung theo tình huống công việc thật."
        eyebrow="Thư viện lộ trình"
        eyebrowIcon={Compass}
        meta={<><span><BriefcaseBusiness size={16} /><strong>07</strong> chuyên ngành</span><span><BookOpenCheck size={16} /><strong>42</strong> bài học thử</span></>}
        title="Chọn đúng ngành, học đúng việc."
      />
    </section>
    <div id="course-catalog">
      <Suspense fallback={<CourseGridSkeleton />}><CourseCatalog /></Suspense>
    </div>
  </main>;
}
