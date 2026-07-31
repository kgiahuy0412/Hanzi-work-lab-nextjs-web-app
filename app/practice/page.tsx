import type { Metadata } from "next";
import { WorkPracticeHub } from "@/components/work-practice-hub";
import { getCurrentUser } from "@/lib/auth-session";
import { listPracticeVocabulary } from "@/lib/lesson-repository";
import { getPracticeCatalog } from "@/lib/practice-repository";
import { getWeeklyChallenge } from "@/lib/weekly-challenges";

export const metadata: Metadata = {
  title: "Kho ca làm",
  description: "Luyện tiếng Trung qua các tình huống thật tại nơi làm việc.",
};

export default async function PracticePage() {
  const user = await getCurrentUser();
  const catalog = await getPracticeCatalog(user?.id ?? null);
  const vocabulary = await listPracticeVocabulary(10, user?.id ?? null, catalog.hasVip);
  const weeklyChallenge = getWeeklyChallenge();
  return (
    <main className="learner-dashboard practice-dashboard">
      <div className="practice-dashboard-frame">
        <WorkPracticeHub
          authenticated={Boolean(user)}
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
