import type { Metadata } from "next";
import { ListeningModeSwitcher } from "@/components/listening-mode-switcher";
import { ListeningPerformanceSummary } from "@/components/listening-performance-summary";
import { ListeningStudio } from "@/components/listening-studio";
import { getListeningLevel } from "@/lib/listening-content";

export const metadata: Metadata = {
  title: "Nghe & phản xạ",
  description: "Luyện nghe và phản xạ tiếng Trung chủ động cùng Himi Chinese.",
};

type ListeningSearchParams = {
  mode?: string | string[];
  scenario?: string | string[];
  session?: string | string[];
  level?: string | string[];
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ListeningPage({
  searchParams = Promise.resolve({}),
}: {
  searchParams?: Promise<ListeningSearchParams>;
}) {
  const params = await searchParams;
  if (firstValue(params.mode) === "scenario") {
    const { ScenarioPractice } = await import("@/components/scenario-practice");
    return <ScenarioPractice {...params} />;
  }

  const requestedLevel = firstValue(params.level);
  const initialLevelId = requestedLevel && getListeningLevel(requestedLevel) ? requestedLevel : undefined;

  return <ListeningStudio
    initialLevelId={initialLevelId}
    modeSwitcher={
      <>
        <ListeningModeSwitcher activeMode="levels" />
        <ListeningPerformanceSummary />
      </>
    }
  />;
}
