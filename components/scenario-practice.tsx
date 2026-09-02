import { ListeningModeSwitcher } from "@/components/listening-mode-switcher";
import { ListeningPerformanceSummary } from "@/components/listening-performance-summary";
import { WorkPracticeHub } from "@/components/work-practice-hub";
import { emptyPracticeProgress } from "@/lib/activity-progress";
import { getPracticeProgress } from "@/lib/activity-progress-repository";
import { getCurrentUser } from "@/lib/auth-session";
import { getDailySessionSource } from "@/lib/daily-session-repository";
import { listPracticeVocabulary } from "@/lib/lesson-repository";
import { getPracticeCatalog } from "@/lib/practice-repository";
import { getWeeklyChallenge } from "@/lib/weekly-challenges";

type ScenarioPracticeProps = {
  scenario?: string | string[];
  session?: string | string[];
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function ScenarioPractice({ scenario, session }: ScenarioPracticeProps) {
  const user = await getCurrentUser();
  const requestedScenarioId = firstValue(scenario);
  const dailyFlow = firstValue(session) === "today";
  const [catalog, progress, dailySource] = await Promise.all([
    getPracticeCatalog(user?.id ?? null),
    user ? getPracticeProgress(user.id) : Promise.resolve(emptyPracticeProgress),
    dailyFlow ? getDailySessionSource(user?.id ?? null) : Promise.resolve(null),
  ]);
  const vocabulary = await listPracticeVocabulary(10, user?.id ?? null, catalog.hasVip);
  const weeklyChallenge = getWeeklyChallenge();
  const initialScenarioId = catalog.scenarios.some((item) => item.id === requestedScenarioId)
    ? requestedScenarioId ?? null
    : null;
  const dailyNextStep = !dailySource
    ? null
    : dailySource.gameCompletedToday
      ? { href: "/#today-summary", title: "Tổng kết phiên 10 phút" }
      : dailySource.game;

  return (
    <main className="learner-dashboard practice-dashboard listening-scenario-page">
      <div className="practice-dashboard-frame">
        <WorkPracticeHub
          authenticated={Boolean(user)}
          dailyFlow={dailyFlow}
          dailyNextStep={dailyNextStep}
          initialProgress={progress}
          initialScenarioId={initialScenarioId}
          overviewHeader={
            <div className="listening-mode-shell">
              <ListeningModeSwitcher activeMode="scenario" />
              <ListeningPerformanceSummary
                authenticated={Boolean(user)}
                initialScenarioPerformance={{
                  correctAnswers: progress.correctAnswers ?? 0,
                  totalQuestions: progress.totalQuestions ?? 0,
                  totalReactionMs: progress.totalReactionMs ?? 0,
                  reactionQuestions: progress.reactionQuestions ?? 0,
                }}
              />
            </div>
          }
          hasVip={catalog.hasVip}
          industries={catalog.industries}
          scenarios={catalog.scenarios}
          vocabulary={vocabulary}
          weeklyChallenge={weeklyChallenge}
        />
      </div>
    </main>
  );
}
