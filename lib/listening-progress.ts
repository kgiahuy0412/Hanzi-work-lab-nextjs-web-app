export const LISTENING_PROGRESS_KEY = "himi-listening-progress:v1";

export type ListeningLessonProgress = {
  bestScore: number;
  attempts: number;
  completedAt: string | null;
};

export type ListeningProgress = Record<string, ListeningLessonProgress>;

function isListeningLessonProgress(value: unknown): value is ListeningLessonProgress {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  const candidate = value as Partial<ListeningLessonProgress>;
  return typeof candidate.bestScore === "number"
    && Number.isFinite(candidate.bestScore)
    && typeof candidate.attempts === "number"
    && Number.isInteger(candidate.attempts)
    && (candidate.completedAt === null || typeof candidate.completedAt === "string");
}

export function parseListeningProgress(raw: string | null): ListeningProgress {
  if (!raw) return {};

  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};

    const entries = Object.entries(value).filter(
      (entry): entry is [string, ListeningLessonProgress] => isListeningLessonProgress(entry[1]),
    );
    return entries.length === Object.keys(value).length ? Object.fromEntries(entries) : {};
  } catch {
    return {};
  }
}

export function recordListeningResult(
  progress: ListeningProgress,
  lessonId: string,
  score: number,
  total: number,
  completedAt = new Date().toISOString(),
): ListeningProgress {
  const previous = progress[lessonId];
  const boundedScore = Math.max(0, Math.min(total, Math.round(score)));

  return {
    ...progress,
    [lessonId]: {
      bestScore: Math.max(previous?.bestScore ?? 0, boundedScore),
      attempts: (previous?.attempts ?? 0) + 1,
      completedAt,
    },
  };
}
