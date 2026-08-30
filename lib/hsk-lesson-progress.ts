import type { HskLessonContent } from "./hsk-lesson-content";

export type HskLessonProgress = {
  vocabulary: string[];
  pronunciation: string[];
  exerciseBestPercent: number;
  reviewedExercises: string[];
  writing: string[];
  guidedStep: number;
  guidedCompleted: boolean;
};

export const EMPTY_HSK_LESSON_PROGRESS: HskLessonProgress = {
  vocabulary: [],
  pronunciation: [],
  exerciseBestPercent: 0,
  reviewedExercises: [],
  writing: [],
  guidedStep: -1,
  guidedCompleted: false,
};

function uniqueStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === "string" && item.length > 0))];
}

export function parseHskLessonProgress(raw: string | null): HskLessonProgress {
  if (!raw) return EMPTY_HSK_LESSON_PROGRESS;

  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return EMPTY_HSK_LESSON_PROGRESS;
    const candidate = value as Partial<HskLessonProgress>;
    const score = typeof candidate.exerciseBestPercent === "number" && Number.isFinite(candidate.exerciseBestPercent)
      ? Math.max(0, Math.min(100, Math.round(candidate.exerciseBestPercent)))
      : 0;
    return {
      vocabulary: uniqueStrings(candidate.vocabulary),
      pronunciation: uniqueStrings(candidate.pronunciation),
      exerciseBestPercent: score,
      reviewedExercises: uniqueStrings(candidate.reviewedExercises),
      writing: uniqueStrings(candidate.writing),
      guidedStep: typeof candidate.guidedStep === "number" && Number.isFinite(candidate.guidedStep)
        ? Math.max(-1, Math.round(candidate.guidedStep))
        : -1,
      guidedCompleted: candidate.guidedCompleted === true,
    };
  } catch {
    return EMPTY_HSK_LESSON_PROGRESS;
  }
}

export function getHskLessonProgressStorageKey(lessonId: string): string {
  return `himi-hsk-lesson-progress:v1:${lessonId}`;
}

function ratio(completed: number, total: number): number {
  if (!total) return 1;
  return Math.min(1, completed / total);
}

export function calculateHskLessonProgress(lesson: HskLessonContent, progress: HskLessonProgress): number {
  const placeholderSteps = (lesson.guidedPlaceholders ?? []).filter((kind) => {
    if (kind === "vocabulary") return lesson.vocabulary.length === 0;
    if (kind === "dialogue") return lesson.dialogues.length === 0;
    if (kind === "pronunciation") return lesson.pronunciationTopics.length === 0;
    return lesson.writingCharacters.length === 0;
  }).length;
  const guidedSteps = lesson.vocabulary.length
    + lesson.grammar.length
    + lesson.dialogues.length
    + (lesson.pronunciationTopics.length ? 1 : 0)
    + lesson.exercises.length
    + (lesson.writingCharacters.length ? 1 : 0)
    + placeholderSteps
    + 2;
  const completedWriting = lesson.writingCharacters
    .filter((item) => progress.writing.includes(item.id) || progress.writing.includes(item.hanzi))
    .map((item) => item.id);
  return calculateHskLessonProgressFromCounts({
    vocabulary: lesson.vocabulary.length,
    pronunciation: lesson.modes.includes("pronunciation") ? lesson.vocabulary.length : 0,
    exercises: lesson.exercises.length,
    scoredExercises: lesson.exercises.some((exercise) => exercise.answer !== null),
    writing: lesson.writingCharacters.length,
    guidedSteps,
  }, { ...progress, writing: completedWriting });
}

export function calculateHskLessonProgressFromCounts(
  counts: {
    vocabulary: number;
    pronunciation?: number;
    exercises?: number;
    scoredExercises?: boolean;
    writing: number;
    guidedSteps: number;
  },
  progress: HskLessonProgress,
): number {
  const modeRatios: number[] = [];
  if (counts.vocabulary) modeRatios.push(ratio(progress.vocabulary.length, counts.vocabulary));
  if (counts.pronunciation) modeRatios.push(ratio(progress.pronunciation.length, counts.pronunciation));
  if (counts.exercises) {
    modeRatios.push(counts.scoredExercises
      ? Math.min(1, progress.exerciseBestPercent / 100)
      : ratio(progress.reviewedExercises.length, counts.exercises));
  }
  if (counts.writing) modeRatios.push(ratio(progress.writing.length, counts.writing));
  const modeProgress = modeRatios.length
    ? Math.round((modeRatios.reduce((total, value) => total + value, 0) / modeRatios.length) * 100)
    : 0;
  const guidedStep = typeof progress.guidedStep === "number" ? progress.guidedStep : -1;
  const guidedProgress = progress.guidedCompleted || counts.guidedSteps <= 0
    ? 100
    : Math.round((Math.min(guidedStep + 1, counts.guidedSteps) / counts.guidedSteps) * 100);
  return Math.max(modeProgress, guidedProgress);
}
