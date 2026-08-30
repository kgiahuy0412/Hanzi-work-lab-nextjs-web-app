import type { Metadata } from "next";
import { Suspense } from "react";
import { CourseGridSkeleton } from "@/components/course-catalog-skeleton";
import { CourseLibraryView, type CourseLibraryViewName } from "@/components/course-library-view";
import { listPublishedCourses } from "@/lib/course-repository";
import { HSK_CURRICULUM } from "@/lib/hsk-curriculum";

export const metadata: Metadata = {
  title: "Giáo trình HSK & lộ trình chuyên ngành",
  description: "Học theo cấp độ HSK hoặc chọn lộ trình tiếng Trung phù hợp với công việc của bạn.",
};

type CoursesSearchParams = {
  view?: string | string[];
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function CourseCatalog() {
  const courses = await listPublishedCourses();
  return <CourseLibraryView courses={courses} hskCurriculum={HSK_CURRICULUM} view="catalog" />;
}

export default async function CoursesPage({
  searchParams = Promise.resolve({}),
}: {
  searchParams?: Promise<CoursesSearchParams>;
}) {
  const params = await searchParams;
  const view: CourseLibraryViewName = firstValue(params.view) === "hsk" ? "hsk" : "catalog";

  return <main className="course-library-page hsk-curriculum-page">
    {view === "hsk" ? <CourseLibraryView courses={[]} hskCurriculum={HSK_CURRICULUM} view="hsk" /> : <div id="course-catalog">
      <Suspense fallback={<CourseGridSkeleton />}><CourseCatalog /></Suspense>
    </div>}
  </main>;
}
