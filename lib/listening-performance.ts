import { clampPracticeReactionMs, PRACTICE_ANSWER_WINDOW_MS } from "./practice-performance.ts";

export const HSK_LISTENING_PERFORMANCE_KEY = "hanziwork.listening.hsk-performance.v1";
export const SCENARIO_LISTENING_PERFORMANCE_KEY = "hanziwork.practice.performance.v1";

export type ListeningPerformanceTotals = {
  correctAnswers: number;
  totalQuestions: number;
  totalReactionMs: number;
  reactionQuestions: number;
};

export const emptyListeningPerformance: ListeningPerformanceTotals = {
  correctAnswers: 0,
  totalQuestions: 0,
  totalReactionMs: 0,
  reactionQuestions: 0,
};

export function parseListeningPerformance(raw: string | null): ListeningPerformanceTotals {
  if (!raw) return emptyListeningPerformance;

  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return emptyListeningPerformance;
    const candidate = value as Partial<ListeningPerformanceTotals>;
    const entries = [
      candidate.correctAnswers,
      candidate.totalQuestions,
      candidate.totalReactionMs,
      candidate.reactionQuestions,
    ];
    if (!entries.every((entry) => Number.isInteger(entry) && Number(entry) >= 0)) {
      return emptyListeningPerformance;
    }

    const totals = candidate as ListeningPerformanceTotals;
    if (totals.correctAnswers > totals.totalQuestions || totals.reactionQuestions > totals.totalQuestions) {
      return emptyListeningPerformance;
    }
    return totals;
  } catch {
    return emptyListeningPerformance;
  }
}

export function parseScenarioListeningPerformance(raw: string | null): ListeningPerformanceTotals {
  if (!raw) return emptyListeningPerformance;

  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return emptyListeningPerformance;
    const candidate = value as Record<string, unknown>;
    const entries = [
      candidate.correctAnswers,
      candidate.totalQuestions,
      candidate.totalReactionMs,
    ];
    if (!entries.every((entry) => Number.isInteger(entry) && Number(entry) >= 0)) {
      return emptyListeningPerformance;
    }

    const correctAnswers = Number(candidate.correctAnswers);
    const totalQuestions = Number(candidate.totalQuestions);
    const totalReactionMs = Number(candidate.totalReactionMs);
    if (correctAnswers > totalQuestions || totalReactionMs > totalQuestions * PRACTICE_ANSWER_WINDOW_MS) {
      return emptyListeningPerformance;
    }

    return {
      correctAnswers,
      totalQuestions,
      totalReactionMs,
      reactionQuestions: totalQuestions,
    };
  } catch {
    return emptyListeningPerformance;
  }
}

export function recordListeningQuestion(
  current: ListeningPerformanceTotals,
  correct: boolean,
  reactionMs: number,
): ListeningPerformanceTotals {
  return {
    correctAnswers: current.correctAnswers + (correct ? 1 : 0),
    totalQuestions: current.totalQuestions + 1,
    totalReactionMs: current.totalReactionMs + clampPracticeReactionMs(reactionMs),
    reactionQuestions: current.reactionQuestions + 1,
  };
}

export function combineListeningPerformance(
  ...sources: readonly ListeningPerformanceTotals[]
): ListeningPerformanceTotals {
  const safeTotal = (value: number) => Number.isFinite(value) ? Math.max(0, value) : 0;
  return sources.reduce<ListeningPerformanceTotals>((total, source) => ({
    correctAnswers: total.correctAnswers + safeTotal(source.correctAnswers),
    totalQuestions: total.totalQuestions + safeTotal(source.totalQuestions),
    totalReactionMs: total.totalReactionMs + safeTotal(source.totalReactionMs),
    reactionQuestions: total.reactionQuestions + safeTotal(source.reactionQuestions),
  }), { ...emptyListeningPerformance });
}

export function summarizeListeningPerformance(totals: ListeningPerformanceTotals): {
  accuracyPercent: number | null;
  averageReactionMs: number | null;
} {
  return {
    accuracyPercent: totals.totalQuestions > 0
      ? Math.round((totals.correctAnswers / totals.totalQuestions) * 100)
      : null,
    averageReactionMs: totals.reactionQuestions > 0
      ? Math.round(totals.totalReactionMs / totals.reactionQuestions)
      : null,
  };
}

export function aggregateListeningAttempts(
  attempts: readonly {
    correctAnswers: number;
    totalQuestions: number;
    totalReactionMs: number | null;
  }[],
): ListeningPerformanceTotals {
  return attempts.reduce<ListeningPerformanceTotals>((total, attempt) => ({
    correctAnswers: total.correctAnswers + Math.max(0, attempt.correctAnswers),
    totalQuestions: total.totalQuestions + Math.max(0, attempt.totalQuestions),
    totalReactionMs: total.totalReactionMs + Math.max(0, attempt.totalReactionMs ?? 0),
    reactionQuestions: total.reactionQuestions + (attempt.totalReactionMs === null ? 0 : Math.max(0, attempt.totalQuestions)),
  }), { ...emptyListeningPerformance });
}
