import type { LessonSummary } from "./content-types.ts";

export type RoadmapLessonStatus = "completed" | "current" | "locked" | "vip_locked";

export type RoadmapLesson = LessonSummary & {
  status: RoadmapLessonStatus;
  href: string | null;
};

export type RoadmapModule = {
  slug: string;
  title: string;
  order: number;
  status: "completed" | "active" | "locked";
  completedLessons: number;
  totalMinutes: number;
  lessons: RoadmapLesson[];
};

export type CourseRoadmap = {
  modules: RoadmapModule[];
  completedLessons: number;
  completedModules: number;
  totalLessons: number;
  totalMinutes: number;
  remainingMinutes: number;
  progressPercent: number;
  remainingLessonsInActiveModule: number;
  nextLesson: RoadmapLesson | null;
  blockedByVip: boolean;
};

export function buildCourseRoadmap({
  courseSlug,
  lessons,
  completedLessonSlugs,
  viewerHasVip,
}: {
  courseSlug: string;
  lessons: LessonSummary[];
  completedLessonSlugs: string[];
  viewerHasVip: boolean;
}): CourseRoadmap {
  const completed = new Set(completedLessonSlugs);
  const sortedLessons = [...lessons].sort((a, b) => a.order - b.order);
  const nextIncompleteIndex = sortedLessons.findIndex((lesson) => !completed.has(lesson.slug));
  const currentLesson = nextIncompleteIndex >= 0 ? sortedLessons[nextIncompleteIndex] : null;
  const blockedByVip = Boolean(currentLesson && !currentLesson.isFree && !viewerHasVip);

  const roadmapLessons: RoadmapLesson[] = sortedLessons.map((lesson, index) => {
    const isCompleted = completed.has(lesson.slug);
    const isCurrent = index === nextIncompleteIndex;
    const status: RoadmapLessonStatus = isCompleted
      ? "completed"
      : isCurrent
        ? blockedByVip ? "vip_locked" : "current"
        : "locked";
    return {
      ...lesson,
      status,
      href: (status === "completed" || status === "current") && (lesson.isFree || viewerHasVip)
        ? `/learn/${courseSlug}?lesson=${lesson.slug}`
        : null,
    };
  });

  const moduleMap = new Map<string, RoadmapModule>();
  for (const lesson of roadmapLessons) {
    const stage = moduleMap.get(lesson.moduleSlug) ?? {
      slug: lesson.moduleSlug,
      title: lesson.moduleTitle,
      order: lesson.moduleOrder,
      status: "locked" as const,
      completedLessons: 0,
      totalMinutes: 0,
      lessons: [],
    };
    stage.lessons.push(lesson);
    stage.totalMinutes += lesson.estimatedMinutes;
    if (lesson.status === "completed") stage.completedLessons += 1;
    moduleMap.set(lesson.moduleSlug, stage);
  }

  const modules = [...moduleMap.values()]
    .sort((a, b) => a.order - b.order)
    .map((module): RoadmapModule => ({
      ...module,
      status: module.completedLessons === module.lessons.length
        ? "completed"
        : module.lessons.some((lesson) => lesson.status === "current" || lesson.status === "vip_locked")
          ? "active"
          : "locked",
    }));
  const completedLessons = roadmapLessons.filter((lesson) => lesson.status === "completed").length;
  const totalMinutes = roadmapLessons.reduce((total, lesson) => total + lesson.estimatedMinutes, 0);
  const activeModule = modules.find((module) => module.status === "active");

  return {
    modules,
    completedLessons,
    completedModules: modules.filter((module) => module.status === "completed").length,
    totalLessons: roadmapLessons.length,
    totalMinutes,
    remainingMinutes: roadmapLessons
      .filter((lesson) => lesson.status !== "completed")
      .reduce((total, lesson) => total + lesson.estimatedMinutes, 0),
    progressPercent: roadmapLessons.length ? Math.round((completedLessons / roadmapLessons.length) * 100) : 0,
    remainingLessonsInActiveModule: activeModule ? activeModule.lessons.length - activeModule.completedLessons : 0,
    nextLesson: roadmapLessons.find((lesson) => lesson.status === "current") ?? null,
    blockedByVip,
  };
}
