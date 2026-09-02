export const PRACTICE_ANSWER_WINDOW_MS = 8_000;

export type PracticePerformanceAttempt = {
  correctAnswers: number;
  totalQuestions: number;
  totalReactionMs: number | null;
};

export type PracticePerformanceSummary = {
  accuracyPercent: number | null;
  averageReactionMs: number | null;
};

export function clampPracticeReactionMs(value: number): number {
  if (!Number.isFinite(value)) return PRACTICE_ANSWER_WINDOW_MS;
  return Math.round(Math.min(PRACTICE_ANSWER_WINDOW_MS, Math.max(0, value)));
}

export function summarizePracticePerformance(
  attempts: readonly PracticePerformanceAttempt[],
): PracticePerformanceSummary {
  const totalQuestions = attempts.reduce((total, attempt) => total + Math.max(0, attempt.totalQuestions), 0);
  const totalCorrect = attempts.reduce((total, attempt) => total + Math.max(0, attempt.correctAnswers), 0);
  const reactionAttempts = attempts.filter((attempt) => attempt.totalReactionMs !== null);
  const reactionQuestions = reactionAttempts.reduce((total, attempt) => total + Math.max(0, attempt.totalQuestions), 0);
  const totalReactionMs = reactionAttempts.reduce((total, attempt) => total + Math.max(0, attempt.totalReactionMs ?? 0), 0);

  return {
    accuracyPercent: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : null,
    averageReactionMs: reactionQuestions > 0 ? Math.round(totalReactionMs / reactionQuestions) : null,
  };
}

export function formatPracticeReactionTime(milliseconds: number | null): string {
  if (milliseconds === null) return "Chưa có";
  return `${(milliseconds / 1_000).toFixed(1).replace(".0", "")} giây`;
}
