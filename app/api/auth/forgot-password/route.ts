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
  const rateLimit = await consumeAuthRateLimit(request, "forgot_password", email || "invalid");
  if (!rateLimit.allowed) {
    await recordAuthEvent({ action: "auth.password_reset.rate_limited", request, identifier: email });
    const response = NextResponse.redirect(new URL("/forgot-password?sent=1", request.url), 303);
    response.headers.set("Retry-After", String(rateLimit.retryAfterSeconds));
    return response;
  }

  let userId: string | undefined;
  let delivery: "brevo" | "console" | "failed" | "not_needed" = "not_needed";
  if (validateEmail(email)) {
    const user = await findActiveUserByEmail(email);
    userId = user?.id;
    if (user) {
      try {
        delivery = await sendAuthLink(user, "reset_password");
      } catch (error) {
        delivery = "failed";
        console.error("Không thể gửi email đặt lại mật khẩu.", error instanceof Error ? error.message : "unknown");
      }
    }
  }

  await recordAuthEvent({ action: "auth.password_reset.requested", request, identifier: email, userId, metadata: { delivery } });
  return NextResponse.redirect(new URL("/forgot-password?sent=1", request.url), 303);
}
