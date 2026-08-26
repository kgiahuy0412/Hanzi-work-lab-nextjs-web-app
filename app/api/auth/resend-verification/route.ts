import { NextResponse } from "next/server";
import { recordAuthEvent } from "@/lib/auth-audit";
import { consumeAuthRateLimit } from "@/lib/auth-rate-limit";
import { findActiveUserByEmail } from "@/lib/auth-service";
import { normalizeEmail, validateEmail } from "@/lib/auth-validation";
import { sendAuthLink } from "@/lib/auth-workflows";
import { formString, isSameOriginRequest } from "@/lib/request-security";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const formData = await request.formData();
  const email = normalizeEmail(formString(formData, "email", 255));
  const rateLimit = await consumeAuthRateLimit(request, "resend_verification", email || "invalid");
  if (!rateLimit.allowed) {
    await recordAuthEvent({ action: "auth.email_verification.rate_limited", request, identifier: email });
    const response = NextResponse.redirect(new URL("/verify-email?sent=1", request.url), 303);
    response.headers.set("Retry-After", String(rateLimit.retryAfterSeconds));
    return response;
  }

  let userId: string | undefined;
  let delivery: "brevo" | "console" | "failed" | "not_needed" = "not_needed";
  if (validateEmail(email)) {
    const user = await findActiveUserByEmail(email);
    userId = user?.id;
    if (user && !user.emailVerified) {
      try {
        delivery = await sendAuthLink(user, "verify_email");
      } catch (error) {
        delivery = "failed";
        console.error("Không thể gửi lại email xác minh.", error instanceof Error ? error.message : "unknown");
      }
    }
  }

  await recordAuthEvent({ action: "auth.email_verification.requested", request, identifier: email, userId, metadata: { delivery } });
  return NextResponse.redirect(new URL("/verify-email?sent=1", request.url), 303);
}
