import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-session";
import { recordVocabularyReview } from "@/lib/progress-repository";
import { isSameOriginRequest } from "@/lib/request-security";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

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
  if (typeof data.vocabularySlug !== "string" || data.vocabularySlug.length > 180
    || !slugPattern.test(data.vocabularySlug) || typeof data.remembered !== "boolean") {
    return NextResponse.json({ error: "Invalid review" }, { status: 400 });
  }

  const recorded = await recordVocabularyReview(user.id, data.vocabularySlug, data.remembered);
  return recorded ? NextResponse.json({ saved: true }) : NextResponse.json({ error: "Vocabulary not found" }, { status: 404 });
}
