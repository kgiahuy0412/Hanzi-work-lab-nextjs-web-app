import { and, eq } from "drizzle-orm";
import { readDb, writeDb } from "../db/index.ts";
import type { Database } from "../db/index.ts";
import {
  courses,
  lessonProgress,
  lessonVocabulary,
  lessons,
  modules,
  reviewItems,
  vocabulary,
} from "../db/schema.ts";
import type { LearningSummary, LessonProgressState } from "./content-types.ts";
import { getLessonAccess, hasActiveVipAccess } from "./lesson-access.ts";
import { scheduleReview } from "./review-scheduler.ts";

async function findPublishedLesson(db: Database, courseSlug: string, lessonSlug: string) {
  const rows = await db
    .select({ id: lessons.id, isFree: lessons.isFree })
    .from(lessons)
    .innerJoin(modules, eq(lessons.moduleId, modules.id))
    .innerJoin(courses, eq(modules.courseId, courses.id))
    .where(and(
      eq(courses.slug, courseSlug),
      eq(courses.status, "published"),
      eq(lessons.slug, lessonSlug),
      eq(lessons.status, "published"),
    ))
    .limit(1);
  return rows[0] ?? null;
}

export async function getLessonProgress(userId: string, lessonId: string, database?: Database): Promise<LessonProgressState | null> {
  const query = (db: Database) => db
    .select({
      completionPercent: lessonProgress.completionPercent,
      completedAt: lessonProgress.completedAt,
      lastOpenedAt: lessonProgress.lastOpenedAt,
    })
    .from(lessonProgress)
    .where(and(eq(lessonProgress.userId, userId), eq(lessonProgress.lessonId, lessonId)))
    .limit(1);
  const rows = database ? await query(database) : await readDb(query);
  const progress = rows[0];
  return progress ? {
    completionPercent: progress.completionPercent,
    completedAt: progress.completedAt?.toISOString() ?? null,
    lastOpenedAt: progress.lastOpenedAt.toISOString(),
  } : null;
}

export async function markLessonOpened(userId: string, courseSlug: string, lessonSlug: string): Promise<boolean> {
  return writeDb(async (db) => {
    const lesson = await findPublishedLesson(db, courseSlug, lessonSlug);
    if (!lesson) return false;
    const access = await getLessonAccess({ isFree: lesson.isFree, userId, database: db });
    if (!access.allowed) return false;
    const now = new Date();
    await db.insert(lessonProgress).values({ userId, lessonId: lesson.id, lastOpenedAt: now })
      .onConflictDoUpdate({
        target: [lessonProgress.userId, lessonProgress.lessonId],
        set: { lastOpenedAt: now },
      });
    return true;
  });
}

export async function completeLesson(userId: string, courseSlug: string, lessonSlug: string): Promise<boolean> {
  return writeDb(async (db) => {
    const lesson = await findPublishedLesson(db, courseSlug, lessonSlug);
    if (!lesson) return false;
    const access = await getLessonAccess({ isFree: lesson.isFree, userId, database: db });
    if (!access.allowed) return false;
    const now = new Date();
    await db.insert(lessonProgress).values({
      userId,
      lessonId: lesson.id,
      completionPercent: 100,
      completedAt: now,
      lastOpenedAt: now,
    }).onConflictDoUpdate({
      target: [lessonProgress.userId, lessonProgress.lessonId],
      set: { completionPercent: 100, completedAt: now, lastOpenedAt: now },
    });
    return true;
  });
}

export async function recordVocabularyReview(userId: string, vocabularySlug: string, remembered: boolean): Promise<boolean> {
  return writeDb(async (db) => {
    const words = await db.select({ id: vocabulary.id, isFree: lessons.isFree })
      .from(vocabulary)
      .innerJoin(lessonVocabulary, eq(lessonVocabulary.vocabularyId, vocabulary.id))
      .innerJoin(lessons, eq(lessonVocabulary.lessonId, lessons.id))
      .innerJoin(modules, eq(lessons.moduleId, modules.id))
      .innerJoin(courses, eq(modules.courseId, courses.id))
      .where(and(
        eq(vocabulary.slug, vocabularySlug),
        eq(courses.status, "published"),
        eq(lessons.status, "published"),
      ))
      .limit(4);
    const word = words[0];
    if (!word) return false;
    if (!words.some((item) => item.isFree) && !(await hasActiveVipAccess(userId, db))) return false;

    const rows = await db.select({
      state: reviewItems.state,
      easeScore: reviewItems.easeScore,
      intervalDays: reviewItems.intervalDays,
      correctCount: reviewItems.correctCount,
      wrongCount: reviewItems.wrongCount,
    }).from(reviewItems).where(and(eq(reviewItems.userId, userId), eq(reviewItems.vocabularyId, word.id))).limit(1);
    const reviewedAt = new Date();
    const schedule = scheduleReview(rows[0] ?? null, remembered, reviewedAt);

    await db.insert(reviewItems).values({ userId, vocabularyId: word.id, ...schedule, lastReviewedAt: reviewedAt })
      .onConflictDoUpdate({
        target: [reviewItems.userId, reviewItems.vocabularyId],
        set: { ...schedule, lastReviewedAt: reviewedAt },
      });
    return true;
  });
}

export async function getLearningSummary(userId: string): Promise<LearningSummary> {
  const rows = await readDb((db) => db.select({ completionPercent: lessonProgress.completionPercent }).from(lessonProgress).where(eq(lessonProgress.userId, userId)));
  return {
    openedLessons: rows.length,
    completedLessons: rows.filter((row) => row.completionPercent >= 100).length,
  };
}
