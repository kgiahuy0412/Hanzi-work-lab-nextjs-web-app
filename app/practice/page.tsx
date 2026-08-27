import type { Metadata } from "next";
import { WorkPracticeHub } from "@/components/work-practice-hub";
import { emptyPracticeProgress } from "@/lib/activity-progress";
import { getPracticeProgress } from "@/lib/activity-progress-repository";
import { getCurrentUser } from "@/lib/auth-session";
import { getDailySessionSource } from "@/lib/daily-session-repository";
import { listPracticeVocabulary } from "@/lib/lesson-repository";
import { getPracticeCatalog } from "@/lib/practice-repository";
import { getWeeklyChallenge } from "@/lib/weekly-challenges";

export const metadata: Metadata = {
  title: "Kho ca làm",
  description: "Luyện tiếng Trung qua các tình huống thật tại nơi làm việc.",
};

export default async function PracticePage({
  searchParams,
}: {
  searchParams: Promise<{ scenario?: string | string[]; session?: string | string[] }>;
}) {
  const [{ scenario, session }, user] = await Promise.all([searchParams, getCurrentUser()]);
  const requestedScenarioId = Array.isArray(scenario) ? scenario[0] : scenario;
  const dailyFlow = (Array.isArray(session) ? session[0] : session) === "today";
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
    <main className="learner-dashboard practice-dashboard">
      <div className="practice-dashboard-frame">
        <WorkPracticeHub
          authenticated={Boolean(user)}
          dailyFlow={dailyFlow}
          dailyNextStep={dailyNextStep}
          initialProgress={progress}
          initialScenarioId={initialScenarioId}
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
