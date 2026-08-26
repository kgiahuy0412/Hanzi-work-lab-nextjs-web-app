import "server-only";
import { and, asc, count, desc, eq, ilike, inArray, max, ne, or, sql } from "drizzle-orm";
import { readDb, writeDb, type Database } from "../db/index.ts";
import {
  auditLogs,
  contentVersions,
  courses,
  lessonProgress,
  lessons,
  lessonVocabulary,
  modules,
  reviewItems,
  users,
  vocabulary,
} from "../db/schema.ts";
import type { ContentStatus } from "./admin-content-validation.ts";
import type { LessonContent } from "./content-types.ts";

type DbTransaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
type MutationError = "duplicate_slug" | "not_found" | "unsafe_delete" | "invalid_parent" | "incomplete_content"
  | "workflow_forbidden" | "invalid_transition" | "review_not_ready" | "role_change_forbidden" | "invalid_version"
  | "invalid_reviewer" | "review_assignment_forbidden" | "review_assignment_required" | "invalid_input"
  | "vip_target_ineligible" | "vip_plan_inactive" | "vip_not_active" | "vip_request_not_pending"
  | "vip_request_ineligible" | "duplicate_code" | "vip_plan_in_use" | "user_delete_forbidden";
export type MutationResult = { ok: true; id: string } | { ok: false; error: MutationError };

export type CourseInput = {
  slug: string;
  titleVi: string;
  titleZh: string;
  hanzi: string;
  category: string;
  description: string;
  level: string;
  themeColor: string;
  themeInk: string;
  status: ContentStatus;
  sortOrder: number;
};

export type ModuleInput = {
  courseId: string;
  slug: string;
  title: string;
  description: string;
  sortOrder: number;
};

export type LessonInput = {
  moduleId: string;
  slug: string;
  title: string;
  summary: string;
  situation: string;
  estimatedMinutes: number;
  isFree: boolean;
  status: ContentStatus;
  sortOrder: number;
  content: LessonContent;
  vocabularyIds: string[];
  changeNote: string;
};

export type VocabularyInput = {
  slug: string;
  hanzi: string;
  pinyin: string;
  meaningVi: string;
  exampleZh: string;
  exampleVi: string;
  audioUrl: string;
  tags: string[];
};

async function refreshCourseStats(tx: DbTransaction, courseId: string) {
  await tx.update(courses).set({
    lessonCount: sql<number>`(select count(*)::int from ${lessons} inner join ${modules} on ${lessons.moduleId} = ${modules.id} where ${modules.courseId} = ${courseId} and ${lessons.status} <> 'archived')`,
    totalMinutes: sql<number>`(select coalesce(sum(${lessons.estimatedMinutes}), 0)::int from ${lessons} inner join ${modules} on ${lessons.moduleId} = ${modules.id} where ${modules.courseId} = ${courseId} and ${lessons.status} <> 'archived')`,
    freeLessonCount: sql<number>`(select count(*)::int from ${lessons} inner join ${modules} on ${lessons.moduleId} = ${modules.id} where ${modules.courseId} = ${courseId} and ${lessons.status} <> 'archived' and ${lessons.isFree} = true)`,
    updatedAt: new Date(),
  }).where(eq(courses.id, courseId));
}

export async function getAdminDashboard() {
  return readDb(async (db) => {
    const [courseRows, statusRows, activities] = await Promise.all([
      db.select({
        id: courses.id,
        slug: courses.slug,
        hanzi: courses.hanzi,
        titleVi: courses.titleVi,
        lessonCount: courses.lessonCount,
        status: courses.status,
        updatedAt: courses.updatedAt,
      }).from(courses).orderBy(asc(courses.sortOrder), asc(courses.titleVi)).limit(8),
      db.select({ status: lessons.status, value: count() }).from(lessons).groupBy(lessons.status),
      db.select({
        id: auditLogs.id,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        metadata: auditLogs.metadata,
        createdAt: auditLogs.createdAt,
        actorName: users.displayName,
      }).from(auditLogs).leftJoin(users, eq(auditLogs.actorId, users.id)).orderBy(desc(auditLogs.createdAt)).limit(6),
    ]);
    return {
      courses: courseRows,
      lessonStatuses: Object.fromEntries(statusRows.map((row) => [row.status, row.value])) as Partial<Record<ContentStatus, number>>,
      activities,
    };
  });
}

export async function listAdminCourses() {
  return readDb((db) => db.select().from(courses).orderBy(asc(courses.sortOrder), asc(courses.titleVi)));
}

export async function getAdminCourse(courseId: string) {
  return readDb(async (db) => {
    const [courseRows, moduleRows] = await Promise.all([
      db.select().from(courses).where(eq(courses.id, courseId)).limit(1),
      db.select({
        id: modules.id,
        slug: modules.slug,
        title: modules.title,
        description: modules.description,
        sortOrder: modules.sortOrder,
        lessonCount: sql<number>`(select count(*)::int from ${lessons} where ${lessons.moduleId} = ${modules.id})`,
      }).from(modules).where(eq(modules.courseId, courseId)).orderBy(asc(modules.sortOrder), asc(modules.title)),
    ]);
    return courseRows[0] ? { course: courseRows[0], modules: moduleRows } : null;
  });
}

export async function getAdminModule(moduleId: string) {
  return readDb(async (db) => {
    const [moduleRows, lessonRows] = await Promise.all([
      db.select({
        id: modules.id,
        courseId: modules.courseId,
        slug: modules.slug,
        title: modules.title,
        description: modules.description,
        sortOrder: modules.sortOrder,
        courseTitle: courses.titleVi,
      }).from(modules).innerJoin(courses, eq(modules.courseId, courses.id)).where(eq(modules.id, moduleId)).limit(1),
      db.select({
        id: lessons.id,
        slug: lessons.slug,
        title: lessons.title,
        status: lessons.status,
        isFree: lessons.isFree,
        estimatedMinutes: lessons.estimatedMinutes,
        sortOrder: lessons.sortOrder,
        vocabularyCount: sql<number>`(select count(*)::int from ${lessonVocabulary} where ${lessonVocabulary.lessonId} = ${lessons.id})`,
      }).from(lessons).where(eq(lessons.moduleId, moduleId)).orderBy(asc(lessons.sortOrder), asc(lessons.title)),
    ]);
    return moduleRows[0] ? { module: moduleRows[0], lessons: lessonRows } : null;
  });
}

export async function getAdminLesson(lessonId: string) {
  return readDb(async (db) => {
    const [lessonRows, linkedRows, vocabularyRows, versionRows] = await Promise.all([
      db.select({
        id: lessons.id,
        moduleId: lessons.moduleId,
        slug: lessons.slug,
        title: lessons.title,
        summary: lessons.summary,
        situation: lessons.situation,
        estimatedMinutes: lessons.estimatedMinutes,
        isFree: lessons.isFree,
        status: lessons.status,
        sortOrder: lessons.sortOrder,
        content: lessons.content,
        updatedAt: lessons.updatedAt,
        moduleTitle: modules.title,
        courseId: courses.id,
        courseTitle: courses.titleVi,
      }).from(lessons)
        .innerJoin(modules, eq(lessons.moduleId, modules.id))
        .innerJoin(courses, eq(modules.courseId, courses.id))
        .where(eq(lessons.id, lessonId)).limit(1),
      db.select({ id: lessonVocabulary.vocabularyId }).from(lessonVocabulary).where(eq(lessonVocabulary.lessonId, lessonId)),
      db.select({ id: vocabulary.id, slug: vocabulary.slug, hanzi: vocabulary.hanzi, pinyin: vocabulary.pinyin, meaningVi: vocabulary.meaningVi })
        .from(vocabulary).orderBy(asc(vocabulary.hanzi)).limit(500),
      db.select({ id: contentVersions.id, version: contentVersions.version, changeNote: contentVersions.changeNote, createdAt: contentVersions.createdAt })
        .from(contentVersions).where(eq(contentVersions.lessonId, lessonId)).orderBy(desc(contentVersions.version)).limit(10),
    ]);
    return lessonRows[0] ? {
      lesson: lessonRows[0],
      linkedVocabularyIds: new Set(linkedRows.map((row) => row.id)),
      vocabulary: vocabularyRows,
      versions: versionRows,
    } : null;
  });
}

export async function listAdminVocabulary(query = "") {
  return readDb((db) => db.select({
    id: vocabulary.id,
    slug: vocabulary.slug,
    hanzi: vocabulary.hanzi,
    pinyin: vocabulary.pinyin,
    meaningVi: vocabulary.meaningVi,
    tags: vocabulary.tags,
    updatedAt: vocabulary.updatedAt,
    lessonCount: sql<number>`(select count(*)::int from ${lessonVocabulary} where ${lessonVocabulary.vocabularyId} = ${vocabulary.id})`,
  }).from(vocabulary)
    .where(query ? or(
      ilike(vocabulary.hanzi, `%${query}%`),
      ilike(vocabulary.pinyin, `%${query}%`),
      ilike(vocabulary.meaningVi, `%${query}%`),
      ilike(vocabulary.slug, `%${query}%`),
    ) : undefined)
    .orderBy(desc(vocabulary.updatedAt), asc(vocabulary.hanzi)).limit(300));
}

export async function getAdminVocabulary(vocabularyId: string) {
  return readDb(async (db) => {
    const [rows, linkCount, reviewCount] = await Promise.all([
      db.select().from(vocabulary).where(eq(vocabulary.id, vocabularyId)).limit(1),
      db.select({ value: count() }).from(lessonVocabulary).where(eq(lessonVocabulary.vocabularyId, vocabularyId)),
      db.select({ value: count() }).from(reviewItems).where(eq(reviewItems.vocabularyId, vocabularyId)),
    ]);
    return rows[0] ? { vocabulary: rows[0], lessonCount: linkCount[0]?.value ?? 0, reviewCount: reviewCount[0]?.value ?? 0 } : null;
  });
}

export async function createCourse(input: CourseInput, actorId: string): Promise<MutationResult> {
  return writeDb((db) => db.transaction(async (tx) => {
    const rows = await tx.insert(courses).values({
      ...input,
      publishedAt: input.status === "published" ? new Date() : null,
    }).onConflictDoNothing({ target: courses.slug }).returning({ id: courses.id });
    if (!rows[0]) return { ok: false, error: "duplicate_slug" };
    await tx.insert(auditLogs).values({ actorId, action: "admin.course.created", entityType: "course", entityId: rows[0].id, metadata: { slug: input.slug, status: input.status } });
    return { ok: true, id: rows[0].id };
  }));
}

export async function updateCourse(courseId: string, input: CourseInput, actorId: string): Promise<MutationResult> {
  return writeDb((db) => db.transaction(async (tx) => {
    const [existing, collision] = await Promise.all([
      tx.select({ id: courses.id, publishedAt: courses.publishedAt, status: courses.status }).from(courses).where(eq(courses.id, courseId)).limit(1),
      tx.select({ id: courses.id }).from(courses).where(and(eq(courses.slug, input.slug), ne(courses.id, courseId))).limit(1),
    ]);
    if (!existing[0]) return { ok: false, error: "not_found" };
    if (collision[0]) return { ok: false, error: "duplicate_slug" };
    await tx.update(courses).set({
      ...input,
      publishedAt: input.status === "published" ? existing[0].publishedAt ?? new Date() : existing[0].publishedAt,
      updatedAt: new Date(),
    }).where(eq(courses.id, courseId));
    await tx.insert(auditLogs).values({ actorId, action: "admin.course.updated", entityType: "course", entityId: courseId, metadata: { slug: input.slug, fromStatus: existing[0].status, toStatus: input.status } });
    return { ok: true, id: courseId };
  }));
}

export async function deleteCourse(courseId: string, actorId: string): Promise<MutationResult> {
  return writeDb((db) => db.transaction(async (tx) => {
    const [courseRows, moduleCount] = await Promise.all([
      tx.select({ id: courses.id, slug: courses.slug, status: courses.status }).from(courses).where(eq(courses.id, courseId)).limit(1),
      tx.select({ value: count() }).from(modules).where(eq(modules.courseId, courseId)),
    ]);
    const course = courseRows[0];
    if (!course) return { ok: false, error: "not_found" };
    if (course.status === "published" || (moduleCount[0]?.value ?? 0) > 0) return { ok: false, error: "unsafe_delete" };
    await tx.delete(courses).where(eq(courses.id, courseId));
    await tx.insert(auditLogs).values({ actorId, action: "admin.course.deleted", entityType: "course", metadata: { deletedId: courseId, slug: course.slug } });
    return { ok: true, id: courseId };
  }));
}

export async function createModule(input: ModuleInput, actorId: string): Promise<MutationResult> {
  return writeDb((db) => db.transaction(async (tx) => {
    const parent = await tx.select({ id: courses.id }).from(courses).where(eq(courses.id, input.courseId)).limit(1);
    if (!parent[0]) return { ok: false, error: "invalid_parent" };
    const rows = await tx.insert(modules).values(input).onConflictDoNothing({ target: [modules.courseId, modules.slug] }).returning({ id: modules.id });
    if (!rows[0]) return { ok: false, error: "duplicate_slug" };
    await tx.insert(auditLogs).values({ actorId, action: "admin.module.created", entityType: "module", entityId: rows[0].id, metadata: { courseId: input.courseId, slug: input.slug } });
    return { ok: true, id: rows[0].id };
  }));
}

export async function updateModule(moduleId: string, input: ModuleInput, actorId: string): Promise<MutationResult> {
  return writeDb((db) => db.transaction(async (tx) => {
    const [existing, parent, collision] = await Promise.all([
      tx.select({ id: modules.id }).from(modules).where(eq(modules.id, moduleId)).limit(1),
      tx.select({ id: courses.id }).from(courses).where(eq(courses.id, input.courseId)).limit(1),
      tx.select({ id: modules.id }).from(modules).where(and(eq(modules.courseId, input.courseId), eq(modules.slug, input.slug), ne(modules.id, moduleId))).limit(1),
    ]);
    if (!existing[0]) return { ok: false, error: "not_found" };
    if (!parent[0]) return { ok: false, error: "invalid_parent" };
    if (collision[0]) return { ok: false, error: "duplicate_slug" };
    await tx.update(modules).set(input).where(eq(modules.id, moduleId));
    await tx.insert(auditLogs).values({ actorId, action: "admin.module.updated", entityType: "module", entityId: moduleId, metadata: { courseId: input.courseId, slug: input.slug } });
    return { ok: true, id: moduleId };
  }));
}

export async function deleteModule(moduleId: string, actorId: string): Promise<MutationResult> {
  return writeDb((db) => db.transaction(async (tx) => {
    const [moduleRows, lessonCount] = await Promise.all([
      tx.select({ id: modules.id, courseId: modules.courseId, slug: modules.slug }).from(modules).where(eq(modules.id, moduleId)).limit(1),
      tx.select({ value: count() }).from(lessons).where(eq(lessons.moduleId, moduleId)),
    ]);
    const moduleRecord = moduleRows[0];
    if (!moduleRecord) return { ok: false, error: "not_found" };
    if ((lessonCount[0]?.value ?? 0) > 0) return { ok: false, error: "unsafe_delete" };
    await tx.delete(modules).where(eq(modules.id, moduleId));
    await tx.insert(auditLogs).values({ actorId, action: "admin.module.deleted", entityType: "module", metadata: { deletedId: moduleId, courseId: moduleRecord.courseId, slug: moduleRecord.slug } });
    return { ok: true, id: moduleRecord.courseId };
  }));
}

async function existingVocabularyIds(tx: DbTransaction, ids: string[]): Promise<string[]> {
  if (ids.length === 0) return [];
  const rows = await tx.select({ id: vocabulary.id }).from(vocabulary).where(inArray(vocabulary.id, ids.slice(0, 100)));
  return rows.map((row) => row.id);
}

export async function createLesson(input: LessonInput, actorId: string): Promise<MutationResult> {
  return writeDb((db) => db.transaction(async (tx) => {
    const parentRows = await tx.select({ courseId: modules.courseId }).from(modules).where(eq(modules.id, input.moduleId)).limit(1);
    const parent = parentRows[0];
    if (!parent) return { ok: false, error: "invalid_parent" };
    const rows = await tx.insert(lessons).values({
      moduleId: input.moduleId,
      slug: input.slug,
      title: input.title,
      summary: input.summary,
      situation: input.situation,
      estimatedMinutes: input.estimatedMinutes,
      isFree: input.isFree,
      status: input.status,
      sortOrder: input.sortOrder,
      content: input.content,
    }).onConflictDoNothing({ target: [lessons.moduleId, lessons.slug] }).returning({ id: lessons.id });
    if (!rows[0]) return { ok: false, error: "duplicate_slug" };
    const lessonId = rows[0].id;
    const vocabularyIds = await existingVocabularyIds(tx, input.vocabularyIds);
    if (vocabularyIds.length) await tx.insert(lessonVocabulary).values(vocabularyIds.map((vocabularyId, sortOrder) => ({ lessonId, vocabularyId, sortOrder })));
    await tx.insert(contentVersions).values({ lessonId, version: 1, snapshot: { ...input, vocabularyIds }, changeNote: input.changeNote || "Tạo bài học", createdBy: actorId });
    await refreshCourseStats(tx, parent.courseId);
    await tx.insert(auditLogs).values({ actorId, action: "admin.lesson.created", entityType: "lesson", entityId: lessonId, metadata: { moduleId: input.moduleId, slug: input.slug, status: input.status } });
    return { ok: true, id: lessonId };
  }));
}

export async function updateLesson(lessonId: string, input: LessonInput, actorId: string): Promise<MutationResult> {
  return writeDb((db) => db.transaction(async (tx) => {
    const [existingRows, parentRows, collision, versionRows] = await Promise.all([
      tx.select({ id: lessons.id, status: lessons.status }).from(lessons).where(eq(lessons.id, lessonId)).limit(1),
      tx.select({ courseId: modules.courseId }).from(modules).where(eq(modules.id, input.moduleId)).limit(1),
      tx.select({ id: lessons.id }).from(lessons).where(and(eq(lessons.moduleId, input.moduleId), eq(lessons.slug, input.slug), ne(lessons.id, lessonId))).limit(1),
      tx.select({ value: max(contentVersions.version) }).from(contentVersions).where(eq(contentVersions.lessonId, lessonId)),
    ]);
    const existing = existingRows[0];
    const parent = parentRows[0];
    if (!existing) return { ok: false, error: "not_found" };
    if (!parent) return { ok: false, error: "invalid_parent" };
    if (collision[0]) return { ok: false, error: "duplicate_slug" };
    const vocabularyIds = await existingVocabularyIds(tx, input.vocabularyIds);
    await tx.update(lessons).set({
      moduleId: input.moduleId,
      slug: input.slug,
      title: input.title,
      summary: input.summary,
      situation: input.situation,
      estimatedMinutes: input.estimatedMinutes,
      isFree: input.isFree,
      status: input.status,
      sortOrder: input.sortOrder,
      content: input.content,
      updatedAt: new Date(),
    }).where(eq(lessons.id, lessonId));
    await tx.delete(lessonVocabulary).where(eq(lessonVocabulary.lessonId, lessonId));
    if (vocabularyIds.length) await tx.insert(lessonVocabulary).values(vocabularyIds.map((vocabularyId, sortOrder) => ({ lessonId, vocabularyId, sortOrder })));
    const nextVersion = (versionRows[0]?.value ?? 0) + 1;
    await tx.insert(contentVersions).values({ lessonId, version: nextVersion, snapshot: { ...input, vocabularyIds }, changeNote: input.changeNote || "Cập nhật bài học", createdBy: actorId });
    await refreshCourseStats(tx, parent.courseId);
    await tx.insert(auditLogs).values({ actorId, action: "admin.lesson.updated", entityType: "lesson", entityId: lessonId, metadata: { moduleId: input.moduleId, slug: input.slug, fromStatus: existing.status, toStatus: input.status, version: nextVersion } });
    return { ok: true, id: lessonId };
  }));
}

export async function deleteLesson(lessonId: string, actorId: string): Promise<MutationResult> {
  return writeDb((db) => db.transaction(async (tx) => {
    const [lessonRows, progressCount] = await Promise.all([
      tx.select({ id: lessons.id, slug: lessons.slug, status: lessons.status, courseId: modules.courseId }).from(lessons).innerJoin(modules, eq(lessons.moduleId, modules.id)).where(eq(lessons.id, lessonId)).limit(1),
      tx.select({ value: count() }).from(lessonProgress).where(eq(lessonProgress.lessonId, lessonId)),
    ]);
    const lesson = lessonRows[0];
    if (!lesson) return { ok: false, error: "not_found" };
    if (lesson.status === "published" || lesson.status === "archived" || (progressCount[0]?.value ?? 0) > 0) return { ok: false, error: "unsafe_delete" };
    await tx.delete(lessons).where(eq(lessons.id, lessonId));
    await refreshCourseStats(tx, lesson.courseId);
    await tx.insert(auditLogs).values({ actorId, action: "admin.lesson.deleted", entityType: "lesson", metadata: { deletedId: lessonId, slug: lesson.slug } });
    return { ok: true, id: lesson.courseId };
  }));
}

export async function createVocabulary(input: VocabularyInput, actorId: string): Promise<MutationResult> {
  return writeDb((db) => db.transaction(async (tx) => {
    const rows = await tx.insert(vocabulary).values({
      ...input,
      exampleZh: input.exampleZh || null,
      exampleVi: input.exampleVi || null,
      audioUrl: input.audioUrl || null,
    }).onConflictDoNothing({ target: vocabulary.slug }).returning({ id: vocabulary.id });
    if (!rows[0]) return { ok: false, error: "duplicate_slug" };
    await tx.insert(auditLogs).values({ actorId, action: "admin.vocabulary.created", entityType: "vocabulary", entityId: rows[0].id, metadata: { slug: input.slug, hanzi: input.hanzi } });
    return { ok: true, id: rows[0].id };
  }));
}

export async function updateVocabulary(vocabularyId: string, input: VocabularyInput, actorId: string): Promise<MutationResult> {
  return writeDb((db) => db.transaction(async (tx) => {
    const [existing, collision] = await Promise.all([
      tx.select({ id: vocabulary.id }).from(vocabulary).where(eq(vocabulary.id, vocabularyId)).limit(1),
      tx.select({ id: vocabulary.id }).from(vocabulary).where(and(eq(vocabulary.slug, input.slug), ne(vocabulary.id, vocabularyId))).limit(1),
    ]);
    if (!existing[0]) return { ok: false, error: "not_found" };
    if (collision[0]) return { ok: false, error: "duplicate_slug" };
    await tx.update(vocabulary).set({
      ...input,
      exampleZh: input.exampleZh || null,
      exampleVi: input.exampleVi || null,
      audioUrl: input.audioUrl || null,
      updatedAt: new Date(),
    }).where(eq(vocabulary.id, vocabularyId));
    await tx.insert(auditLogs).values({ actorId, action: "admin.vocabulary.updated", entityType: "vocabulary", entityId: vocabularyId, metadata: { slug: input.slug, hanzi: input.hanzi } });
    return { ok: true, id: vocabularyId };
  }));
}

export async function deleteVocabulary(vocabularyId: string, actorId: string): Promise<MutationResult> {
  return writeDb((db) => db.transaction(async (tx) => {
    const [rows, links, reviews] = await Promise.all([
      tx.select({ id: vocabulary.id, slug: vocabulary.slug }).from(vocabulary).where(eq(vocabulary.id, vocabularyId)).limit(1),
      tx.select({ value: count() }).from(lessonVocabulary).where(eq(lessonVocabulary.vocabularyId, vocabularyId)),
      tx.select({ value: count() }).from(reviewItems).where(eq(reviewItems.vocabularyId, vocabularyId)),
    ]);
    const word = rows[0];
    if (!word) return { ok: false, error: "not_found" };
    if ((links[0]?.value ?? 0) > 0 || (reviews[0]?.value ?? 0) > 0) return { ok: false, error: "unsafe_delete" };
    await tx.delete(vocabulary).where(eq(vocabulary.id, vocabularyId));
    await tx.insert(auditLogs).values({ actorId, action: "admin.vocabulary.deleted", entityType: "vocabulary", metadata: { deletedId: vocabularyId, slug: word.slug } });
    return { ok: true, id: vocabularyId };
  }));
}
