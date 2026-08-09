import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-session";
import { isGameId } from "@/lib/activity-progress";
import { recordGameAttempt } from "@/lib/activity-progress-repository";
import { isSameOriginRequest } from "@/lib/request-security";

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
  if (!isGameId(data.gameId) || !Number.isInteger(data.score)
    || (data.score as number) < 0 || (data.score as number) > 10_000) {
    return NextResponse.json({ error: "Invalid attempt" }, { status: 400 });
  }

  const progress = await recordGameAttempt({
    userId: user.id,
    gameId: data.gameId,
    score: data.score as number,
  });
  return NextResponse.json({ saved: true, progress });
}
