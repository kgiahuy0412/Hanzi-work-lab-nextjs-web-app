import "server-only";

import { and, asc, eq, inArray, or } from "drizzle-orm";
import { readDb } from "../db/index.ts";
import { practiceAudioAssets, practiceExercises, practiceIndustries as industryTable, practiceScenarios as scenarioTable } from "../db/schema.ts";
import { getLessonAccess } from "./lesson-access.ts";
import {
  practiceIndustries,
  practiceScenarios,
  type PracticeExercise,
  type PracticeIndustry,
  type PracticeScenarioDto,
} from "./practice-content.ts";

export type PracticeCatalog = {
  industries: PracticeIndustry[];
  scenarios: PracticeScenarioDto[];
  hasVip: boolean;
};

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function fallbackCatalog(hasVip: boolean): PracticeCatalog {
  return {
    industries: practiceIndustries,
    hasVip,
    scenarios: practiceScenarios.map((scenario) => {
      const locked = !scenario.isFree && !hasVip;
      return { ...scenario, locked, exercises: locked ? null : scenario.exercises };
    }),
  };
}

/**
 * Reads the public catalogue from PostgreSQL. Exercise rows for locked VIP
 * scenarios are intentionally excluded from the query, so answers never cross
 * the server boundary for learners without an active subscription.
 */
export async function getPracticeCatalog(userId: string | null): Promise<PracticeCatalog> {
  const vipAccess = await getLessonAccess({ isFree: false, userId });
  const hasVip = vipAccess.allowed && vipAccess.source === "vip";
  if (!process.env.DATABASE_URL) return fallbackCatalog(hasVip);

  const { industries, scenarios, exercises } = await readDb(async (db) => {
    const [industryRows, scenarioRows] = await Promise.all([
      db.select({
        id: industryTable.id,
        slug: industryTable.slug,
        label: industryTable.label,
        description: industryTable.description,
        imageUrl: industryTable.imageUrl,
      }).from(industryTable)
        .where(eq(industryTable.status, "published"))
        .orderBy(asc(industryTable.sortOrder), asc(industryTable.label)),
      db.select({
        id: scenarioTable.id,
        slug: scenarioTable.slug,
        industryId: scenarioTable.industryId,
        title: scenarioTable.title,
        brief: scenarioTable.brief,
        context: scenarioTable.context,
        durationMinutes: scenarioTable.durationMinutes,
        level: scenarioTable.level,
        isFree: scenarioTable.isFree,
        sentenceZh: scenarioTable.sentenceZh,
        pinyin: scenarioTable.pinyin,
        translation: scenarioTable.translation,
        focus: scenarioTable.focus,
      }).from(scenarioTable)
        .innerJoin(industryTable, eq(scenarioTable.industryId, industryTable.id))
        .where(and(eq(scenarioTable.status, "published"), eq(industryTable.status, "published")))
        .orderBy(asc(industryTable.sortOrder), asc(scenarioTable.sortOrder), asc(scenarioTable.title)),
    ]);

    const accessibleScenarioIds = scenarioRows
      .filter((scenario) => hasVip || scenario.isFree)
      .map((scenario) => scenario.id);
    const exerciseRows = accessibleScenarioIds.length === 0
      ? []
      : await db.select({
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
        options: practiceExercises.options,
        correctOption: practiceExercises.correctOption,
        explanation: practiceExercises.explanation,
      }).from(practiceExercises)
        .innerJoin(scenarioTable, eq(practiceExercises.scenarioId, scenarioTable.id))
        .leftJoin(practiceAudioAssets, eq(practiceExercises.audioAssetId, practiceAudioAssets.id))
        .where(and(
          inArray(practiceExercises.scenarioId, accessibleScenarioIds),
          eq(scenarioTable.status, "published"),
          hasVip ? undefined : or(eq(scenarioTable.isFree, true)),
        ))
        .orderBy(asc(practiceExercises.scenarioId), asc(practiceExercises.sortOrder), asc(practiceExercises.slug));

    return { industries: industryRows, scenarios: scenarioRows, exercises: exerciseRows };
  });

  const industryById = new Map(industries.map((industry) => [industry.id, industry]));
  const exercisesByScenario = new Map<string, PracticeExercise[]>();
  for (const exercise of exercises) {
    const options = stringList(exercise.options);
    const item: PracticeExercise = {
      id: exercise.slug,
      eyebrow: exercise.eyebrow,
      prompt: exercise.prompt,
      ...(exercise.chinese ? { chinese: exercise.chinese } : {}),
      ...(exercise.listeningText ? { listeningText: exercise.listeningText } : {}),
      ...(exercise.isStatementCorrect !== null ? { isStatementCorrect: exercise.isStatementCorrect } : {}),
      ...(exercise.audioReviewStatus === "approved" && exercise.audioAssetId
        ? { audioUrl: `/api/media/practice-audio/${exercise.audioAssetId}` }
        : exercise.audioReviewStatus === "approved" && exercise.audioUrl ? { audioUrl: exercise.audioUrl } : {}),
      options,
      correctOption: exercise.correctOption,
      explanation: exercise.explanation,
    };
    const group = exercisesByScenario.get(exercise.scenarioId) ?? [];
    group.push(item);
    exercisesByScenario.set(exercise.scenarioId, group);
  }

  return {
    hasVip,
    industries: industries.map((industry) => ({
      id: industry.slug,
      label: industry.label,
      description: industry.description,
      ...(industry.imageUrl ? { imageUrl: industry.imageUrl } : {}),
    })),
    scenarios: scenarios.flatMap((scenario) => {
      const industry = industryById.get(scenario.industryId);
      if (!industry) return [];
      const locked = !scenario.isFree && !hasVip;
      return [{
        id: scenario.slug,
        industry: industry.slug,
        title: scenario.title,
        brief: scenario.brief,
        context: scenario.context,
        durationMinutes: scenario.durationMinutes,
        level: scenario.level as PracticeScenarioDto["level"],
        isFree: scenario.isFree,
        sentenceZh: scenario.sentenceZh,
        pinyin: scenario.pinyin,
        translation: scenario.translation,
        focus: stringList(scenario.focus),
        locked,
        exercises: locked ? null : exercisesByScenario.get(scenario.id) ?? [],
      }];
    }),
  };
}
