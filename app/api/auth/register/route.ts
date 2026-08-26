import { NextResponse } from "next/server";
import { recordAuthEvent } from "@/lib/auth-audit";
import { consumeAuthRateLimit } from "@/lib/auth-rate-limit";
import { findActiveUserByEmail, registerLearner } from "@/lib/auth-service";
import { parseRegistrationInput, safeReturnTo } from "@/lib/auth-validation";
import { sendAuthLink } from "@/lib/auth-workflows";
import { authRedirectUrl, formString, isSameOriginRequest } from "@/lib/request-security";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const formData = await request.formData();
  const wantsJson = formString(formData, "responseMode") === "json";
  const returnTo = safeReturnTo(formString(formData, "returnTo"));
  const parsed = parseRegistrationInput({
    displayName: formString(formData, "displayName", 120),
    email: formString(formData, "email", 255),
    password: formString(formData, "password", 128),
    confirmPassword: formString(formData, "confirmPassword", 128),
  });

  if (!parsed.data) {
    if (wantsJson) return NextResponse.json({ error: parsed.error, ok: false }, { status: 400 });
    return NextResponse.redirect(authRedirectUrl(request, "/register", { error: parsed.error, returnTo }), 303);
  }

  const rateLimit = await consumeAuthRateLimit(request, "register", parsed.data.email);
  if (!rateLimit.allowed) {
    await recordAuthEvent({ action: "auth.register.rate_limited", request, identifier: parsed.data.email });
    if (wantsJson) {
      const response = NextResponse.json({ error: "rate_limited", ok: false }, { status: 429 });
      response.headers.set("Retry-After", String(rateLimit.retryAfterSeconds));
      return response;
    }
    const response = NextResponse.redirect(authRedirectUrl(request, "/register", { error: "rate_limited", returnTo }), 303);
    response.headers.set("Retry-After", String(rateLimit.retryAfterSeconds));
    return response;
  }

  const result = await registerLearner(parsed.data);
  const user = result.user ?? await findActiveUserByEmail(parsed.data.email);
  let delivery: "brevo" | "console" | "failed" | "not_needed" = "not_needed";
  if (user && !user.emailVerified) {
    try {
      delivery = await sendAuthLink(user, "verify_email");
    } catch (error) {
      delivery = "failed";
      console.error("Không thể gửi email xác minh.", error instanceof Error ? error.message : "unknown");
    }
  }

  await recordAuthEvent({
    action: result.user ? "auth.register.succeeded" : "auth.register.existing_email",
    request,
    identifier: parsed.data.email,
    userId: user?.id,
    metadata: { delivery },
  });
  const url = new URL("/verify-email", request.url);
  url.searchParams.set("sent", "1");
  if (delivery === "failed") url.searchParams.set("error", "delivery_failed");
  if (wantsJson) return NextResponse.json({ ok: true, redirectTo: `${url.pathname}${url.search}` });
  return NextResponse.redirect(url, 303);
}
