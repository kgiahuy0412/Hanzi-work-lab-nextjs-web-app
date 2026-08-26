import { NextResponse } from "next/server";
import { authenticateWithPassword } from "@/lib/auth-service";
import { recordAuthEvent } from "@/lib/auth-audit";
import { consumeAuthRateLimit, clearSuccessfulLoginLimit } from "@/lib/auth-rate-limit";
import { createSession, sessionCookieName, sessionCookieOptions } from "@/lib/auth-session";
import { sendAuthLink } from "@/lib/auth-workflows";
import { normalizeEmail, safeReturnTo, validateEmail, validatePassword } from "@/lib/auth-validation";
import { authRedirectUrl, formString, isSameOriginRequest } from "@/lib/request-security";
import { isPracticeStaffRole } from "@/lib/practice-workflow";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const formData = await request.formData();
  const mode = formString(formData, "mode", 20) === "admin" ? "admin" : "learner";
  const loginPath = mode === "admin" ? "/admin/login" : "/login";
  const returnTo = safeReturnTo(formString(formData, "returnTo"), mode === "admin" ? "/admin" : "/");
  const email = normalizeEmail(formString(formData, "email", 255));
  const password = formString(formData, "password", 128);

  const rateLimit = await consumeAuthRateLimit(request, "login", email || "invalid");
  if (!rateLimit.allowed) {
    await recordAuthEvent({ action: "auth.login.rate_limited", request, identifier: email, metadata: { mode } });
    const response = NextResponse.redirect(authRedirectUrl(request, loginPath, { error: "rate_limited", returnTo }), 303);
    response.headers.set("Retry-After", String(rateLimit.retryAfterSeconds));
    return response;
  }

  if (!validateEmail(email) || !validatePassword(password)) {
    await recordAuthEvent({ action: "auth.login.failed", request, identifier: email, metadata: { mode, reason: "invalid_input" } });
    return NextResponse.redirect(authRedirectUrl(request, loginPath, { error: "invalid_credentials", returnTo }), 303);
  }

  const user = await authenticateWithPassword(email, password);
  if (!user || (mode === "admin" && !isPracticeStaffRole(user.role))) {
    await recordAuthEvent({ action: "auth.login.failed", request, identifier: email, userId: user?.id, metadata: { mode, reason: user ? "role" : "credentials" } });
    return NextResponse.redirect(authRedirectUrl(request, loginPath, { error: "invalid_credentials", returnTo }), 303);
  }

  if (!user.emailVerified) {
    let delivery: "brevo" | "console" | "failed" = "failed";
    try {
      delivery = await sendAuthLink(user, "verify_email");
    } catch (error) {
      console.error("Không thể gửi email xác minh.", error instanceof Error ? error.message : "unknown");
    }
    await recordAuthEvent({ action: "auth.email_verification.requested", request, identifier: email, userId: user.id, metadata: { delivery } });
    const url = new URL("/verify-email", request.url);
    url.searchParams.set("required", "1");
    if (delivery === "failed") url.searchParams.set("error", "delivery_failed");
    return NextResponse.redirect(url, 303);
  }

  const session = await createSession(user.id);
  await Promise.all([
    clearSuccessfulLoginLimit(request, email),
    recordAuthEvent({ action: "auth.login.succeeded", request, identifier: email, userId: user.id, metadata: { mode } }),
  ]);
  const staffReturnTo = mode === "admin" && user.role !== "admin" && returnTo === "/admin" ? "/admin/practice" : returnTo;
  const response = NextResponse.redirect(new URL(staffReturnTo, request.url), 303);
  response.cookies.set(sessionCookieName(), session.token, sessionCookieOptions(session.expiresAt));
  return response;
}
