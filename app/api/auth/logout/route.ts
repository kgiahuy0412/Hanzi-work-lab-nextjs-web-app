import { NextResponse } from "next/server";
import { recordAuthEvent } from "@/lib/auth-audit";
import { sessionCookieName, deleteSession, getCurrentUser, secureAuthCookiesEnabled } from "@/lib/auth-session";
import { safeReturnTo } from "@/lib/auth-validation";
import { formString, isSameOriginRequest } from "@/lib/request-security";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const cookieName = sessionCookieName();
  const user = await getCurrentUser();
  const cookieHeader = request.headers.get("cookie") ?? "";
  const token = cookieHeader
    .split(";")
    .map((part) => part.trim().split("="))
    .find(([name]) => name === cookieName)?.slice(1).join("=");
  await deleteSession(token);
  if (user) await recordAuthEvent({ action: "auth.logout", request, userId: user.id });

  const formData = await request.formData();
  const returnTo = safeReturnTo(formString(formData, "returnTo"));
  const response = NextResponse.redirect(new URL(returnTo, request.url), 303);
  response.cookies.set(cookieName, "", { httpOnly: true, sameSite: "lax", secure: secureAuthCookiesEnabled(), path: "/", maxAge: 0 });
  return response;
}
