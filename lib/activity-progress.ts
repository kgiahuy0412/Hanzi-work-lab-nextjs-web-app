export const gameIds = ["slice", "memory", "connect", "listen", "write", "flash", "quiz"] as const;

export type GameId = typeof gameIds[number];

export type PracticeProgressSnapshot = {
  completedScenarioIds: string[];
  attemptCount: number;
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
