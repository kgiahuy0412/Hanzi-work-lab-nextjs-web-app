export const gameIds = ["slice", "memory", "connect", "listen", "write", "flash", "quiz"] as const;

export type GameId = typeof gameIds[number];

export type PracticeProgressSnapshot = {
  completedScenarioIds: string[];
  attemptCount: number;
  correctAnswers: number;
  totalQuestions: number;
  totalReactionMs: number;
  reactionQuestions: number;
  accuracyPercent: number | null;
  averageReactionMs: number | null;
};

export type GameProgressSnapshot = {
  completed: GameId[];
  totalXp: number;
  bestScore: number;
  attemptCount: number;
};

export const emptyPracticeProgress: PracticeProgressSnapshot = {
  completedScenarioIds: [],
  attemptCount: 0,
  correctAnswers: 0,
  totalQuestions: 0,
  totalReactionMs: 0,
  reactionQuestions: 0,
  accuracyPercent: null,
  averageReactionMs: null,
};

export const emptyGameProgress: GameProgressSnapshot = {
  completed: [],
  totalXp: 0,
  bestScore: 0,
  attemptCount: 0,
};

export function isGameId(value: unknown): value is GameId {
  return typeof value === "string" && (gameIds as readonly string[]).includes(value);
}

export function xpForGameScore(score: number): number {
  return Math.max(100, Math.round(score / 2));
}
