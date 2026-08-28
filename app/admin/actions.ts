"use server";

import { revalidatePath, revalidateTag } from "next/cache.js";
import { redirect } from "next/navigation";
import { requireAdminUser, requirePracticeStaffUser } from "@/lib/admin-auth";
import { deactivateAdminUser, updateUserRole } from "@/lib/admin-user-service";
import {
  createVipPlan,
  deleteVipPlan,
  grantOrExtendVipAccess,
  revokeVipAccess,
  setVipPlanActive,
  updateVipPlan,
  type AdminVipPlanInput,
} from "@/lib/admin-subscription-service";
import { approveVipActivationRequest, rejectVipActivationRequest } from "@/lib/vip-activation-request-service";
import type { UserRole } from "@/lib/auth-service";
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
  createPracticeExercise,
  createPracticeIndustry,
  createPracticeScenario,
  claimPracticeReview,
  deletePracticeExercise,
  deletePracticeIndustry,
  deletePracticeScenario,
  releasePracticeReview,
  reviewPracticeExerciseAudio,
  restorePracticeScenarioVersion,
  updatePracticeExercise,
  updatePracticeIndustry,
  updatePracticeReviewAssignment,
  updatePracticeScenario,
  transitionPracticeScenarioStatus,
  type PracticeExerciseInput,
  type PracticeIndustryInput,
  type PracticeScenarioInput,
} from "@/lib/admin-practice-service";
import { parsePracticeReviewDueDate, parsePracticeReviewPriority } from "@/lib/practice-review-queue";
import { parsePracticeAudioReviewIssues, parsePracticeAudioReviewStatus } from "@/lib/practice-audio-review";
import {
  isUuid,
  normalizeSlug,
  parseBoolean,
  parseContentStatus,
  parseLessonContent,
  parseStringLines,
  parseTags,
  valueInteger,
  valueString,
} from "@/lib/admin-content-validation";

function resultRedirect(result: MutationResult, successPath: string, errorPath: string, success = "saved"): never {
  if (!result.ok) redirect(`${errorPath}?error=${result.error}`);
  revalidatePath("/admin");
  revalidatePath("/courses");
  revalidatePath("/practice");
  revalidatePath("/admin/practice");
  revalidatePath("/admin/subscriptions");
  revalidatePath("/admin/users");
  revalidatePath("/admin/analytics");
  revalidatePath("/account");
  revalidatePath("/vip");
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

function practiceIndustryInput(formData: FormData): PracticeIndustryInput | null {
  const label = valueString(formData, "label", 120);
  const slug = normalizeSlug(valueString(formData, "slug", 80), label);
  const description = valueString(formData, "description", 4_000);
  if (!label || !slug || !description) return null;
  return {
    slug,
    label,
    description,
    imageUrl: valueString(formData, "imageUrl", 2_000),
    status: parseContentStatus(valueString(formData, "status", 20)),
    sortOrder: valueInteger(formData, "sortOrder", 0, 0, 10_000),
  };
}

function practiceScenarioInput(formData: FormData): PracticeScenarioInput | null {
  const industryId = valueString(formData, "industryId", 40);
  const title = valueString(formData, "title", 180);
  const slug = normalizeSlug(valueString(formData, "slug", 120), title);
  const brief = valueString(formData, "brief", 4_000);
  const context = valueString(formData, "context", 4_000);
  const level = valueString(formData, "level", 40);
  const sentenceZh = valueString(formData, "sentenceZh", 4_000);
  const pinyin = valueString(formData, "pinyin", 4_000);
  const translation = valueString(formData, "translation", 4_000);
  const focus = parseTags(valueString(formData, "focus", 2_000));
  if (!isUuid(industryId) || !title || !slug || !brief || !context || !level || !sentenceZh || !pinyin || !translation || focus.length === 0) return null;
  return {
    industryId,
    slug,
    title,
    brief,
    context,
    durationMinutes: valueInteger(formData, "durationMinutes", 7, 1, 180),
    level,
    isFree: parseBoolean(formData, "isFree"),
    sentenceZh,
    pinyin,
    translation,
    focus,
    status: parseContentStatus(valueString(formData, "status", 20)),
    sortOrder: valueInteger(formData, "sortOrder", 0, 0, 10_000),
    changeNote: valueString(formData, "changeNote", 500),
  };
}

function practiceExerciseInput(formData: FormData): PracticeExerciseInput | null {
  const scenarioId = valueString(formData, "scenarioId", 40);
  const audioAssetIdValue = valueString(formData, "audioAssetId", 40);
  const eyebrow = valueString(formData, "eyebrow", 160);
  const prompt = valueString(formData, "prompt", 4_000);
  const listeningText = valueString(formData, "listeningText", 4_000);
  const explanation = valueString(formData, "explanation", 4_000);
  const slug = normalizeSlug(valueString(formData, "slug", 120), eyebrow || prompt);
  const options = parseStringLines(valueString(formData, "options", 16_000), 8);
  const audioUrl = valueString(formData, "audioUrl", 2_000);
  const answerNumber = Number(valueString(formData, "correctOption", 10));
  if (!isUuid(scenarioId) || (audioAssetIdValue && !isUuid(audioAssetIdValue)) || !slug || !eyebrow || !prompt || !listeningText || !explanation || !options || options.length < 2
    || (audioUrl && !audioUrl.startsWith("/") && !/^https?:\/\//iu.test(audioUrl))
    || !Number.isInteger(answerNumber) || answerNumber < 1 || answerNumber > options.length) return null;
  return {
    scenarioId,
    audioAssetId: audioAssetIdValue || null,
    slug,
    eyebrow,
    prompt,
    chinese: valueString(formData, "chinese", 4_000),
    listeningText,
    isStatementCorrect: parseBoolean(formData, "isStatementCorrect"),
    audioUrl,
    options,
    correctOption: answerNumber - 1,
    explanation,
    sortOrder: valueInteger(formData, "sortOrder", 0, 0, 10_000),
    changeNote: valueString(formData, "changeNote", 500),
  };
}

function confirmedDelete(formData: FormData): boolean {
  return valueString(formData, "confirmDelete", 20) === "DELETE";
}

function adminBusinessReturnPath(formData: FormData, fallback: string): string {
  const value = valueString(formData, "returnTo", 40);
  return value === "/admin/users" || value === "/admin/subscriptions" ? value : fallback;
}

function vipPlanInput(formData: FormData): AdminVipPlanInput | null {
  const rawCode = valueString(formData, "code", 50).toUpperCase();
  const code = rawCode.replace(/[^A-Z0-9_]+/gu, "_").replace(/^_+|_+$/gu, "");
  const name = valueString(formData, "name", 100);
  const durationDays = valueInteger(formData, "durationDays", 30, 1, 3_650);
  const priceVnd = valueInteger(formData, "priceVnd", 0, 0, 100_000_000);
  const discountPercent = valueInteger(formData, "discountPercent", 0, 0, 90);
  const benefits = parseStringLines(valueString(formData, "benefits", 4_000), 20);
  if (!code || !name || !benefits) return null;
  return {
    benefits,
    code,
    discountPercent,
    durationDays,
    isActive: parseBoolean(formData, "isActive"),
    name,
    priceVnd,
    promotionLabel: valueString(formData, "promotionLabel", 160),
  };
}

export async function updateUserRoleAction(formData: FormData) {
  const admin = await requireAdminUser();
  const userId = valueString(formData, "userId", 40);
  const roleValue = valueString(formData, "role", 20);
  const role = (["learner", "editor", "reviewer", "admin"] as UserRole[]).find((item) => item === roleValue);
  if (!isUuid(userId) || !role) invalid("/admin/team");
  const result = await updateUserRole(userId, role, admin.id);
  resultRedirect(result, "/admin/team", "/admin/team", "role_updated");
}

export async function deleteAdminUserAction(formData: FormData) {
  const admin = await requireAdminUser();
  const userId = valueString(formData, "userId", 40);
  if (!isUuid(userId) || !confirmedDelete(formData)) invalid("/admin/users");
  const result = await deactivateAdminUser(userId, admin.id);
  resultRedirect(result, "/admin/users", "/admin/users", "user_deleted");
}

export async function grantOrExtendVipAction(formData: FormData) {
  const admin = await requireAdminUser();
  const userId = valueString(formData, "userId", 40);
  const planId = valueString(formData, "planId", 40);
  const returnPath = adminBusinessReturnPath(formData, "/admin/subscriptions");
  if (!isUuid(userId) || !isUuid(planId)) invalid(returnPath);
  const result = await grantOrExtendVipAccess({ userId, planId }, admin.id);
  resultRedirect(result, returnPath, returnPath, "vip_granted");
}

export async function createVipPlanAction(formData: FormData) {
  const admin = await requireAdminUser();
  const input = vipPlanInput(formData);
  if (!input) invalid("/admin/subscriptions");
  const result = await createVipPlan(input, admin.id);
  resultRedirect(result, "/admin/subscriptions", "/admin/subscriptions", "vip_plan_created");
}

export async function updateVipPlanAction(formData: FormData) {
  const admin = await requireAdminUser();
  const planId = valueString(formData, "planId", 40);
  const input = vipPlanInput(formData);
  if (!isUuid(planId) || !input) invalid("/admin/subscriptions");
  const result = await updateVipPlan(planId, input, admin.id);
  resultRedirect(result, "/admin/subscriptions", "/admin/subscriptions", "vip_plan_updated");
}

export async function toggleVipPlanAction(formData: FormData) {
  const admin = await requireAdminUser();
  const planId = valueString(formData, "planId", 40);
  if (!isUuid(planId)) invalid("/admin/subscriptions");
  const result = await setVipPlanActive(planId, parseBoolean(formData, "isActive"), admin.id);
  resultRedirect(result, "/admin/subscriptions", "/admin/subscriptions", "vip_plan_status_updated");
}

export async function deleteVipPlanAction(formData: FormData) {
  const admin = await requireAdminUser();
  const planId = valueString(formData, "planId", 40);
  if (!isUuid(planId) || !confirmedDelete(formData)) invalid("/admin/subscriptions");
  const result = await deleteVipPlan(planId, admin.id);
  resultRedirect(result, "/admin/subscriptions", "/admin/subscriptions", "vip_plan_deleted");
}

export async function revokeVipAction(formData: FormData) {
  const admin = await requireAdminUser();
  const userId = valueString(formData, "userId", 40);
  const confirmation = valueString(formData, "confirmRevoke", 20);
  if (!isUuid(userId) || confirmation !== "REVOKE") invalid("/admin/subscriptions");
  const result = await revokeVipAccess(userId, admin.id);
  resultRedirect(result, "/admin/subscriptions", "/admin/subscriptions", "vip_revoked");
}

export async function approveVipActivationRequestAction(formData: FormData) {
  const admin = await requireAdminUser();
  const requestId = valueString(formData, "requestId", 40);
  const adminNote = valueString(formData, "adminNote", 500);
  if (!isUuid(requestId)) invalid("/admin/subscriptions");
  const result = await approveVipActivationRequest({ requestId, adminNote }, admin.id);
  resultRedirect(result, "/admin/subscriptions", "/admin/subscriptions", "vip_request_approved");
}

export async function rejectVipActivationRequestAction(formData: FormData) {
  const admin = await requireAdminUser();
  const requestId = valueString(formData, "requestId", 40);
  const adminNote = valueString(formData, "adminNote", 500);
  if (!isUuid(requestId) || !adminNote) invalid("/admin/subscriptions");
  const result = await rejectVipActivationRequest({ requestId, adminNote }, admin.id);
  resultRedirect(result, "/admin/subscriptions", "/admin/subscriptions", "vip_request_rejected");
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

export async function createPracticeIndustryAction(formData: FormData) {
  const admin = await requireAdminUser();
  const input = practiceIndustryInput(formData);
  if (!input) invalid("/admin/practice");
  const result = await createPracticeIndustry(input, admin.id);
  resultRedirect(result, result.ok ? `/admin/practice/industries/${result.id}` : "/admin/practice", "/admin/practice", "created");
}

export async function updatePracticeIndustryAction(formData: FormData) {
  const admin = await requireAdminUser();
  const industryId = valueString(formData, "industryId", 40);
  const input = practiceIndustryInput(formData);
  if (!isUuid(industryId) || !input) invalid(isUuid(industryId) ? `/admin/practice/industries/${industryId}` : "/admin/practice");
  const result = await updatePracticeIndustry(industryId, input, admin.id);
  resultRedirect(result, `/admin/practice/industries/${industryId}`, `/admin/practice/industries/${industryId}`);
}

export async function deletePracticeIndustryAction(formData: FormData) {
  const admin = await requireAdminUser();
  const industryId = valueString(formData, "industryId", 40);
  if (!isUuid(industryId) || !confirmedDelete(formData)) invalid(isUuid(industryId) ? `/admin/practice/industries/${industryId}` : "/admin/practice");
  const result = await deletePracticeIndustry(industryId, admin.id);
  resultRedirect(result, "/admin/practice", `/admin/practice/industries/${industryId}`, "deleted");
}

export async function createPracticeScenarioAction(formData: FormData) {
  const staff = await requirePracticeStaffUser();
  const input = practiceScenarioInput(formData);
  const errorPath = input?.industryId ? `/admin/practice/industries/${input.industryId}` : "/admin/practice";
  if (!input) invalid(errorPath);
  const result = await createPracticeScenario(input, { id: staff.id, role: staff.role });
  resultRedirect(result, result.ok ? `/admin/practice/scenarios/${result.id}` : errorPath, errorPath, "created");
}

export async function updatePracticeScenarioAction(formData: FormData) {
  const staff = await requirePracticeStaffUser();
  const scenarioId = valueString(formData, "scenarioId", 40);
  const input = practiceScenarioInput(formData);
  if (!isUuid(scenarioId) || !input) invalid(isUuid(scenarioId) ? `/admin/practice/scenarios/${scenarioId}` : "/admin/practice");
  const result = await updatePracticeScenario(scenarioId, input, { id: staff.id, role: staff.role });
  resultRedirect(result, `/admin/practice/scenarios/${scenarioId}`, `/admin/practice/scenarios/${scenarioId}`);
}

export async function deletePracticeScenarioAction(formData: FormData) {
  const staff = await requirePracticeStaffUser();
  const scenarioId = valueString(formData, "scenarioId", 40);
  const industryId = valueString(formData, "industryId", 40);
  if (!isUuid(scenarioId) || !isUuid(industryId) || !confirmedDelete(formData)) invalid(isUuid(scenarioId) ? `/admin/practice/scenarios/${scenarioId}` : "/admin/practice");
  const result = await deletePracticeScenario(scenarioId, { id: staff.id, role: staff.role });
  resultRedirect(result, `/admin/practice/industries/${industryId}`, `/admin/practice/scenarios/${scenarioId}`, "deleted");
}

export async function createPracticeExerciseAction(formData: FormData) {
  const staff = await requirePracticeStaffUser();
  const input = practiceExerciseInput(formData);
  const errorPath = input?.scenarioId ? `/admin/practice/scenarios/${input.scenarioId}` : "/admin/practice";
  if (!input) invalid(errorPath);
  const result = await createPracticeExercise(input, { id: staff.id, role: staff.role });
  resultRedirect(result, errorPath, errorPath, "created");
}

export async function updatePracticeExerciseAction(formData: FormData) {
  const staff = await requirePracticeStaffUser();
  const exerciseId = valueString(formData, "exerciseId", 40);
  const input = practiceExerciseInput(formData);
  const errorPath = input?.scenarioId ? `/admin/practice/scenarios/${input.scenarioId}` : "/admin/practice";
  if (!isUuid(exerciseId) || !input) invalid(errorPath);
  const result = await updatePracticeExercise(exerciseId, input, { id: staff.id, role: staff.role });
  resultRedirect(result, errorPath, errorPath);
}

export async function deletePracticeExerciseAction(formData: FormData) {
  const staff = await requirePracticeStaffUser();
  const exerciseId = valueString(formData, "exerciseId", 40);
  const scenarioId = valueString(formData, "scenarioId", 40);
  if (!isUuid(exerciseId) || !isUuid(scenarioId) || !confirmedDelete(formData)) invalid(isUuid(scenarioId) ? `/admin/practice/scenarios/${scenarioId}` : "/admin/practice");
  const result = await deletePracticeExercise(exerciseId, { id: staff.id, role: staff.role });
  resultRedirect(result, `/admin/practice/scenarios/${scenarioId}`, `/admin/practice/scenarios/${scenarioId}`, "deleted");
}

export async function reviewPracticeExerciseAudioAction(formData: FormData) {
  const staff = await requirePracticeStaffUser();
  const scenarioId = valueString(formData, "scenarioId", 40);
  const exerciseId = valueString(formData, "exerciseId", 40);
  const audioAssetId = valueString(formData, "audioAssetId", 40);
  const status = parsePracticeAudioReviewStatus(valueString(formData, "audioReviewStatus", 20));
  const issues = parsePracticeAudioReviewIssues(formData.getAll("audioReviewIssues").filter((value): value is string => typeof value === "string"));
  const notes = valueString(formData, "audioReviewNotes", 1_000);
  const returnPath = isUuid(scenarioId) ? `/admin/practice/scenarios/${scenarioId}` : "/admin/practice";
  if (!isUuid(scenarioId) || !isUuid(exerciseId) || !isUuid(audioAssetId) || !status || status === "pending") invalid(returnPath);
  const result = await reviewPracticeExerciseAudio({ exerciseId, audioAssetId, status, issues, notes }, { id: staff.id, role: staff.role });
  resultRedirect(result, returnPath, returnPath, "audio_reviewed");
}

function practiceReviewReturnPath(formData: FormData, scenarioId: string): string {
  return valueString(formData, "returnPath", 20) === "queue"
    ? "/admin/practice"
    : `/admin/practice/scenarios/${scenarioId}`;
}

export async function assignPracticeReviewAction(formData: FormData) {
  const admin = await requireAdminUser();
  const scenarioId = valueString(formData, "scenarioId", 40);
  const reviewerIdValue = valueString(formData, "reviewerId", 40);
  const priority = parsePracticeReviewPriority(valueString(formData, "reviewPriority", 16));
  const dueDateValue = valueString(formData, "reviewDueDate", 10);
  const dueAt = dueDateValue ? parsePracticeReviewDueDate(dueDateValue) : null;
  const returnPath = isUuid(scenarioId) ? practiceReviewReturnPath(formData, scenarioId) : "/admin/practice";
  if (!isUuid(scenarioId) || (reviewerIdValue && !isUuid(reviewerIdValue)) || !priority || (dueDateValue && !dueAt)) invalid(returnPath);
  const result = await updatePracticeReviewAssignment({
    scenarioId,
    reviewerId: reviewerIdValue || null,
    priority,
    dueAt,
  }, { id: admin.id, role: "admin" });
  resultRedirect(result, returnPath, returnPath, "review_assigned");
}

export async function claimPracticeReviewAction(formData: FormData) {
  const staff = await requirePracticeStaffUser();
  const scenarioId = valueString(formData, "scenarioId", 40);
  const returnPath = isUuid(scenarioId) ? practiceReviewReturnPath(formData, scenarioId) : "/admin/practice";
  if (!isUuid(scenarioId)) invalid(returnPath);
  const result = await claimPracticeReview(scenarioId, { id: staff.id, role: staff.role });
  resultRedirect(result, returnPath, returnPath, "review_claimed");
}

export async function releasePracticeReviewAction(formData: FormData) {
  const staff = await requirePracticeStaffUser();
  const scenarioId = valueString(formData, "scenarioId", 40);
  const returnPath = isUuid(scenarioId) ? practiceReviewReturnPath(formData, scenarioId) : "/admin/practice";
  if (!isUuid(scenarioId)) invalid(returnPath);
  const result = await releasePracticeReview(scenarioId, { id: staff.id, role: staff.role });
  resultRedirect(result, returnPath, returnPath, "review_released");
}

export async function transitionPracticeScenarioAction(formData: FormData) {
  const staff = await requirePracticeStaffUser();
  const scenarioId = valueString(formData, "scenarioId", 40);
  const targetValue = valueString(formData, "targetStatus", 20);
  const targetStatus = (["draft", "review", "published", "archived"] as const).find((status) => status === targetValue);
  const changeNote = valueString(formData, "changeNote", 500);
  if (!isUuid(scenarioId) || !targetStatus || !changeNote) invalid(isUuid(scenarioId) ? `/admin/practice/scenarios/${scenarioId}` : "/admin/practice");
  const result = await transitionPracticeScenarioStatus(
    scenarioId,
    targetStatus,
    changeNote,
    { id: staff.id, role: staff.role },
  );
  resultRedirect(result, `/admin/practice/scenarios/${scenarioId}`, `/admin/practice/scenarios/${scenarioId}`, "transitioned");
}

export async function restorePracticeScenarioVersionAction(formData: FormData) {
  const staff = await requirePracticeStaffUser();
  const scenarioId = valueString(formData, "scenarioId", 40);
  const versionId = valueString(formData, "versionId", 40);
  const changeNote = valueString(formData, "changeNote", 500);
  if (!isUuid(scenarioId) || !isUuid(versionId) || !changeNote || !confirmedDelete(formData)) {
    invalid(isUuid(scenarioId) ? `/admin/practice/scenarios/${scenarioId}` : "/admin/practice");
  }
  const result = await restorePracticeScenarioVersion(
    scenarioId,
    versionId,
    changeNote,
    { id: staff.id, role: staff.role },
  );
  resultRedirect(result, `/admin/practice/scenarios/${scenarioId}`, `/admin/practice/scenarios/${scenarioId}`, "version_restored");
}
