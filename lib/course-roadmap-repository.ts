import { and, eq, gte } from "drizzle-orm";
import { readDb } from "../db/index.ts";
import { courses, lessonProgress, lessons, modules } from "../db/schema.ts";
import { buildCourseRoadmap, type CourseRoadmap } from "./course-roadmap.ts";
import type { Course } from "./content-types.ts";
import { hasActiveVipAccess } from "./lesson-access.ts";
import { getLessonPageData } from "./lesson-repository.ts";

export type CourseRoadmapPageData = {
  course: Course;
  roadmap: CourseRoadmap;
  viewerHasVip: boolean;
};

export async function getCourseRoadmapPageData({
  courseSlug,
  userId,
}: {
  courseSlug: string;
  userId: string | null;
}): Promise<CourseRoadmapPageData | null> {
  const curriculumPromise = getLessonPageData({ courseSlug });
  const learnerStatePromise = !userId || !process.env.DATABASE_URL
    ? Promise.resolve({ completedLessonSlugs: [] as string[], viewerHasVip: false })
    : readDb(async (db) => {
      const [progressRows, viewerHasVip] = await Promise.all([
        db.select({ slug: lessons.slug })
          .from(lessonProgress)
          .innerJoin(lessons, eq(lessonProgress.lessonId, lessons.id))
          .innerJoin(modules, eq(lessons.moduleId, modules.id))
          .innerJoin(courses, eq(modules.courseId, courses.id))
          .where(and(
            eq(lessonProgress.userId, userId),
            gte(lessonProgress.completionPercent, 100),
            eq(courses.slug, courseSlug),
            eq(courses.status, "published"),
            eq(lessons.status, "published"),
          )),
        hasActiveVipAccess(userId, db),
      ]);
      return {
        completedLessonSlugs: progressRows.map((row) => row.slug),
        viewerHasVip,
      };
    });
  const [curriculum, learnerState] = await Promise.all([curriculumPromise, learnerStatePromise]);
  if (!curriculum) return null;

  return {
    course: curriculum.course,
    roadmap: buildCourseRoadmap({
      courseSlug,
      lessons: curriculum.lessons,
      completedLessonSlugs: learnerState.completedLessonSlugs,
      viewerHasVip: learnerState.viewerHasVip,
    }),
    viewerHasVip: learnerState.viewerHasVip,
  };
}
