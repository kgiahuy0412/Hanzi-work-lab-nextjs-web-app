import "server-only";

import { and, asc, count, desc, eq, inArray, isNotNull, isNull, max, ne, or, sql } from "drizzle-orm";
import { readDb, writeDb, type Database } from "../db/index.ts";
import {
  auditLogs,
  practiceAttempts,
  practiceAudioAssets,
  practiceExercises,
  practiceIndustries,
  practiceScenarios,
  practiceScenarioVersions,
  users,
} from "../db/schema.ts";
import { isUuid, type ContentStatus } from "./admin-content-validation.ts";
import type { MutationResult } from "./admin-content-service.ts";
import {
  assessPracticeReadiness,
  canAuthorPractice,
  canEditPracticeScenario,
  canTransitionAssignedPracticeScenario,
  canTransitionPracticeScenario,
  type PracticeWorkflowActor,
} from "./practice-workflow.ts";
import {
  canClaimPracticeReview,
  canSeePracticeReviewTask,
  type PracticeReviewPriority,
} from "./practice-review-queue.ts";
import { parsePracticeScenarioSnapshot, preparePracticeVersionRestore } from "./practice-version.ts";
import {
  canReviewPracticeAudio,
  type PracticeAudioReviewIssue,
  type PracticeAudioReviewStatus,
} from "./practice-audio-review.ts";
import { deleteCloudinaryPracticeAudio, type CloudinaryPracticeAudio } from "./cloudinary-practice-audio.ts";

type DbTransaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

export type PracticeIndustryInput = {
  slug: string;
  label: string;
  description: string;
  imageUrl: string;
  status: ContentStatus;
  sortOrder: number;
};

export type PracticeScenarioInput = {
  industryId: string;
  slug: string;
  title: string;
  brief: string;
  context: string;
  durationMinutes: number;
  level: string;
  isFree: boolean;
  sentenceZh: string;
  pinyin: string;
  translation: string;
  focus: string[];
  status: ContentStatus;
  sortOrder: number;
  changeNote: string;
};

export type PracticeExerciseInput = {
  scenarioId: string;
  audioAssetId: string | null;
  slug: string;
  eyebrow: string;
  prompt: string;
  chinese: string;
  listeningText: string;
  isStatementCorrect: boolean;
  audioUrl: string;
  options: string[];
  correctOption: number;
  explanation: string;
  sortOrder: number;
  changeNote: string;
};

export type PracticeReviewAssignmentInput = {
  scenarioId: string;
  reviewerId: string | null;
  priority: PracticeReviewPriority;
  dueAt: Date | null;
};

export async function getPracticeReviewDashboard(actor: PracticeWorkflowActor) {
  return readDb(async (db) => {
    const visibleReviewCondition = actor.role === "reviewer"
      ? and(
        eq(practiceScenarios.status, "review"),
        or(isNull(practiceScenarios.reviewerId), eq(practiceScenarios.reviewerId, actor.id)),
      )
      : eq(practiceScenarios.status, "review");
    const [scenarioRows, assigneeRows] = await Promise.all([
      db.select({
        id: practiceScenarios.id,
        slug: practiceScenarios.slug,
        title: practiceScenarios.title,
        brief: practiceScenarios.brief,
        isFree: practiceScenarios.isFree,
        industryLabel: practiceIndustries.label,
        industrySlug: practiceIndustries.slug,
        reviewerId: practiceScenarios.reviewerId,
        reviewerName: users.displayName,
        reviewerEmail: users.email,
        reviewPriority: practiceScenarios.reviewPriority,
        reviewDueAt: practiceScenarios.reviewDueAt,
        reviewRequestedAt: practiceScenarios.reviewRequestedAt,
        updatedAt: practiceScenarios.updatedAt,
      }).from(practiceScenarios)
        .innerJoin(practiceIndustries, eq(practiceScenarios.industryId, practiceIndustries.id))
        .leftJoin(users, eq(practiceScenarios.reviewerId, users.id))
        .where(visibleReviewCondition)
        .orderBy(
          sql`case ${practiceScenarios.reviewPriority} when 'urgent' then 0 when 'high' then 1 else 2 end`,
          asc(practiceScenarios.reviewDueAt),
          asc(practiceScenarios.reviewRequestedAt),
          asc(practiceScenarios.title),
        ),
      db.select({ id: users.id, displayName: users.displayName, email: users.email, role: users.role })
        .from(users)
        .where(and(
          eq(users.isActive, true),
          isNotNull(users.emailVerifiedAt),
          or(eq(users.role, "reviewer"), eq(users.role, "admin")),
        ))
        .orderBy(asc(users.role), asc(users.displayName), asc(users.email)),
    ]);
    const scenarioIds = scenarioRows.map((scenario) => scenario.id);
    const exerciseRows = scenarioIds.length ? await db.select({
      scenarioId: practiceExercises.scenarioId,
      listeningText: practiceExercises.listeningText,
      audioAssetId: practiceExercises.audioAssetId,
      audioUrl: practiceExercises.audioUrl,
      audioReviewStatus: practiceExercises.audioReviewStatus,
      options: practiceExercises.options,
      correctOption: practiceExercises.correctOption,
      isStatementCorrect: practiceExercises.isStatementCorrect,
    }).from(practiceExercises).where(inArray(practiceExercises.scenarioId, scenarioIds)) : [];
    const exercisesByScenario = new Map<string, typeof exerciseRows>();
    for (const exercise of exerciseRows) {
      const items = exercisesByScenario.get(exercise.scenarioId) ?? [];
      items.push(exercise);
      exercisesByScenario.set(exercise.scenarioId, items);
    }
    return {
      assignees: assigneeRows,
      items: scenarioRows
        .filter((scenario) => canSeePracticeReviewTask(actor.role, actor.id, scenario.reviewerId))
        .map((scenario) => ({
          ...scenario,
          readiness: assessPracticeReadiness(exercisesByScenario.get(scenario.id) ?? []),
        })),
    };
  });
}

export async function listAdminPracticeIndustries() {
  return readDb(async (db) => {
    const [industries, scenarioCounts] = await Promise.all([
      db.select({
        id: practiceIndustries.id,
        slug: practiceIndustries.slug,
        label: practiceIndustries.label,
        description: practiceIndustries.description,
        imageUrl: practiceIndustries.imageUrl,
        status: practiceIndustries.status,
        sortOrder: practiceIndustries.sortOrder,
        updatedAt: practiceIndustries.updatedAt,
      }).from(practiceIndustries).orderBy(asc(practiceIndustries.sortOrder), asc(practiceIndustries.label)),
      db.select({
        industryId: practiceScenarios.industryId,
        scenarioCount: sql<number>`count(*)::int`,
        publishedCount: sql<number>`count(*) filter (where ${practiceScenarios.status} = 'published')::int`,
      }).from(practiceScenarios).groupBy(practiceScenarios.industryId),
    ]);
    const countByIndustry = new Map(scenarioCounts.map((item) => [item.industryId, item]));
    return industries.map((industry) => ({
      ...industry,
      scenarioCount: countByIndustry.get(industry.id)?.scenarioCount ?? 0,
      publishedCount: countByIndustry.get(industry.id)?.publishedCount ?? 0,
    }));
  });
}

export async function getAdminPracticeIndustry(industryId: string) {
  return readDb(async (db) => {
    const [industryRows, scenarioRows] = await Promise.all([
      db.select().from(practiceIndustries).where(eq(practiceIndustries.id, industryId)).limit(1),
      db.select({
        id: practiceScenarios.id,
        slug: practiceScenarios.slug,
        title: practiceScenarios.title,
        brief: practiceScenarios.brief,
        durationMinutes: practiceScenarios.durationMinutes,
        level: practiceScenarios.level,
        isFree: practiceScenarios.isFree,
        status: practiceScenarios.status,
        reviewerId: practiceScenarios.reviewerId,
        reviewerName: users.displayName,
        reviewerEmail: users.email,
        reviewPriority: practiceScenarios.reviewPriority,
        reviewDueAt: practiceScenarios.reviewDueAt,
        sortOrder: practiceScenarios.sortOrder,
        exerciseCount: sql<number>`(select count(*)::int from ${practiceExercises} where ${practiceExercises.scenarioId} = ${practiceScenarios.id})`,
        attemptCount: sql<number>`(select count(*)::int from ${practiceAttempts} where ${practiceAttempts.scenarioId} = ${practiceScenarios.slug})`,
      }).from(practiceScenarios)
        .leftJoin(users, eq(practiceScenarios.reviewerId, users.id))
        .where(eq(practiceScenarios.industryId, industryId))
        .orderBy(asc(practiceScenarios.sortOrder), asc(practiceScenarios.title)),
    ]);
    return industryRows[0] ? { industry: industryRows[0], scenarios: scenarioRows } : null;
  });
}

export async function getAdminPracticeScenario(scenarioId: string) {
  return readDb(async (db) => {
    const [scenarioRows, industryRows, exerciseRows, versionRows, versionCountRows, assigneeRows] = await Promise.all([
      db.select({
        id: practiceScenarios.id,
        industryId: practiceScenarios.industryId,
        reviewerId: practiceScenarios.reviewerId,
        slug: practiceScenarios.slug,
        title: practiceScenarios.title,
        brief: practiceScenarios.brief,
        context: practiceScenarios.context,
        durationMinutes: practiceScenarios.durationMinutes,
        level: practiceScenarios.level,
        isFree: practiceScenarios.isFree,
        sentenceZh: practiceScenarios.sentenceZh,
        pinyin: practiceScenarios.pinyin,
        translation: practiceScenarios.translation,
        focus: practiceScenarios.focus,
        status: practiceScenarios.status,
        reviewPriority: practiceScenarios.reviewPriority,
        reviewDueAt: practiceScenarios.reviewDueAt,
        reviewRequestedAt: practiceScenarios.reviewRequestedAt,
        reviewerName: users.displayName,
        reviewerEmail: users.email,
        sortOrder: practiceScenarios.sortOrder,
        updatedAt: practiceScenarios.updatedAt,
        industryLabel: practiceIndustries.label,
        industrySlug: practiceIndustries.slug,
        industryStatus: practiceIndustries.status,
        attemptCount: sql<number>`(select count(*)::int from ${practiceAttempts} where ${practiceAttempts.scenarioId} = ${practiceScenarios.slug})`,
      }).from(practiceScenarios)
        .innerJoin(practiceIndustries, eq(practiceScenarios.industryId, practiceIndustries.id))
        .leftJoin(users, eq(practiceScenarios.reviewerId, users.id))
        .where(eq(practiceScenarios.id, scenarioId)).limit(1),
      db.select({ id: practiceIndustries.id, label: practiceIndustries.label, slug: practiceIndustries.slug })
        .from(practiceIndustries).where(ne(practiceIndustries.status, "archived"))
        .orderBy(asc(practiceIndustries.sortOrder), asc(practiceIndustries.label)),
      db.select({
        id: practiceExercises.id,
        scenarioId: practiceExercises.scenarioId,
        audioAssetId: practiceExercises.audioAssetId,
        slug: practiceExercises.slug,
        eyebrow: practiceExercises.eyebrow,
        prompt: practiceExercises.prompt,
        chinese: practiceExercises.chinese,
        listeningText: practiceExercises.listeningText,
        isStatementCorrect: practiceExercises.isStatementCorrect,
        audioUrl: practiceExercises.audioUrl,
        audioReviewStatus: practiceExercises.audioReviewStatus,
        audioReviewIssues: practiceExercises.audioReviewIssues,
        audioReviewNotes: practiceExercises.audioReviewNotes,
        audioReviewedBy: practiceExercises.audioReviewedBy,
        audioReviewedAt: practiceExercises.audioReviewedAt,
        options: practiceExercises.options,
        correctOption: practiceExercises.correctOption,
        explanation: practiceExercises.explanation,
        sortOrder: practiceExercises.sortOrder,
        createdAt: practiceExercises.createdAt,
        updatedAt: practiceExercises.updatedAt,
        audioOriginalName: practiceAudioAssets.originalName,
        audioMimeType: practiceAudioAssets.mimeType,
        audioSizeBytes: practiceAudioAssets.sizeBytes,
        audioDurationMs: practiceAudioAssets.durationMs,
        audioStorageProvider: practiceAudioAssets.storageProvider,
      }).from(practiceExercises)
        .leftJoin(practiceAudioAssets, eq(practiceExercises.audioAssetId, practiceAudioAssets.id))
        .where(eq(practiceExercises.scenarioId, scenarioId))
        .orderBy(asc(practiceExercises.sortOrder), asc(practiceExercises.slug)),
      db.select({
        id: practiceScenarioVersions.id,
        version: practiceScenarioVersions.version,
        snapshot: practiceScenarioVersions.snapshot,
        changeNote: practiceScenarioVersions.changeNote,
        createdBy: practiceScenarioVersions.createdBy,
        creatorName: users.displayName,
        creatorEmail: users.email,
        creatorRole: users.role,
        createdAt: practiceScenarioVersions.createdAt,
      }).from(practiceScenarioVersions)
        .innerJoin(users, eq(practiceScenarioVersions.createdBy, users.id))
        .where(eq(practiceScenarioVersions.scenarioId, scenarioId))
        .orderBy(desc(practiceScenarioVersions.version)).limit(30),
      db.select({ value: count() }).from(practiceScenarioVersions)
        .where(eq(practiceScenarioVersions.scenarioId, scenarioId)),
      db.select({ id: users.id, displayName: users.displayName, email: users.email, role: users.role })
        .from(users)
        .where(and(
          eq(users.isActive, true),
          isNotNull(users.emailVerifiedAt),
          or(eq(users.role, "reviewer"), eq(users.role, "admin")),
        ))
        .orderBy(asc(users.role), asc(users.displayName), asc(users.email)),
    ]);
    return scenarioRows[0] ? {
      scenario: scenarioRows[0],
      industries: industryRows,
      exercises: exerciseRows,
      versions: versionRows.map((version) => ({ ...version, snapshot: parsePracticeScenarioSnapshot(version.snapshot) })),
      versionCount: versionCountRows[0]?.value ?? 0,
      assignees: assigneeRows,
      readiness: assessPracticeReadiness(exerciseRows, { industryPublished: scenarioRows[0].industryStatus === "published" }),
    } : null;
  });
}

async function snapshotScenario(tx: DbTransaction, scenarioId: string) {
  const [scenarioRows, exerciseRows] = await Promise.all([
    tx.select().from(practiceScenarios).where(eq(practiceScenarios.id, scenarioId)).limit(1),
    tx.select().from(practiceExercises).where(eq(practiceExercises.scenarioId, scenarioId))
      .orderBy(asc(practiceExercises.sortOrder), asc(practiceExercises.slug)),
  ]);
  return { scenario: scenarioRows[0] ?? null, exercises: exerciseRows };
}

async function createScenarioVersion(tx: DbTransaction, scenarioId: string, actorId: string, changeNote: string) {
  const [versionRows, snapshot] = await Promise.all([
    tx.select({ value: max(practiceScenarioVersions.version) }).from(practiceScenarioVersions)
      .where(eq(practiceScenarioVersions.scenarioId, scenarioId)),
    snapshotScenario(tx, scenarioId),
  ]);
  const version = (versionRows[0]?.value ?? 0) + 1;
  await tx.insert(practiceScenarioVersions).values({
    scenarioId,
    version,
    snapshot,
    changeNote,
    createdBy: actorId,
  });
  return version;
}

async function deleteAudioAssetWhenUnused(tx: DbTransaction, assetId: string | null): Promise<string | null> {
  if (!assetId) return null;
  const [exerciseReferences, versionReferences] = await Promise.all([
    tx.select({ value: count() }).from(practiceExercises)
      .where(eq(practiceExercises.audioAssetId, assetId)),
    tx.select({ value: count() }).from(practiceScenarioVersions)
      .where(sql`${practiceScenarioVersions.snapshot}::text like ${`%${assetId}%`}`),
  ]);
  if ((exerciseReferences[0]?.value ?? 0) === 0 && (versionReferences[0]?.value ?? 0) === 0) {
    const assetRows = await tx.select({ cloudinaryPublicId: practiceAudioAssets.cloudinaryPublicId })
      .from(practiceAudioAssets).where(eq(practiceAudioAssets.id, assetId)).limit(1);
    await tx.delete(practiceAudioAssets).where(eq(practiceAudioAssets.id, assetId));
    return assetRows[0]?.cloudinaryPublicId ?? null;
  }
  return null;
}

async function cleanupCloudinaryAssets(publicIds: Array<string | null | undefined>): Promise<void> {
  await Promise.allSettled(Array.from(new Set(publicIds.filter((value): value is string => Boolean(value))))
    .map((publicId) => deleteCloudinaryPracticeAudio(publicId)));
}

export async function createPracticeIndustry(input: PracticeIndustryInput, actorId: string): Promise<MutationResult> {
  return writeDb((db) => db.transaction(async (tx) => {
    const rows = await tx.insert(practiceIndustries).values({
      ...input,
      imageUrl: input.imageUrl || null,
    }).onConflictDoNothing({ target: practiceIndustries.slug }).returning({ id: practiceIndustries.id });
    if (!rows[0]) return { ok: false, error: "duplicate_slug" };
    await tx.insert(auditLogs).values({
      actorId,
      action: "admin.practice_industry.created",
      entityType: "practice_industry",
      entityId: rows[0].id,
      metadata: { slug: input.slug, status: input.status },
    });
    return { ok: true, id: rows[0].id };
  }));
}

export async function updatePracticeIndustry(industryId: string, input: PracticeIndustryInput, actorId: string): Promise<MutationResult> {
  return writeDb((db) => db.transaction(async (tx) => {
    const [existingRows, collision] = await Promise.all([
      tx.select({ id: practiceIndustries.id, slug: practiceIndustries.slug, status: practiceIndustries.status }).from(practiceIndustries)
        .where(eq(practiceIndustries.id, industryId)).limit(1),
      tx.select({ id: practiceIndustries.id }).from(practiceIndustries)
        .where(and(eq(practiceIndustries.slug, input.slug), ne(practiceIndustries.id, industryId))).limit(1),
    ]);
    if (!existingRows[0]) return { ok: false, error: "not_found" };
    if (collision[0]) return { ok: false, error: "duplicate_slug" };
    await tx.update(practiceIndustries).set({
      ...input,
      imageUrl: input.imageUrl || null,
      updatedAt: new Date(),
    }).where(eq(practiceIndustries.id, industryId));
    if (existingRows[0].slug !== input.slug) {
      await tx.update(practiceAttempts).set({ industry: input.slug })
        .where(eq(practiceAttempts.industry, existingRows[0].slug));
    }
    await tx.insert(auditLogs).values({
      actorId,
      action: "admin.practice_industry.updated",
      entityType: "practice_industry",
      entityId: industryId,
      metadata: { slug: input.slug, fromStatus: existingRows[0].status, toStatus: input.status },
    });
    return { ok: true, id: industryId };
  }));
}

export async function deletePracticeIndustry(industryId: string, actorId: string): Promise<MutationResult> {
  return writeDb((db) => db.transaction(async (tx) => {
    const [industryRows, scenarioCountRows] = await Promise.all([
      tx.select({ slug: practiceIndustries.slug, status: practiceIndustries.status }).from(practiceIndustries)
        .where(eq(practiceIndustries.id, industryId)).limit(1),
      tx.select({ value: count() }).from(practiceScenarios).where(eq(practiceScenarios.industryId, industryId)),
    ]);
    const industry = industryRows[0];
    if (!industry) return { ok: false, error: "not_found" };
    if (!(["draft", "review"] as ContentStatus[]).includes(industry.status) || (scenarioCountRows[0]?.value ?? 0) > 0) {
      return { ok: false, error: "unsafe_delete" };
    }
    await tx.delete(practiceIndustries).where(eq(practiceIndustries.id, industryId));
    await tx.insert(auditLogs).values({
      actorId,
      action: "admin.practice_industry.deleted",
      entityType: "practice_industry",
      metadata: { deletedId: industryId, slug: industry.slug },
    });
    return { ok: true, id: industryId };
  }));
}

export async function createPracticeScenario(input: PracticeScenarioInput, actor: PracticeWorkflowActor): Promise<MutationResult> {
  return writeDb((db) => db.transaction(async (tx) => {
    const { changeNote, ...values } = input;
    if (!canAuthorPractice(actor.role)) return { ok: false, error: "workflow_forbidden" };
    const parent = await tx.select({ id: practiceIndustries.id }).from(practiceIndustries)
      .where(eq(practiceIndustries.id, input.industryId)).limit(1);
    if (!parent[0]) return { ok: false, error: "invalid_parent" };
    const rows = await tx.insert(practiceScenarios).values({
      ...values,
      status: "draft",
      publishedAt: null,
    }).onConflictDoNothing({ target: practiceScenarios.slug }).returning({ id: practiceScenarios.id });
    if (!rows[0]) return { ok: false, error: "duplicate_slug" };
    const version = await createScenarioVersion(tx, rows[0].id, actor.id, changeNote || "Tạo ca luyện mới");
    await tx.insert(auditLogs).values({
      actorId: actor.id,
      action: "admin.practice_scenario.created",
      entityType: "practice_scenario",
      entityId: rows[0].id,
      metadata: { industryId: input.industryId, slug: input.slug, status: "draft", version, role: actor.role },
    });
    return { ok: true, id: rows[0].id };
  }));
}

export async function updatePracticeScenario(scenarioId: string, input: PracticeScenarioInput, actor: PracticeWorkflowActor): Promise<MutationResult> {
  return writeDb((db) => db.transaction(async (tx) => {
    const { changeNote, ...values } = input;
    const [existingRows, parentRows, collision] = await Promise.all([
      tx.select({ id: practiceScenarios.id, slug: practiceScenarios.slug, status: practiceScenarios.status, publishedAt: practiceScenarios.publishedAt, industryStatus: practiceIndustries.status })
        .from(practiceScenarios).innerJoin(practiceIndustries, eq(practiceScenarios.industryId, practiceIndustries.id))
        .where(eq(practiceScenarios.id, scenarioId)).limit(1),
      tx.select({ id: practiceIndustries.id, slug: practiceIndustries.slug }).from(practiceIndustries).where(eq(practiceIndustries.id, input.industryId)).limit(1),
      tx.select({ id: practiceScenarios.id }).from(practiceScenarios)
        .where(and(eq(practiceScenarios.slug, input.slug), ne(practiceScenarios.id, scenarioId))).limit(1),
    ]);
    const existing = existingRows[0];
    if (!existing) return { ok: false, error: "not_found" };
    if (!canEditPracticeScenario(actor.role, existing.status)) return { ok: false, error: "workflow_forbidden" };
    if (!parentRows[0]) return { ok: false, error: "invalid_parent" };
    if (collision[0]) return { ok: false, error: "duplicate_slug" };
    await tx.update(practiceScenarios).set({
      ...values,
      status: existing.status,
      publishedAt: existing.publishedAt,
      updatedAt: new Date(),
    }).where(eq(practiceScenarios.id, scenarioId));
    await tx.update(practiceAttempts).set({ scenarioId: input.slug, industry: parentRows[0].slug })
      .where(eq(practiceAttempts.scenarioId, existing.slug));
    const version = await createScenarioVersion(tx, scenarioId, actor.id, changeNote || "Cập nhật ca luyện");
    await tx.insert(auditLogs).values({
      actorId: actor.id,
      action: "admin.practice_scenario.updated",
      entityType: "practice_scenario",
      entityId: scenarioId,
      metadata: { slug: input.slug, status: existing.status, version, role: actor.role },
    });
    return { ok: true, id: scenarioId };
  }));
}

export async function updatePracticeReviewAssignment(
  input: PracticeReviewAssignmentInput,
  actor: PracticeWorkflowActor,
): Promise<MutationResult> {
  return writeDb((db) => db.transaction(async (tx) => {
    if (actor.role !== "admin") return { ok: false, error: "review_assignment_forbidden" };
    const scenarioRows = await tx.select({
      id: practiceScenarios.id,
      slug: practiceScenarios.slug,
      status: practiceScenarios.status,
      reviewerId: practiceScenarios.reviewerId,
      reviewPriority: practiceScenarios.reviewPriority,
      reviewDueAt: practiceScenarios.reviewDueAt,
    }).from(practiceScenarios).where(eq(practiceScenarios.id, input.scenarioId)).limit(1);
    const scenario = scenarioRows[0];
    if (!scenario) return { ok: false, error: "not_found" };
    if (scenario.status !== "review") return { ok: false, error: "invalid_transition" };

    if (input.reviewerId) {
      const reviewerRows = await tx.select({
        id: users.id,
        role: users.role,
        isActive: users.isActive,
        emailVerifiedAt: users.emailVerifiedAt,
      }).from(users).where(eq(users.id, input.reviewerId)).limit(1);
      const reviewer = reviewerRows[0];
      if (!reviewer || !reviewer.isActive || !reviewer.emailVerifiedAt || (reviewer.role !== "reviewer" && reviewer.role !== "admin")) {
        return { ok: false, error: "invalid_reviewer" };
      }
    }

    const reviewerId = input.reviewerId || null;
    const reviewPriority = reviewerId ? input.priority : "normal";
    const reviewDueAt = reviewerId ? input.dueAt : null;
    await tx.update(practiceScenarios).set({ reviewerId, reviewPriority, reviewDueAt, updatedAt: new Date() })
      .where(eq(practiceScenarios.id, input.scenarioId));
    await tx.insert(auditLogs).values({
      actorId: actor.id,
      action: "admin.practice_scenario.review_assigned",
      entityType: "practice_scenario",
      entityId: input.scenarioId,
      metadata: {
        slug: scenario.slug,
        fromReviewerId: scenario.reviewerId,
        toReviewerId: reviewerId,
        fromPriority: scenario.reviewPriority,
        toPriority: reviewPriority,
        fromDueAt: scenario.reviewDueAt,
        toDueAt: reviewDueAt,
      },
    });
    return { ok: true, id: input.scenarioId };
  }));
}

export async function claimPracticeReview(scenarioId: string, actor: PracticeWorkflowActor): Promise<MutationResult> {
  return writeDb((db) => db.transaction(async (tx) => {
    const scenarioRows = await tx.select({
      id: practiceScenarios.id,
      slug: practiceScenarios.slug,
      status: practiceScenarios.status,
      reviewerId: practiceScenarios.reviewerId,
    }).from(practiceScenarios).where(eq(practiceScenarios.id, scenarioId)).limit(1);
    const scenario = scenarioRows[0];
    if (!scenario) return { ok: false, error: "not_found" };
    if (scenario.status !== "review") return { ok: false, error: "invalid_transition" };
    if (!canClaimPracticeReview(actor.role, actor.id, scenario.reviewerId)) {
      return { ok: false, error: "review_assignment_forbidden" };
    }
    if (scenario.reviewerId === actor.id) return { ok: true, id: scenarioId };

    const updatedRows = await tx.update(practiceScenarios).set({ reviewerId: actor.id, updatedAt: new Date() })
      .where(and(eq(practiceScenarios.id, scenarioId), isNull(practiceScenarios.reviewerId)))
      .returning({ id: practiceScenarios.id });
    if (!updatedRows[0]) return { ok: false, error: "review_assignment_forbidden" };
    await tx.insert(auditLogs).values({
      actorId: actor.id,
      action: "admin.practice_scenario.review_claimed",
      entityType: "practice_scenario",
      entityId: scenarioId,
      metadata: { slug: scenario.slug, reviewerId: actor.id },
    });
    return { ok: true, id: scenarioId };
  }));
}

export async function releasePracticeReview(scenarioId: string, actor: PracticeWorkflowActor): Promise<MutationResult> {
  return writeDb((db) => db.transaction(async (tx) => {
    const scenarioRows = await tx.select({
      id: practiceScenarios.id,
      slug: practiceScenarios.slug,
      status: practiceScenarios.status,
      reviewerId: practiceScenarios.reviewerId,
    }).from(practiceScenarios).where(eq(practiceScenarios.id, scenarioId)).limit(1);
    const scenario = scenarioRows[0];
    if (!scenario) return { ok: false, error: "not_found" };
    if (scenario.status !== "review") return { ok: false, error: "invalid_transition" };
    if (!scenario.reviewerId || (actor.role !== "admin" && scenario.reviewerId !== actor.id)) {
      return { ok: false, error: "review_assignment_forbidden" };
    }
    await tx.update(practiceScenarios).set({
      reviewerId: null,
      reviewPriority: "normal",
      reviewDueAt: null,
      updatedAt: new Date(),
    }).where(eq(practiceScenarios.id, scenarioId));
    await tx.insert(auditLogs).values({
      actorId: actor.id,
      action: "admin.practice_scenario.review_released",
      entityType: "practice_scenario",
      entityId: scenarioId,
      metadata: { slug: scenario.slug, releasedReviewerId: scenario.reviewerId, role: actor.role },
    });
    return { ok: true, id: scenarioId };
  }));
}

export async function transitionPracticeScenarioStatus(
  scenarioId: string,
  targetStatus: ContentStatus,
  changeNote: string,
  actor: PracticeWorkflowActor,
): Promise<MutationResult> {
  return writeDb((db) => db.transaction(async (tx) => {
    const [scenarioRows, exerciseRows] = await Promise.all([
      tx.select({
        id: practiceScenarios.id,
        slug: practiceScenarios.slug,
        status: practiceScenarios.status,
        publishedAt: practiceScenarios.publishedAt,
        reviewerId: practiceScenarios.reviewerId,
        reviewPriority: practiceScenarios.reviewPriority,
        reviewDueAt: practiceScenarios.reviewDueAt,
        industryStatus: practiceIndustries.status,
      }).from(practiceScenarios)
        .innerJoin(practiceIndustries, eq(practiceScenarios.industryId, practiceIndustries.id))
        .where(eq(practiceScenarios.id, scenarioId)).limit(1),
      tx.select({
        listeningText: practiceExercises.listeningText,
        audioAssetId: practiceExercises.audioAssetId,
        audioUrl: practiceExercises.audioUrl,
        audioReviewStatus: practiceExercises.audioReviewStatus,
        options: practiceExercises.options,
        correctOption: practiceExercises.correctOption,
        isStatementCorrect: practiceExercises.isStatementCorrect,
      }).from(practiceExercises).where(eq(practiceExercises.scenarioId, scenarioId)),
    ]);
    const scenario = scenarioRows[0];
    if (!scenario) return { ok: false, error: "not_found" };
    if (!canTransitionPracticeScenario(actor.role, scenario.status, targetStatus)) {
      return { ok: false, error: "invalid_transition" };
    }
    if (!canTransitionAssignedPracticeScenario(actor, scenario.reviewerId, scenario.status, targetStatus)) {
      return { ok: false, error: "review_assignment_required" };
    }
    const readiness = assessPracticeReadiness(exerciseRows, { industryPublished: scenario.industryStatus === "published" });
    if (targetStatus === "published" && !readiness.ready) return { ok: false, error: "review_not_ready" };

    const now = new Date();
    await tx.update(practiceScenarios).set({
      status: targetStatus,
      publishedAt: targetStatus === "published" ? scenario.publishedAt ?? now : scenario.publishedAt,
      reviewRequestedAt: targetStatus === "review" ? now : undefined,
      reviewDueAt: scenario.status === "review" && targetStatus !== "review" ? null : scenario.reviewDueAt,
      updatedAt: now,
    }).where(eq(practiceScenarios.id, scenarioId));
    const version = await createScenarioVersion(tx, scenarioId, actor.id, changeNote || `Chuyển ${scenario.status} → ${targetStatus}`);
    await tx.insert(auditLogs).values({
      actorId: actor.id,
      action: "admin.practice_scenario.status_changed",
      entityType: "practice_scenario",
      entityId: scenarioId,
      metadata: {
        slug: scenario.slug,
        fromStatus: scenario.status,
        toStatus: targetStatus,
        role: actor.role,
        reviewerId: scenario.reviewerId,
        reviewPriority: scenario.reviewPriority,
        reviewDueAt: scenario.reviewDueAt,
        version,
        readiness: readiness.items,
      },
    });
    return { ok: true, id: scenarioId };
  }));
}

export async function restorePracticeScenarioVersion(
  scenarioId: string,
  versionId: string,
  changeNote: string,
  actor: PracticeWorkflowActor,
): Promise<MutationResult> {
  return writeDb((db) => db.transaction(async (tx) => {
    const [scenarioRows, versionRows, latestVersionRows] = await Promise.all([
      tx.select({ id: practiceScenarios.id, slug: practiceScenarios.slug, status: practiceScenarios.status })
        .from(practiceScenarios).where(eq(practiceScenarios.id, scenarioId)).limit(1),
      tx.select({
        id: practiceScenarioVersions.id,
        version: practiceScenarioVersions.version,
        snapshot: practiceScenarioVersions.snapshot,
      }).from(practiceScenarioVersions).where(and(
        eq(practiceScenarioVersions.id, versionId),
        eq(practiceScenarioVersions.scenarioId, scenarioId),
      )).limit(1),
      tx.select({ value: max(practiceScenarioVersions.version) }).from(practiceScenarioVersions)
        .where(eq(practiceScenarioVersions.scenarioId, scenarioId)),
    ]);
    const scenario = scenarioRows[0];
    const sourceVersion = versionRows[0];
    if (!scenario) return { ok: false, error: "not_found" };
    if (!canEditPracticeScenario(actor.role, scenario.status)) return { ok: false, error: "workflow_forbidden" };
    if (!sourceVersion || sourceVersion.version === latestVersionRows[0]?.value) return { ok: false, error: "invalid_version" };
    const snapshot = parsePracticeScenarioSnapshot(sourceVersion.snapshot);
    if (!snapshot) return { ok: false, error: "invalid_version" };

    const requestedAssetIds = Array.from(new Set(snapshot.exercises
      .map((exercise) => exercise.audioAssetId)
      .filter((assetId): assetId is string => typeof assetId === "string" && isUuid(assetId))));
    const availableAssetRows = requestedAssetIds.length
      ? await tx.select({ id: practiceAudioAssets.id }).from(practiceAudioAssets)
        .where(inArray(practiceAudioAssets.id, requestedAssetIds))
      : [];
    const restore = preparePracticeVersionRestore(snapshot, new Set(availableAssetRows.map((asset) => asset.id)));

    const safetyVersion = await createScenarioVersion(
      tx,
      scenarioId,
      actor.id,
      `Tự động lưu trước khi khôi phục v${sourceVersion.version}`,
    );
    await tx.delete(practiceExercises).where(eq(practiceExercises.scenarioId, scenarioId));
    if (restore.exercises.length) {
      await tx.insert(practiceExercises).values(restore.exercises.map((exercise) => ({ ...exercise, scenarioId })));
    }
    await tx.update(practiceScenarios).set({
      ...restore.scenario,
      status: "draft",
      updatedAt: new Date(),
    }).where(eq(practiceScenarios.id, scenarioId));
    const restoredVersion = await createScenarioVersion(
      tx,
      scenarioId,
      actor.id,
      `Khôi phục từ v${sourceVersion.version}: ${changeNote}`,
    );
    await tx.insert(auditLogs).values({
      actorId: actor.id,
      action: "admin.practice_scenario.version_restored",
      entityType: "practice_scenario",
      entityId: scenarioId,
      metadata: {
        slug: scenario.slug,
        role: actor.role,
        sourceVersion: sourceVersion.version,
        safetyVersion,
        restoredVersion,
        exerciseCount: restore.exercises.length,
        missingAudioAssetIds: restore.missingAudioAssetIds,
      },
    });
    return { ok: true, id: scenarioId };
  }));
}

export async function deletePracticeScenario(scenarioId: string, actor: PracticeWorkflowActor): Promise<MutationResult> {
  return writeDb((db) => db.transaction(async (tx) => {
    const scenarioRows = await tx.select({
      id: practiceScenarios.id,
      slug: practiceScenarios.slug,
      status: practiceScenarios.status,
      industryId: practiceScenarios.industryId,
    }).from(practiceScenarios).where(eq(practiceScenarios.id, scenarioId)).limit(1);
    const scenario = scenarioRows[0];
    if (!scenario) return { ok: false, error: "not_found" };
    if (!canEditPracticeScenario(actor.role, scenario.status)) return { ok: false, error: "workflow_forbidden" };
    const attemptRows = await tx.select({ value: count() }).from(practiceAttempts)
      .where(eq(practiceAttempts.scenarioId, scenario.slug));
    if (!(["draft", "review"] as ContentStatus[]).includes(scenario.status) || (attemptRows[0]?.value ?? 0) > 0) {
      return { ok: false, error: "unsafe_delete" };
    }
    const [assetRows, versionSnapshotRows] = await Promise.all([
      tx.select({ id: practiceExercises.audioAssetId }).from(practiceExercises)
        .where(eq(practiceExercises.scenarioId, scenarioId)),
      tx.select({ snapshot: practiceScenarioVersions.snapshot }).from(practiceScenarioVersions)
        .where(eq(practiceScenarioVersions.scenarioId, scenarioId)),
    ]);
    const historicalAssetIds = versionSnapshotRows.flatMap(({ snapshot }) =>
      parsePracticeScenarioSnapshot(snapshot)?.exercises
        .map((exercise) => exercise.audioAssetId)
        .filter((assetId): assetId is string => Boolean(assetId)) ?? [],
    );
    const allAssetIds = new Set([
      ...assetRows.map((asset) => asset.id).filter((assetId): assetId is string => Boolean(assetId)),
      ...historicalAssetIds,
    ]);
    await tx.delete(practiceScenarios).where(eq(practiceScenarios.id, scenarioId));
    for (const assetId of allAssetIds) await deleteAudioAssetWhenUnused(tx, assetId);
    await tx.insert(auditLogs).values({
      actorId: actor.id,
      action: "admin.practice_scenario.deleted",
      entityType: "practice_scenario",
      metadata: { deletedId: scenarioId, slug: scenario.slug, industryId: scenario.industryId, role: actor.role },
    });
    return { ok: true, id: scenario.industryId };
  }));
}

export async function createPracticeExercise(input: PracticeExerciseInput, actor: PracticeWorkflowActor): Promise<MutationResult> {
  return writeDb((db) => db.transaction(async (tx) => {
    const { changeNote, ...rawValues } = input;
    const values = { ...rawValues, audioUrl: input.audioAssetId ? null : input.audioUrl || null };
    const [parent, asset] = await Promise.all([
      tx.select({ id: practiceScenarios.id, status: practiceScenarios.status }).from(practiceScenarios)
        .where(eq(practiceScenarios.id, input.scenarioId)).limit(1),
      input.audioAssetId
        ? tx.select({ id: practiceAudioAssets.id }).from(practiceAudioAssets)
          .where(eq(practiceAudioAssets.id, input.audioAssetId)).limit(1)
        : Promise.resolve([]),
    ]);
    if (!parent[0] || (input.audioAssetId && !asset[0])) return { ok: false, error: "invalid_parent" };
    if (!canEditPracticeScenario(actor.role, parent[0].status)) return { ok: false, error: "workflow_forbidden" };
    const rows = await tx.insert(practiceExercises).values(values)
      .onConflictDoNothing({ target: [practiceExercises.scenarioId, practiceExercises.slug] })
      .returning({ id: practiceExercises.id });
    if (!rows[0]) return { ok: false, error: "duplicate_slug" };
    const version = await createScenarioVersion(tx, input.scenarioId, actor.id, changeNote || "Thêm lượt nghe");
    await tx.insert(auditLogs).values({
      actorId: actor.id,
      action: "admin.practice_exercise.created",
      entityType: "practice_exercise",
      entityId: rows[0].id,
      metadata: { scenarioId: input.scenarioId, slug: input.slug, version },
    });
    return { ok: true, id: rows[0].id };
  }));
}

export async function updatePracticeExercise(exerciseId: string, input: PracticeExerciseInput, actor: PracticeWorkflowActor): Promise<MutationResult> {
  return writeDb((db) => db.transaction(async (tx) => {
    const { changeNote, ...rawValues } = input;
    const values = { ...rawValues, audioUrl: input.audioAssetId ? null : input.audioUrl || null };
    const [existingRows, collision] = await Promise.all([
      tx.select({
        id: practiceExercises.id,
        scenarioId: practiceExercises.scenarioId,
        audioAssetId: practiceExercises.audioAssetId,
        audioUrl: practiceExercises.audioUrl,
        listeningText: practiceExercises.listeningText,
        scenarioStatus: practiceScenarios.status,
      })
        .from(practiceExercises).innerJoin(practiceScenarios, eq(practiceExercises.scenarioId, practiceScenarios.id))
        .where(eq(practiceExercises.id, exerciseId)).limit(1),
      tx.select({ id: practiceExercises.id }).from(practiceExercises)
        .where(and(
          eq(practiceExercises.scenarioId, input.scenarioId),
          eq(practiceExercises.slug, input.slug),
          ne(practiceExercises.id, exerciseId),
        )).limit(1),
    ]);
    const existing = existingRows[0];
    if (!existing) return { ok: false, error: "not_found" };
    if (!canEditPracticeScenario(actor.role, existing.scenarioStatus)) return { ok: false, error: "workflow_forbidden" };
    if (existing.scenarioId !== input.scenarioId) return { ok: false, error: "invalid_parent" };
    if (collision[0]) return { ok: false, error: "duplicate_slug" };
    if (input.audioAssetId) {
      const asset = await tx.select({ id: practiceAudioAssets.id }).from(practiceAudioAssets)
        .where(eq(practiceAudioAssets.id, input.audioAssetId)).limit(1);
      if (!asset[0]) return { ok: false, error: "invalid_parent" };
    }
    const reviewSensitiveChange = existing.audioAssetId !== input.audioAssetId
      || (existing.audioUrl ?? "") !== (values.audioUrl ?? "")
      || (existing.listeningText ?? "") !== input.listeningText;
    await tx.update(practiceExercises).set({
      ...values,
      ...(reviewSensitiveChange ? {
        audioReviewStatus: "pending" as const,
        audioReviewIssues: [],
        audioReviewNotes: null,
        audioReviewedBy: null,
        audioReviewedAt: null,
      } : {}),
      updatedAt: new Date(),
    })
      .where(eq(practiceExercises.id, exerciseId));
    if (existing.audioAssetId !== input.audioAssetId) await deleteAudioAssetWhenUnused(tx, existing.audioAssetId);
    const version = await createScenarioVersion(tx, input.scenarioId, actor.id, changeNote || "Cập nhật lượt nghe");
    await tx.insert(auditLogs).values({
      actorId: actor.id,
      action: "admin.practice_exercise.updated",
      entityType: "practice_exercise",
      entityId: exerciseId,
      metadata: { scenarioId: input.scenarioId, slug: input.slug, version },
    });
    return { ok: true, id: exerciseId };
  }));
}

export async function deletePracticeExercise(exerciseId: string, actor: PracticeWorkflowActor): Promise<MutationResult> {
  return writeDb((db) => db.transaction(async (tx) => {
    const rows = await tx.select({
      id: practiceExercises.id,
      slug: practiceExercises.slug,
      scenarioId: practiceExercises.scenarioId,
      audioAssetId: practiceExercises.audioAssetId,
      scenarioStatus: practiceScenarios.status,
    }).from(practiceExercises)
      .innerJoin(practiceScenarios, eq(practiceExercises.scenarioId, practiceScenarios.id))
      .where(eq(practiceExercises.id, exerciseId)).limit(1);
    const exercise = rows[0];
    if (!exercise) return { ok: false, error: "not_found" };
    if (!canEditPracticeScenario(actor.role, exercise.scenarioStatus)) return { ok: false, error: "workflow_forbidden" };
    await tx.delete(practiceExercises).where(eq(practiceExercises.id, exerciseId));
    await deleteAudioAssetWhenUnused(tx, exercise.audioAssetId);
    const version = await createScenarioVersion(tx, exercise.scenarioId, actor.id, "Xóa lượt nghe khỏi ca luyện");
    await tx.insert(auditLogs).values({
      actorId: actor.id,
      action: "admin.practice_exercise.deleted",
      entityType: "practice_exercise",
      metadata: { deletedId: exerciseId, scenarioId: exercise.scenarioId, slug: exercise.slug, version },
    });
    return { ok: true, id: exercise.scenarioId };
  }));
}

export type PracticeAudioAssetResult = {
  id: string;
  url: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  durationMs: number | null;
  storageProvider: string;
  reviewStatus: PracticeAudioReviewStatus;
  reviewIssues: PracticeAudioReviewIssue[];
  reviewNotes: string | null;
  reviewedAt: Date | null;
};

export async function attachPracticeExerciseAudioToDatabase(input: {
  exerciseId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  durationMs: number | null;
  checksumSha256: string;
  content: Uint8Array;
}, actor: PracticeWorkflowActor): Promise<{ ok: true; asset: PracticeAudioAssetResult } | { ok: false; error: "not_found" | "workflow_forbidden" }> {
  return writeDb((db) => db.transaction(async (tx) => {
    const exerciseRows = await tx.select({
      id: practiceExercises.id,
      scenarioId: practiceExercises.scenarioId,
      audioAssetId: practiceExercises.audioAssetId,
      scenarioStatus: practiceScenarios.status,
    }).from(practiceExercises)
      .innerJoin(practiceScenarios, eq(practiceExercises.scenarioId, practiceScenarios.id))
      .where(eq(practiceExercises.id, input.exerciseId)).limit(1);
    const exercise = exerciseRows[0];
    if (!exercise) return { ok: false, error: "not_found" };
    if (!canEditPracticeScenario(actor.role, exercise.scenarioStatus)) return { ok: false, error: "workflow_forbidden" };

    const inserted = await tx.insert(practiceAudioAssets).values({
      originalName: input.originalName,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      durationMs: input.durationMs,
      checksumSha256: input.checksumSha256,
      content: input.content,
      createdBy: actor.id,
    }).onConflictDoNothing({ target: practiceAudioAssets.checksumSha256 }).returning({ id: practiceAudioAssets.id });
    const assetRows = inserted[0]
      ? await tx.select({
        id: practiceAudioAssets.id,
        originalName: practiceAudioAssets.originalName,
        mimeType: practiceAudioAssets.mimeType,
        sizeBytes: practiceAudioAssets.sizeBytes,
        durationMs: practiceAudioAssets.durationMs,
      }).from(practiceAudioAssets).where(eq(practiceAudioAssets.id, inserted[0].id)).limit(1)
      : await tx.select({
        id: practiceAudioAssets.id,
        originalName: practiceAudioAssets.originalName,
        mimeType: practiceAudioAssets.mimeType,
        sizeBytes: practiceAudioAssets.sizeBytes,
        durationMs: practiceAudioAssets.durationMs,
      }).from(practiceAudioAssets).where(eq(practiceAudioAssets.checksumSha256, input.checksumSha256)).limit(1);
    const asset = assetRows[0];
    if (!asset) throw new Error("Không thể lưu audio Luyện ca.");

    await tx.update(practiceExercises).set({
      audioAssetId: asset.id,
      audioUrl: null,
      updatedAt: new Date(),
    }).where(eq(practiceExercises.id, input.exerciseId));
    const version = await createScenarioVersion(tx, exercise.scenarioId, actor.id, "Tải audio thật cho lượt nghe");
    await tx.insert(auditLogs).values({
      actorId: actor.id,
      action: "admin.practice_exercise.audio_attached",
      entityType: "practice_exercise",
      entityId: input.exerciseId,
      metadata: { scenarioId: exercise.scenarioId, assetId: asset.id, mimeType: asset.mimeType, sizeBytes: asset.sizeBytes, version },
    });
    if (exercise.audioAssetId !== asset.id) await deleteAudioAssetWhenUnused(tx, exercise.audioAssetId);
    return {
      ok: true as const,
      asset: {
        ...asset,
        url: `/api/media/practice-audio/${asset.id}`,
        storageProvider: "database",
        reviewStatus: "pending",
        reviewIssues: [],
        reviewNotes: null,
        reviewedAt: null,
      },
    };
  }));
}

export async function removePracticeExerciseAudioFromDatabase(exerciseId: string, actor: PracticeWorkflowActor): Promise<MutationResult> {
  return writeDb((db) => db.transaction(async (tx) => {
    const rows = await tx.select({
      id: practiceExercises.id,
      scenarioId: practiceExercises.scenarioId,
      audioAssetId: practiceExercises.audioAssetId,
      scenarioStatus: practiceScenarios.status,
    }).from(practiceExercises)
      .innerJoin(practiceScenarios, eq(practiceExercises.scenarioId, practiceScenarios.id))
      .where(eq(practiceExercises.id, exerciseId)).limit(1);
    const exercise = rows[0];
    if (!exercise) return { ok: false, error: "not_found" };
    if (!canEditPracticeScenario(actor.role, exercise.scenarioStatus)) return { ok: false, error: "workflow_forbidden" };
    await tx.update(practiceExercises).set({ audioAssetId: null, audioUrl: null, updatedAt: new Date() })
      .where(eq(practiceExercises.id, exerciseId));
    const version = await createScenarioVersion(tx, exercise.scenarioId, actor.id, "Gỡ audio khỏi lượt nghe");
    await tx.insert(auditLogs).values({
      actorId: actor.id,
      action: "admin.practice_exercise.audio_removed",
      entityType: "practice_exercise",
      entityId: exerciseId,
      metadata: { scenarioId: exercise.scenarioId, removedAssetId: exercise.audioAssetId, version },
    });
    await deleteAudioAssetWhenUnused(tx, exercise.audioAssetId);
    return { ok: true, id: exerciseId };
  }));
}

export async function getPracticeExerciseAudioUploadPermission(
  exerciseId: string,
  actor: PracticeWorkflowActor,
): Promise<{ ok: true } | { ok: false; error: "not_found" | "workflow_forbidden" }> {
  const rows = await readDb((db) => db.select({ status: practiceScenarios.status })
    .from(practiceExercises)
    .innerJoin(practiceScenarios, eq(practiceExercises.scenarioId, practiceScenarios.id))
    .where(eq(practiceExercises.id, exerciseId)).limit(1));
  if (!rows[0]) return { ok: false, error: "not_found" };
  return canEditPracticeScenario(actor.role, rows[0].status)
    ? { ok: true }
    : { ok: false, error: "workflow_forbidden" };
}

export async function attachPracticeExerciseAudio(input: {
  exerciseId: string;
  originalName: string;
  checksumSha256: string;
  cloudinary: CloudinaryPracticeAudio;
}, actor: PracticeWorkflowActor): Promise<
  { ok: true; asset: PracticeAudioAssetResult; cleanupPublicIds: string[] }
  | { ok: false; error: "not_found" | "workflow_forbidden" }
> {
  const result = await writeDb((db) => db.transaction(async (tx) => {
    const exerciseRows = await tx.select({
      id: practiceExercises.id,
      scenarioId: practiceExercises.scenarioId,
      audioAssetId: practiceExercises.audioAssetId,
      scenarioStatus: practiceScenarios.status,
    }).from(practiceExercises)
      .innerJoin(practiceScenarios, eq(practiceExercises.scenarioId, practiceScenarios.id))
      .where(eq(practiceExercises.id, input.exerciseId)).limit(1);
    const exercise = exerciseRows[0];
    if (!exercise) return { ok: false, error: "not_found" } as const;
    if (!canEditPracticeScenario(actor.role, exercise.scenarioStatus)) {
      return { ok: false, error: "workflow_forbidden" } as const;
    }

    const existingRows = await tx.select({
      id: practiceAudioAssets.id,
      cloudinaryPublicId: practiceAudioAssets.cloudinaryPublicId,
    }).from(practiceAudioAssets).where(or(
      eq(practiceAudioAssets.checksumSha256, input.checksumSha256),
      eq(practiceAudioAssets.cloudinaryAssetId, input.cloudinary.assetId),
    )).limit(1);
    let assetId = existingRows[0]?.id;
    const cleanupPublicIds: string[] = [];
    if (assetId) {
      const existingPublicId = existingRows[0].cloudinaryPublicId;
      if (existingPublicId && existingPublicId !== input.cloudinary.publicId) {
        cleanupPublicIds.push(input.cloudinary.publicId);
      } else {
        await tx.update(practiceAudioAssets).set({
          originalName: input.originalName,
          mimeType: input.cloudinary.mimeType,
          sizeBytes: input.cloudinary.sizeBytes,
          durationMs: input.cloudinary.durationMs,
          storageProvider: "cloudinary",
          cloudinaryAssetId: input.cloudinary.assetId,
          cloudinaryPublicId: input.cloudinary.publicId,
          cloudinaryVersion: input.cloudinary.version,
          cloudinarySecureUrl: input.cloudinary.secureUrl,
          cloudinaryFormat: input.cloudinary.format,
          content: null,
        }).where(eq(practiceAudioAssets.id, assetId));
      }
    } else {
      const inserted = await tx.insert(practiceAudioAssets).values({
        originalName: input.originalName,
        mimeType: input.cloudinary.mimeType,
        sizeBytes: input.cloudinary.sizeBytes,
        durationMs: input.cloudinary.durationMs,
        checksumSha256: input.checksumSha256,
        storageProvider: "cloudinary",
        cloudinaryAssetId: input.cloudinary.assetId,
        cloudinaryPublicId: input.cloudinary.publicId,
        cloudinaryVersion: input.cloudinary.version,
        cloudinarySecureUrl: input.cloudinary.secureUrl,
        cloudinaryFormat: input.cloudinary.format,
        content: null,
        createdBy: actor.id,
      }).returning({ id: practiceAudioAssets.id });
      assetId = inserted[0]?.id;
    }
    if (!assetId) throw new Error("Không thể lưu metadata audio Luyện ca.");
    const assetRows = await tx.select({
      id: practiceAudioAssets.id,
      originalName: practiceAudioAssets.originalName,
      mimeType: practiceAudioAssets.mimeType,
      sizeBytes: practiceAudioAssets.sizeBytes,
      durationMs: practiceAudioAssets.durationMs,
      storageProvider: practiceAudioAssets.storageProvider,
    }).from(practiceAudioAssets).where(eq(practiceAudioAssets.id, assetId)).limit(1);
    const asset = assetRows[0];
    if (!asset) throw new Error("Không thể đọc metadata audio Luyện ca.");

    await tx.update(practiceExercises).set({
      audioAssetId: asset.id,
      audioUrl: null,
      audioReviewStatus: "pending",
      audioReviewIssues: [],
      audioReviewNotes: null,
      audioReviewedBy: null,
      audioReviewedAt: null,
      updatedAt: new Date(),
    }).where(eq(practiceExercises.id, input.exerciseId));
    const version = await createScenarioVersion(tx, exercise.scenarioId, actor.id, "Tải audio lên Cloudinary cho lượt nghe");
    await tx.insert(auditLogs).values({
      actorId: actor.id,
      action: "admin.practice_exercise.audio_attached",
      entityType: "practice_exercise",
      entityId: input.exerciseId,
      metadata: {
        scenarioId: exercise.scenarioId,
        assetId: asset.id,
        provider: asset.storageProvider,
        mimeType: asset.mimeType,
        sizeBytes: asset.sizeBytes,
        reviewStatus: "pending",
        version,
      },
    });
    if (exercise.audioAssetId !== asset.id) {
      const oldPublicId = await deleteAudioAssetWhenUnused(tx, exercise.audioAssetId);
      if (oldPublicId) cleanupPublicIds.push(oldPublicId);
    }
    return {
      ok: true as const,
      asset: {
        ...asset,
        url: `/api/media/practice-audio/${asset.id}`,
        reviewStatus: "pending" as const,
        reviewIssues: [],
        reviewNotes: null,
        reviewedAt: null,
      },
      cleanupPublicIds,
    };
  }));
  if (result.ok) await cleanupCloudinaryAssets(result.cleanupPublicIds);
  return result;
}

export async function reviewPracticeExerciseAudio(input: {
  exerciseId: string;
  audioAssetId: string;
  status: Exclude<PracticeAudioReviewStatus, "pending">;
  issues: PracticeAudioReviewIssue[];
  notes: string;
}, actor: PracticeWorkflowActor): Promise<MutationResult> {
  return writeDb((db) => db.transaction(async (tx) => {
    const rows = await tx.select({
      id: practiceExercises.id,
      scenarioId: practiceExercises.scenarioId,
      audioAssetId: practiceExercises.audioAssetId,
      scenarioStatus: practiceScenarios.status,
      reviewerId: practiceScenarios.reviewerId,
    }).from(practiceExercises)
      .innerJoin(practiceScenarios, eq(practiceExercises.scenarioId, practiceScenarios.id))
      .where(eq(practiceExercises.id, input.exerciseId)).limit(1);
    const exercise = rows[0];
    if (!exercise || !exercise.audioAssetId || exercise.audioAssetId !== input.audioAssetId) {
      return { ok: false, error: "not_found" };
    }
    if (!canReviewPracticeAudio(actor, exercise.scenarioStatus, exercise.reviewerId)) {
      return { ok: false, error: "review_assignment_required" };
    }
    if (input.status === "re_record" && input.issues.length === 0 && !input.notes.trim()) {
      return { ok: false, error: "invalid_input" };
    }
    const now = new Date();
    const issues = input.status === "approved" ? [] : input.issues;
    await tx.update(practiceExercises).set({
      audioReviewStatus: input.status,
      audioReviewIssues: issues,
      audioReviewNotes: input.notes.trim() || null,
      audioReviewedBy: actor.id,
      audioReviewedAt: now,
      updatedAt: now,
    }).where(eq(practiceExercises.id, input.exerciseId));
    await tx.insert(auditLogs).values({
      actorId: actor.id,
      action: input.status === "approved"
        ? "admin.practice_exercise.audio_approved"
        : "admin.practice_exercise.audio_rerecord_requested",
      entityType: "practice_exercise",
      entityId: input.exerciseId,
      metadata: {
        scenarioId: exercise.scenarioId,
        assetId: exercise.audioAssetId,
        reviewStatus: input.status,
        issues,
        notes: input.notes.trim() || null,
      },
    });
    return { ok: true, id: input.exerciseId };
  }));
}

export async function removePracticeExerciseAudio(exerciseId: string, actor: PracticeWorkflowActor): Promise<
  { ok: true; id: string } | { ok: false; error: "not_found" | "workflow_forbidden" }
> {
  const cleanupPublicIds: string[] = [];
  const result = await writeDb((db) => db.transaction(async (tx) => {
    const rows = await tx.select({
      id: practiceExercises.id,
      scenarioId: practiceExercises.scenarioId,
      audioAssetId: practiceExercises.audioAssetId,
      scenarioStatus: practiceScenarios.status,
    }).from(practiceExercises)
      .innerJoin(practiceScenarios, eq(practiceExercises.scenarioId, practiceScenarios.id))
      .where(eq(practiceExercises.id, exerciseId)).limit(1);
    const exercise = rows[0];
    if (!exercise) return { ok: false, error: "not_found" } as const;
    if (!canEditPracticeScenario(actor.role, exercise.scenarioStatus)) {
      return { ok: false, error: "workflow_forbidden" } as const;
    }
    await tx.update(practiceExercises).set({
      audioAssetId: null,
      audioUrl: null,
      audioReviewStatus: "pending",
      audioReviewIssues: [],
      audioReviewNotes: null,
      audioReviewedBy: null,
      audioReviewedAt: null,
      updatedAt: new Date(),
    }).where(eq(practiceExercises.id, exerciseId));
    const version = await createScenarioVersion(tx, exercise.scenarioId, actor.id, "Gỡ audio khỏi lượt nghe");
    await tx.insert(auditLogs).values({
      actorId: actor.id,
      action: "admin.practice_exercise.audio_removed",
      entityType: "practice_exercise",
      entityId: exerciseId,
      metadata: { scenarioId: exercise.scenarioId, removedAssetId: exercise.audioAssetId, version },
    });
    const publicId = await deleteAudioAssetWhenUnused(tx, exercise.audioAssetId);
    if (publicId) cleanupPublicIds.push(publicId);
    return { ok: true, id: exerciseId } as const;
  }));
  await cleanupCloudinaryAssets(cleanupPublicIds);
  return result;
}
