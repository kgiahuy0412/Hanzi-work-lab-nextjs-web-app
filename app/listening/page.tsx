import type { Metadata } from "next";
import { ListeningModeSwitcher } from "@/components/listening-mode-switcher";
import { ListeningStudio } from "@/components/listening-studio";

export const metadata: Metadata = {
  title: "Nghe & phản xạ",
  description: "Luyện nghe và phản xạ tiếng Trung chủ động cùng Himi Chinese.",
};

type ListeningSearchParams = {
  mode?: string | string[];
  scenario?: string | string[];
  session?: string | string[];
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

  return <ListeningStudio modeSwitcher={<ListeningModeSwitcher activeMode="levels" />} />;
}
