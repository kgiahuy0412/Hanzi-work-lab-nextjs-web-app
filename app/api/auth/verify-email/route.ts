import { NextResponse } from "next/server";
import { recordAuthEvent } from "@/lib/auth-audit";
import { consumeAuthRateLimit } from "@/lib/auth-rate-limit";
import { createSession, sessionCookieName, sessionCookieOptions } from "@/lib/auth-session";
import { verifyEmailToken } from "@/lib/auth-token-service";
import { validateAuthToken } from "@/lib/auth-validation";
import { formString, isSameOriginRequest } from "@/lib/request-security";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const formData = await request.formData();
  const token = formString(formData, "token", 128);
  const rateLimit = await consumeAuthRateLimit(request, "verify_email", token || "invalid");
  if (!rateLimit.allowed) {
    await recordAuthEvent({ action: "auth.email_verification.rate_limited", request });
    const response = NextResponse.redirect(new URL("/verify-email?error=rate_limited", request.url), 303);
    response.headers.set("Retry-After", String(rateLimit.retryAfterSeconds));
    return response;
  }
  if (!validateAuthToken(token)) return NextResponse.redirect(new URL("/verify-email?error=invalid_or_expired", request.url), 303);

  const user = await verifyEmailToken(token);
  if (!user) {
    await recordAuthEvent({ action: "auth.email_verification.failed", request });
    return NextResponse.redirect(new URL("/verify-email?error=invalid_or_expired", request.url), 303);
  }

  const session = await createSession(user.id);
  await recordAuthEvent({ action: "auth.email_verification.succeeded", request, userId: user.id });
  const response = NextResponse.redirect(new URL("/?verified=1", request.url), 303);
  response.cookies.set(sessionCookieName(), session.token, sessionCookieOptions(session.expiresAt));
  return response;
}
