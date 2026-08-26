import { NextResponse } from "next/server";
import { recordAuthEvent } from "@/lib/auth-audit";
import { sendPasswordChangedEmail } from "@/lib/auth-email";
import { changePassword } from "@/lib/auth-service";
import { getCurrentUser, revokeUserSessions, sessionCookieName, secureAuthCookiesEnabled } from "@/lib/auth-session";
import { validatePassword } from "@/lib/auth-validation";
import { authRedirectUrl, formString, isSameOriginRequest } from "@/lib/request-security";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(authRedirectUrl(request, "/login", { error: "required", returnTo: "/account" }), 303);

  const formData = await request.formData();
  const currentPassword = formString(formData, "currentPassword", 128);
  const nextPassword = formString(formData, "nextPassword", 128);
  const confirmPassword = formString(formData, "confirmPassword", 128);
  if (!validatePassword(nextPassword)) return NextResponse.redirect(authRedirectUrl(request, "/account", { error: "invalid_password" }), 303);
  if (nextPassword !== confirmPassword) return NextResponse.redirect(authRedirectUrl(request, "/account", { error: "password_mismatch" }), 303);

  const changed = await changePassword(user.id, currentPassword, nextPassword);
  if (!changed) {
    await recordAuthEvent({ action: "auth.password_change.failed", request, userId: user.id });
    return NextResponse.redirect(authRedirectUrl(request, "/account", { error: "invalid_current_password" }), 303);
  }

  await revokeUserSessions(user.id);
  let notification: "brevo" | "console" | "failed" = "failed";
  try {
    notification = await sendPasswordChangedEmail(user);
  } catch (error) {
    console.error("Không thể gửi email báo đổi mật khẩu.", error instanceof Error ? error.message : "unknown");
  }
  await recordAuthEvent({ action: "auth.password_change.succeeded", request, userId: user.id, metadata: { notification } });
  const response = NextResponse.redirect(authRedirectUrl(request, "/login", { error: "password_changed" }), 303);
  response.cookies.set(sessionCookieName(), "", { httpOnly: true, sameSite: "lax", secure: secureAuthCookiesEnabled(), path: "/", maxAge: 0 });
  return response;
}
