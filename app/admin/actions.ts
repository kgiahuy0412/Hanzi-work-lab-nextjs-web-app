"use server";

import { revalidatePath, revalidateTag } from "next/cache.js";
import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/admin-auth";
import {
  createCourse,
  createLesson,
  createModule,
  createVocabulary,
  deleteCourse,
  deleteLesson,
  deleteModule,
  deleteVocabulary,
  updateCourse,
  updateLesson,
  updateModule,
  updateVocabulary,
  type CourseInput,
  type LessonInput,
  type ModuleInput,
  type MutationResult,
  type VocabularyInput,
} from "@/lib/admin-content-service";
import {
  isUuid,
  normalizeSlug,
  parseBoolean,
  parseContentStatus,
  parseLessonContent,
  parseTags,
  valueInteger,
  valueString,
} from "@/lib/admin-content-validation";

function resultRedirect(result: MutationResult, successPath: string, errorPath: string, success = "saved"): never {
  if (!result.ok) redirect(`${errorPath}?error=${result.error}`);
  revalidatePath("/admin");
  revalidatePath("/courses");
  revalidateTag("published-content", "max");
  redirect(`${successPath}?success=${success}`);
}

function invalid(path: string): never {
  redirect(`${path}?error=invalid_input`);
}

function courseInput(formData: FormData): CourseInput | null {
  const titleVi = valueString(formData, "titleVi", 180);
  const titleZh = valueString(formData, "titleZh", 180);
  const hanzi = valueString(formData, "hanzi", 12);
  const category = valueString(formData, "category", 100);
  const description = valueString(formData, "description", 4_000);
  const level = valueString(formData, "level", 40);
  const slug = normalizeSlug(valueString(formData, "slug", 160), titleVi);
  const themeColor = valueString(formData, "themeColor", 20) || "#dcebe2";
  const themeInk = valueString(formData, "themeInk", 20) || "#176b5b";
  if (!titleVi || !titleZh || !hanzi || !category || !description || !level || !slug) return null;
  if (!/^#[0-9a-f]{6}$/iu.test(themeColor) || !/^#[0-9a-f]{6}$/iu.test(themeInk)) return null;
  return {
    slug,
    titleVi,
    titleZh,
    hanzi,
    category,
    description,
    level,
    themeColor,
    themeInk,
    status: parseContentStatus(valueString(formData, "status", 20)),
    sortOrder: valueInteger(formData, "sortOrder", 0, 0, 10_000),
  };
}

function moduleInput(formData: FormData): ModuleInput | null {
  const courseId = valueString(formData, "courseId", 40);
  const title = valueString(formData, "title", 180);
  const slug = normalizeSlug(valueString(formData, "slug", 160), title);
  if (!isUuid(courseId) || !title || !slug) return null;
  return {
    courseId,
    title,
    slug,
    description: valueString(formData, "description", 4_000),
    sortOrder: valueInteger(formData, "sortOrder", 0, 0, 10_000),
  };
}

function lessonInput(formData: FormData): LessonInput | null {
  const moduleId = valueString(formData, "moduleId", 40);
  const title = valueString(formData, "title", 180);
  const slug = normalizeSlug(valueString(formData, "slug", 160), title);
  const summary = valueString(formData, "summary", 4_000);
  const situation = valueString(formData, "situation", 180);
  const content = parseLessonContent(
    valueString(formData, "dialogue", 30_000),
    valueString(formData, "notes", 30_000),
  );
  if (!isUuid(moduleId) || !title || !slug || !summary || !situation || !content) return null;
  const vocabularyIds = formData.getAll("vocabularyIds").filter((value): value is string => typeof value === "string" && isUuid(value)).slice(0, 100);
  return {
    moduleId,
    title,
    slug,
    summary,
    situation,
    estimatedMinutes: valueInteger(formData, "estimatedMinutes", 10, 1, 180),
    isFree: parseBoolean(formData, "isFree"),
    status: parseContentStatus(valueString(formData, "status", 20)),
    sortOrder: valueInteger(formData, "sortOrder", 0, 0, 10_000),
    content,
    vocabularyIds,
    changeNote: valueString(formData, "changeNote", 500),
  };
}

function vocabularyInput(formData: FormData): VocabularyInput | null {
  const hanzi = valueString(formData, "hanzi", 120);
  const pinyin = valueString(formData, "pinyin", 220);
  const meaningVi = valueString(formData, "meaningVi", 2_000);
  const slug = normalizeSlug(valueString(formData, "slug", 180), pinyin || hanzi);
  if (!hanzi || !pinyin || !meaningVi || !slug) return null;
  return {
    slug,
    hanzi,
    pinyin,
    meaningVi,
    exampleZh: valueString(formData, "exampleZh", 2_000),
    exampleVi: valueString(formData, "exampleVi", 2_000),
    audioUrl: valueString(formData, "audioUrl", 2_000),
    tags: parseTags(valueString(formData, "tags", 1_000)),
  };
}

function confirmedDelete(formData: FormData): boolean {
  return valueString(formData, "confirmDelete", 20) === "DELETE";
}

export async function createCourseAction(formData: FormData) {
  const admin = await requireAdminUser();
  const input = courseInput(formData);
  if (!input) invalid("/admin/courses");
  const result = await createCourse(input, admin.id);
  resultRedirect(result, result.ok ? `/admin/courses/${result.id}` : "/admin/courses", "/admin/courses", "created");
}

export async function updateCourseAction(formData: FormData) {
  const admin = await requireAdminUser();
  const courseId = valueString(formData, "courseId", 40);
  const input = courseInput(formData);
  if (!isUuid(courseId) || !input) invalid("/admin/courses");
  const result = await updateCourse(courseId, input, admin.id);
  resultRedirect(result, `/admin/courses/${courseId}`, `/admin/courses/${courseId}`);
}

export async function deleteCourseAction(formData: FormData) {
  const admin = await requireAdminUser();
  const courseId = valueString(formData, "courseId", 40);
  if (!isUuid(courseId) || !confirmedDelete(formData)) invalid(isUuid(courseId) ? `/admin/courses/${courseId}` : "/admin/courses");
  const result = await deleteCourse(courseId, admin.id);
  resultRedirect(result, "/admin/courses", `/admin/courses/${courseId}`, "deleted");
}

export async function createModuleAction(formData: FormData) {
  const admin = await requireAdminUser();
  const input = moduleInput(formData);
  const errorPath = input?.courseId ? `/admin/courses/${input.courseId}` : "/admin/courses";
  if (!input) invalid(errorPath);
  const result = await createModule(input, admin.id);
  resultRedirect(result, result.ok ? `/admin/modules/${result.id}` : errorPath, errorPath, "created");
}

export async function updateModuleAction(formData: FormData) {
  const admin = await requireAdminUser();
  const moduleId = valueString(formData, "moduleId", 40);
  const input = moduleInput(formData);
  if (!isUuid(moduleId) || !input) invalid(isUuid(moduleId) ? `/admin/modules/${moduleId}` : "/admin/courses");
  const result = await updateModule(moduleId, input, admin.id);
  resultRedirect(result, `/admin/modules/${moduleId}`, `/admin/modules/${moduleId}`);
}

export async function deleteModuleAction(formData: FormData) {
  const admin = await requireAdminUser();
  const moduleId = valueString(formData, "moduleId", 40);
  const courseId = valueString(formData, "courseId", 40);
  if (!isUuid(moduleId) || !isUuid(courseId) || !confirmedDelete(formData)) invalid(isUuid(moduleId) ? `/admin/modules/${moduleId}` : "/admin/courses");
  const result = await deleteModule(moduleId, admin.id);
  resultRedirect(result, `/admin/courses/${courseId}`, `/admin/modules/${moduleId}`, "deleted");
}

export async function createLessonAction(formData: FormData) {
  const admin = await requireAdminUser();
  const input = lessonInput(formData);
  const errorPath = input?.moduleId ? `/admin/modules/${input.moduleId}` : "/admin/courses";
  if (!input) invalid(errorPath);
  const result = await createLesson(input, admin.id);
  resultRedirect(result, result.ok ? `/admin/lessons/${result.id}` : errorPath, errorPath, "created");
}

export async function updateLessonAction(formData: FormData) {
  const admin = await requireAdminUser();
  const lessonId = valueString(formData, "lessonId", 40);
  const input = lessonInput(formData);
  if (!isUuid(lessonId) || !input) invalid(isUuid(lessonId) ? `/admin/lessons/${lessonId}` : "/admin/courses");
  const result = await updateLesson(lessonId, input, admin.id);
  resultRedirect(result, `/admin/lessons/${lessonId}`, `/admin/lessons/${lessonId}`);
}

export async function deleteLessonAction(formData: FormData) {
  const admin = await requireAdminUser();
  const lessonId = valueString(formData, "lessonId", 40);
  const moduleId = valueString(formData, "moduleId", 40);
  if (!isUuid(lessonId) || !isUuid(moduleId) || !confirmedDelete(formData)) invalid(isUuid(lessonId) ? `/admin/lessons/${lessonId}` : "/admin/courses");
  const result = await deleteLesson(lessonId, admin.id);
  resultRedirect(result, `/admin/modules/${moduleId}`, `/admin/lessons/${lessonId}`, "deleted");
}

export async function createVocabularyAction(formData: FormData) {
  const admin = await requireAdminUser();
  const input = vocabularyInput(formData);
  if (!input) invalid("/admin/vocabulary");
  const result = await createVocabulary(input, admin.id);
  resultRedirect(result, result.ok ? `/admin/vocabulary/${result.id}` : "/admin/vocabulary", "/admin/vocabulary", "created");
}

export async function updateVocabularyAction(formData: FormData) {
  const admin = await requireAdminUser();
  const vocabularyId = valueString(formData, "vocabularyId", 40);
  const input = vocabularyInput(formData);
  if (!isUuid(vocabularyId) || !input) invalid(isUuid(vocabularyId) ? `/admin/vocabulary/${vocabularyId}` : "/admin/vocabulary");
  const result = await updateVocabulary(vocabularyId, input, admin.id);
  resultRedirect(result, `/admin/vocabulary/${vocabularyId}`, `/admin/vocabulary/${vocabularyId}`);
}

export async function deleteVocabularyAction(formData: FormData) {
  const admin = await requireAdminUser();
  const vocabularyId = valueString(formData, "vocabularyId", 40);
  if (!isUuid(vocabularyId) || !confirmedDelete(formData)) invalid(isUuid(vocabularyId) ? `/admin/vocabulary/${vocabularyId}` : "/admin/vocabulary");
  const result = await deleteVocabulary(vocabularyId, admin.id);
  resultRedirect(result, "/admin/vocabulary", `/admin/vocabulary/${vocabularyId}`, "deleted");
}
