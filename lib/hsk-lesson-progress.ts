import type { HskLessonContent } from "./hsk-lesson-content";

export type HskLessonProgress = {
  vocabulary: string[];
  pronunciation: string[];
  exerciseBestPercent: number;
  writing: string[];
  guidedStep: number;
  guidedCompleted: boolean;
};

export const EMPTY_HSK_LESSON_PROGRESS: HskLessonProgress = {
  vocabulary: [],
  pronunciation: [],
  exerciseBestPercent: 0,
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
  const guidedSteps = lesson.vocabulary.length
    + lesson.grammar.length
    + lesson.dialogues.length
    + (lesson.pronunciationTopics.length ? 1 : 0)
    + lesson.exercises.length
    + 3;
  return calculateHskLessonProgressFromCounts({
    vocabulary: lesson.vocabulary.length,
    writing: lesson.writingCharacters.length,
    guidedSteps,
  }, progress);
}

export function calculateHskLessonProgressFromCounts(
  counts: { vocabulary: number; writing: number; guidedSteps: number },
  progress: HskLessonProgress,
): number {
  const vocabulary = ratio(progress.vocabulary.length, counts.vocabulary);
  const pronunciation = ratio(progress.pronunciation.length, counts.vocabulary);
  const exercise = Math.min(1, progress.exerciseBestPercent / 100);
  const writing = ratio(progress.writing.length, counts.writing);
  const modeProgress = Math.round((vocabulary + pronunciation + exercise + writing) * 25);
  const guidedStep = typeof progress.guidedStep === "number" ? progress.guidedStep : -1;
  const guidedProgress = progress.guidedCompleted || counts.guidedSteps <= 0
    ? 100
    : Math.round((Math.min(guidedStep + 1, counts.guidedSteps) / counts.guidedSteps) * 100);
  return Math.max(modeProgress, guidedProgress);
}
