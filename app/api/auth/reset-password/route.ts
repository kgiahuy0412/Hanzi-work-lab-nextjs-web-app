import { NextResponse } from "next/server";
import { recordAuthEvent } from "@/lib/auth-audit";
import { sendPasswordChangedEmail } from "@/lib/auth-email";
import { consumeAuthRateLimit } from "@/lib/auth-rate-limit";
import { sessionCookieName, secureAuthCookiesEnabled } from "@/lib/auth-session";
import { resetPasswordWithToken } from "@/lib/auth-token-service";
import { validateAuthToken, validatePassword } from "@/lib/auth-validation";
import { formString, isSameOriginRequest } from "@/lib/request-security";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const formData = await request.formData();
  const token = formString(formData, "token", 128);
  const password = formString(formData, "password", 128);
  const confirmPassword = formString(formData, "confirmPassword", 128);
  const tokenUrl = encodeURIComponent(token);
  const rateLimit = await consumeAuthRateLimit(request, "reset_password", token || "invalid");
  if (!rateLimit.allowed) {
    await recordAuthEvent({ action: "auth.password_reset.rate_limited", request });
    const response = NextResponse.redirect(new URL(`/reset-password?token=${tokenUrl}&error=rate_limited`, request.url), 303);
    response.headers.set("Retry-After", String(rateLimit.retryAfterSeconds));
    return response;
  }
  if (!validateAuthToken(token)) return NextResponse.redirect(new URL("/reset-password?error=invalid_or_expired", request.url), 303);
  if (!validatePassword(password)) return NextResponse.redirect(new URL(`/reset-password?token=${tokenUrl}&error=invalid_password`, request.url), 303);
  if (password !== confirmPassword) return NextResponse.redirect(new URL(`/reset-password?token=${tokenUrl}&error=password_mismatch`, request.url), 303);

  const user = await resetPasswordWithToken(token, password);
  if (!user) {
    await recordAuthEvent({ action: "auth.password_reset.failed", request });
    return NextResponse.redirect(new URL("/reset-password?error=invalid_or_expired", request.url), 303);
  }

  let notification: "brevo" | "console" | "failed" = "failed";
  try {
    notification = await sendPasswordChangedEmail(user);
  } catch (error) {
    console.error("Không thể gửi email báo đổi mật khẩu.", error instanceof Error ? error.message : "unknown");
  }
  await recordAuthEvent({ action: "auth.password_reset.succeeded", request, userId: user.id, metadata: { notification } });
  const response = NextResponse.redirect(new URL("/login?error=password_reset", request.url), 303);
  response.cookies.set(sessionCookieName(), "", { httpOnly: true, sameSite: "lax", secure: secureAuthCookiesEnabled(), path: "/", maxAge: 0 });
  return response;
}
