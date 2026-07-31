import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-session";
import { markLessonOpened } from "@/lib/progress-repository";
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
  if (typeof data.courseSlug !== "string" || typeof data.lessonSlug !== "string"
    || data.courseSlug.length > 160 || data.lessonSlug.length > 160
    || !slugPattern.test(data.courseSlug) || !slugPattern.test(data.lessonSlug)) {
    return NextResponse.json({ error: "Invalid lesson" }, { status: 400 });
  }

  const recorded = await markLessonOpened(user.id, data.courseSlug, data.lessonSlug);
  return recorded ? new NextResponse(null, { status: 204 }) : NextResponse.json({ error: "Lesson not found or locked" }, { status: 404 });
}
