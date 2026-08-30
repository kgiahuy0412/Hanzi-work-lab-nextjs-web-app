"use client";

import { CourseExplorer } from "@/components/course-explorer";
import { HskCurriculumExplorer } from "@/components/hsk-curriculum-explorer";
import type { Course } from "@/lib/content-types";
import type { HskCurriculumLevel } from "@/lib/hsk-curriculum";

export type CourseLibraryViewName = "catalog" | "hsk";

export function CourseLibraryView({
  courses,
  hskCurriculum,
  view,
}: {
  courses: Course[];
  hskCurriculum: HskCurriculumLevel[];
  view: CourseLibraryViewName;
}) {
  if (view === "hsk") {
    return <HskCurriculumExplorer catalogHref="/courses" curriculum={hskCurriculum} />;
  }

  return <>
    <header className="section-shell industry-course-heading course-catalog-heading">
      <span>Lộ trình học tiếng Trung</span>
      <h1>Chọn chủ đề bạn muốn học</h1>
      <p>Học theo chuẩn HSK hoặc chọn tình huống nghề nghiệp sát với mục tiêu sử dụng tiếng Trung của bạn.</p>
    </header>
    <CourseExplorer courses={courses} includeHskCard />
  </>;
}
