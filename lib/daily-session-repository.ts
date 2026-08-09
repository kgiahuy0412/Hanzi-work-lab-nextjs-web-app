import "server-only";

import { and, asc, desc, eq, gte, lt } from "drizzle-orm";
import { readDb } from "../db/index.ts";
import {
  courses,
  gameAttempts,
  lessonProgress,
  lessons,
  modules,
  practiceAttempts,
  reviewItems,
} from "../db/schema.ts";
import { gameIds, type GameId } from "./activity-progress.ts";
import {
  defaultDailySessionSource,
  type DailyRecommendation,
  type DailySessionSource,
} from "./daily-session.ts";
import { vietnamDayRange } from "./date-format.ts";
import { hasActiveVipAccess } from "./lesson-access.ts";
import { practiceScenarios } from "./practice-content.ts";

const gameTitles: Record<GameId, string> = {
  slice: "Luyện chém từ",
  memory: "Ghép cặp siêu tốc",
  connect: "Nối nhanh chữ – âm",
  listen: "Nghe và chọn đúng",
  write: "Viết chữ theo nghĩa",
  flash: "Flashcard 3D",
  quiz: "Thử thách tổng hợp",
};

type LessonCandidate = {
  lessonId: string;
  courseSlug: string;
  lessonSlug: string;
  title: string;
  isFree: boolean;
};

function lessonRecommendation(candidate: LessonCandidate | undefined): DailyRecommendation {
  if (!candidate) return defaultDailySessionSource.lesson;
  return {
    href: `/learn/${candidate.courseSlug}?lesson=${candidate.lessonSlug}`,
    title: candidate.title,
  };
}

export async function getDailySessionSource(
  userId: string | null,
  now = new Date(),
): Promise<DailySessionSource> {
  if (!process.env.DATABASE_URL) return defaultDailySessionSource;

  const { start, end } = vietnamDayRange(now);

  const activityPromise = readDb(async (db) => {
    const lessonFields = {
      lessonId: lessons.id,
      courseSlug: courses.slug,
      lessonSlug: lessons.slug,
      title: lessons.title,
      isFree: lessons.isFree,
    };

    const [recentLessons, publishedLessons, reviewRows, lessonRows, practiceRows, gameRows] = await Promise.all([
      userId
        ? db.select(lessonFields)
          .from(lessonProgress)
          .innerJoin(lessons, eq(lessonProgress.lessonId, lessons.id))
          .innerJoin(modules, eq(lessons.moduleId, modules.id))
          .innerJoin(courses, eq(modules.courseId, courses.id))
          .where(and(
            eq(lessonProgress.userId, userId),
            lt(lessonProgress.completionPercent, 100),
            eq(courses.status, "published"),
            eq(lessons.status, "published"),
          ))
          .orderBy(desc(lessonProgress.lastOpenedAt))
          .limit(20)
        : Promise.resolve([] as LessonCandidate[]),
      db.select(lessonFields)
        .from(lessons)
        .innerJoin(modules, eq(lessons.moduleId, modules.id))
        .innerJoin(courses, eq(modules.courseId, courses.id))
        .where(and(eq(courses.status, "published"), eq(lessons.status, "published")))
        .orderBy(asc(courses.sortOrder), asc(modules.sortOrder), asc(lessons.sortOrder))
        .limit(80),
      userId
        ? db.select({ vocabularyId: reviewItems.vocabularyId })
          .from(reviewItems)
          .where(and(
            eq(reviewItems.userId, userId),
            gte(reviewItems.lastReviewedAt, start),
            lt(reviewItems.lastReviewedAt, end),
          ))
        : Promise.resolve([]),
      userId
        ? db.select({
          lessonId: lessonProgress.lessonId,
          completionPercent: lessonProgress.completionPercent,
          completedAt: lessonProgress.completedAt,
          title: lessons.title,
        })
          .from(lessonProgress)
          .innerJoin(lessons, eq(lessonProgress.lessonId, lessons.id))
          .where(eq(lessonProgress.userId, userId))
        : Promise.resolve([]),
      userId
        ? db.select({
          scenarioId: practiceAttempts.scenarioId,
          correctAnswers: practiceAttempts.correctAnswers,
          totalQuestions: practiceAttempts.totalQuestions,
          completedAt: practiceAttempts.completedAt,
        })
          .from(practiceAttempts)
          .where(eq(practiceAttempts.userId, userId))
        : Promise.resolve([]),
      userId
        ? db.select({
          gameId: gameAttempts.gameId,
          score: gameAttempts.score,
          xpEarned: gameAttempts.xpEarned,
          completedAt: gameAttempts.completedAt,
        })
          .from(gameAttempts)
          .where(eq(gameAttempts.userId, userId))
        : Promise.resolve([]),
    ]);

    return {
      recentLessons,
      publishedLessons,
      reviewRows,
      lessonRows,
      practiceRows,
      gameRows,
    };
  });

  const [hasVip, activity] = await Promise.all([
    userId ? hasActiveVipAccess(userId) : Promise.resolve(false),
    activityPromise,
  ]);
  const completedLessonIds = new Set(activity.lessonRows
    .filter((row) => row.completionPercent >= 100)
    .map((row) => row.lessonId));
  const accessibleLesson = activity.recentLessons
    .find((lesson) => lesson.isFree || hasVip)
    ?? activity.publishedLessons.find((lesson) => (lesson.isFree || hasVip) && !completedLessonIds.has(lesson.lessonId))
    ?? activity.publishedLessons.find((lesson) => lesson.isFree || hasVip);
  const completedScenarioIds = new Set(activity.practiceRows.map((row) => row.scenarioId));
  const practice = practiceScenarios
    .filter((scenario) => scenario.isFree || hasVip)
    .find((scenario) => !completedScenarioIds.has(scenario.id))
    ?? practiceScenarios.find((scenario) => scenario.isFree || hasVip);
  const completedGameIds = new Set(activity.gameRows.map((row) => row.gameId));
  const gameId = gameIds.find((id) => !completedGameIds.has(id)) ?? gameIds[0];
  const latestLesson = activity.lessonRows
    .filter((row) => row.completedAt !== null && row.completedAt >= start && row.completedAt < end)
    .reduce<(typeof activity.lessonRows)[number] | null>((latest, row) => (
      !latest || (row.completedAt?.getTime() ?? 0) > (latest.completedAt?.getTime() ?? 0) ? row : latest
    ), null);
  const latestPractice = activity.practiceRows
    .filter((row) => row.completedAt >= start && row.completedAt < end)
    .reduce<(typeof activity.practiceRows)[number] | null>((latest, row) => (
      !latest || row.completedAt > latest.completedAt ? row : latest
    ), null);
  const latestGame = activity.gameRows
    .filter((row) => row.completedAt >= start && row.completedAt < end)
    .reduce<(typeof activity.gameRows)[number] | null>((latest, row) => (
      !latest || row.completedAt > latest.completedAt ? row : latest
    ), null);

  return {
    reviewedToday: activity.reviewRows.length,
    lessonCompletedToday: activity.lessonRows.some((row) => row.completedAt !== null && row.completedAt >= start && row.completedAt < end),
    practiceCompletedToday: activity.practiceRows.some((row) => row.completedAt >= start && row.completedAt < end),
    gameCompletedToday: activity.gameRows.some((row) => row.completedAt >= start && row.completedAt < end),
    lesson: lessonRecommendation(accessibleLesson),
    practice: practice ? {
      href: `/practice?scenario=${practice.id}`,
      title: practice.title,
    } : defaultDailySessionSource.practice,
    game: {
      id: gameId,
      href: `/games?game=${gameId}`,
      title: gameTitles[gameId],
    },
    summary: {
      reviewedWords: activity.reviewRows.length,
      lessonTitle: latestLesson?.title ?? null,
      practiceCorrect: latestPractice?.correctAnswers ?? null,
      practiceTotal: latestPractice?.totalQuestions ?? null,
      gameScore: latestGame?.score ?? null,
      xpEarned: latestGame?.xpEarned ?? 0,
    },
  };
}
