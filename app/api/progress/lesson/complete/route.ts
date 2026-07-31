import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-session";
import { safeReturnTo } from "@/lib/auth-validation";
import { completeLesson } from "@/lib/progress-repository";
import { authRedirectUrl, formString, isSameOriginRequest } from "@/lib/request-security";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const formData = await request.formData();
  const returnTo = safeReturnTo(formString(formData, "returnTo"), "/courses");
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(authRedirectUrl(request, "/login", { error: "required", returnTo }), 303);

  const courseSlug = formString(formData, "courseSlug", 160);
  const lessonSlug = formString(formData, "lessonSlug", 160);
  if (!slugPattern.test(courseSlug) || !slugPattern.test(lessonSlug)) return NextResponse.json({ error: "Invalid lesson" }, { status: 400 });

  const completed = await completeLesson(user.id, courseSlug, lessonSlug);
  if (!completed) return NextResponse.json({ error: "Lesson not found or locked" }, { status: 403 });
  return NextResponse.redirect(new URL(returnTo, request.url), 303);
}
