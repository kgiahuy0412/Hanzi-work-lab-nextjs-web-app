import type { GameId } from "./activity-progress.ts";

export const dailySessionStepIds = ["review", "lesson", "practice", "game"] as const;

export type DailySessionStepId = typeof dailySessionStepIds[number];

export type DailyRecommendation = {
  href: string;
  title: string;
};

export type DailySessionSource = {
  reviewedToday: number;
  lessonCompletedToday: boolean;
  practiceCompletedToday: boolean;
  gameCompletedToday: boolean;
  lesson: DailyRecommendation;
  practice: DailyRecommendation;
  game: DailyRecommendation & { id: GameId };
  summary: DailySessionSummary;
};

export type DailySessionSummary = {
  reviewedWords: number;
  lessonTitle: string | null;
  practiceCorrect: number | null;
  practiceTotal: number | null;
  gameScore: number | null;
  xpEarned: number;
};

export type DailySessionStep = {
  id: DailySessionStepId;
  label: string;
  title: string;
  href: string;
  minutes: number;
  completed: boolean;
};

export type DailySessionSnapshot = {
  totalMinutes: number;
  totalSteps: number;
  completedSteps: number;
  reviewedToday: number;
  reviewTarget: number;
  summary: DailySessionSummary;
  steps: DailySessionStep[];
};

export const defaultDailySessionSource: DailySessionSource = {
  reviewedToday: 0,
  lessonCompletedToday: false,
  practiceCompletedToday: false,
  gameCompletedToday: false,
  lesson: {
    href: "/learn/van-phong-hanh-chinh?lesson=chao-hoi-tai-noi-lam-viec",
    title: "Chào hỏi tại nơi làm việc",
  },
  practice: {
    href: "/practice?scenario=bao-tien-do-tre-han",
    title: "Báo tiến độ khi sắp trễ hạn",
  },
  game: {
    id: "slice",
    href: "/games?game=slice",
    title: "Luyện chém từ",
  },
  summary: {
    reviewedWords: 0,
    lessonTitle: null,
    practiceCorrect: null,
    practiceTotal: null,
    gameScore: null,
    xpEarned: 0,
  },
};

export function withDailySessionFlow(href: string): string {
  const url = new URL(href, "https://hanziwork.local");
  url.searchParams.set("session", "today");
  return `${url.pathname}${url.search}${url.hash}`;
}

export function buildDailySession(
  source: DailySessionSource,
  reviewWordCount: number,
): DailySessionSnapshot {
  const reviewTarget = Math.min(3, Math.max(0, source.reviewedToday + reviewWordCount));
  const reviewCompleted = reviewTarget === 0 || source.reviewedToday >= reviewTarget;
  const remainingReviews = Math.max(0, reviewTarget - source.reviewedToday);

  const steps: DailySessionStep[] = [
    {
      id: "review",
      label: "Ôn nhanh",
      title: reviewTarget === 0
        ? "Không có từ đến lịch"
        : reviewCompleted
          ? `Đã ôn ${reviewTarget} từ`
          : `${remainingReviews} từ đang chờ`,
      href: reviewTarget === 0 ? "/courses" : "/?session=today#review-deck",
      minutes: 2,
      completed: reviewCompleted,
    },
    {
      id: "lesson",
      label: "Học tiếp",
      title: source.lesson.title,
      href: withDailySessionFlow(source.lesson.href),
      minutes: 4,
      completed: source.lessonCompletedToday,
    },
    {
      id: "practice",
      label: "Luyện ca",
      title: source.practice.title,
      href: withDailySessionFlow(source.practice.href),
      minutes: 3,
      completed: source.practiceCompletedToday,
    },
    {
      id: "game",
      label: "Phản xạ",
      title: source.game.title,
      href: withDailySessionFlow(source.game.href),
      minutes: 1,
      completed: source.gameCompletedToday,
    },
  ];

  return {
    totalMinutes: steps.reduce((total, step) => total + step.minutes, 0),
    totalSteps: steps.length,
    completedSteps: steps.filter((step) => step.completed).length,
    reviewedToday: source.reviewedToday,
    reviewTarget,
    summary: source.summary,
    steps,
  };
}
