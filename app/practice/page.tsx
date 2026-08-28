import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Nghe & phản xạ",
  description: "Luyện tiếng Trung qua các tình huống thật tại nơi làm việc.",
};

type LegacyPracticeSearchParams = {
  scenario?: string | string[];
  session?: string | string[];
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function PracticePage({
  searchParams = Promise.resolve({}),
}: {
  searchParams?: Promise<LegacyPracticeSearchParams>;
}) {
  const params = await searchParams;
  const destination = new URLSearchParams({ mode: "scenario" });
  const scenario = firstValue(params.scenario);
  const session = firstValue(params.session);
  if (scenario) destination.set("scenario", scenario);
  if (session) destination.set("session", session);
  redirect(`/listening?${destination.toString()}`);
}
