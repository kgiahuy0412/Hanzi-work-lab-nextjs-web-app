export type ReviewState = "new" | "learning" | "reviewing" | "mastered";

export type ReviewSnapshot = {
  state: ReviewState;
  easeScore: number;
  intervalDays: number;
  correctCount: number;
  wrongCount: number;
};

export type ReviewSchedule = ReviewSnapshot & {
  nextReviewAt: Date;
};

const DAY_IN_MS = 24 * 60 * 60 * 1_000;

export function scheduleReview(snapshot: ReviewSnapshot | null, remembered: boolean, now = new Date()): ReviewSchedule {
  const current = snapshot ?? { state: "new" as const, easeScore: 250, intervalDays: 0, correctCount: 0, wrongCount: 0 };

  if (!remembered) {
    const intervalDays = 1;
    return {
      state: "learning",
      easeScore: Math.max(130, current.easeScore - 20),
      intervalDays,
      correctCount: current.correctCount,
      wrongCount: current.wrongCount + 1,
      nextReviewAt: new Date(now.getTime() + intervalDays * DAY_IN_MS),
    };
  }

  const correctCount = current.correctCount + 1;
  const intervalDays = current.intervalDays === 0
    ? 1
    : Math.min(180, Math.max(1, Math.round(current.intervalDays * current.easeScore / 100)));
  return {
    state: correctCount >= 5 ? "mastered" : intervalDays >= 7 ? "reviewing" : "learning",
    easeScore: Math.min(300, current.easeScore + 5),
    intervalDays,
    correctCount,
    wrongCount: current.wrongCount,
    nextReviewAt: new Date(now.getTime() + intervalDays * DAY_IN_MS),
  };
}
