import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-session";
import { recordPracticeAttempt } from "@/lib/activity-progress-repository";
import { getPracticeCatalog } from "@/lib/practice-repository";
import { isSameOriginRequest } from "@/lib/request-security";

const scenarioIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const data = body && typeof body === "object" ? body as Record<string, unknown> : {};
  if (typeof data.scenarioId !== "string" || data.scenarioId.length > 120 || !scenarioIdPattern.test(data.scenarioId)
    || !Number.isInteger(data.correctAnswers) || !Number.isInteger(data.totalQuestions)) {
    return NextResponse.json({ error: "Invalid attempt" }, { status: 400 });
  }

  const catalog = await getPracticeCatalog(user.id);
  const scenario = catalog.scenarios.find((item) => item.id === data.scenarioId);
  const totalQuestions = data.totalQuestions as number;
  const correctAnswers = data.correctAnswers as number;
  if (!scenario || scenario.locked || !scenario.exercises
    || totalQuestions !== scenario.exercises.length
    || correctAnswers < 0 || correctAnswers > totalQuestions) {
    return NextResponse.json({ error: "Scenario not found or locked" }, { status: 403 });
  }

  const progress = await recordPracticeAttempt({
    userId: user.id,
    scenarioId: scenario.id,
    industry: scenario.industry,
    correctAnswers,
    totalQuestions,
  });
  return NextResponse.json({ saved: true, progress });
}
