import "server-only";
import type { AuthTokenPurpose, IssuedAuthToken } from "./auth-token-service.ts";
import { hashPrivateIdentifier } from "./auth-crypto.ts";

type AuthEmailUser = { email: string; displayName: string };

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/gu, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;",
  })[character] ?? character);
}

function appBaseUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!configuredUrl && process.env.NODE_ENV === "production") throw new Error("NEXT_PUBLIC_APP_URL chưa được cấu hình.");
  const value = configuredUrl ?? "http://localhost:3000";
  const url = new URL(value);
  if (!/^https?:$/u.test(url.protocol)) throw new Error("NEXT_PUBLIC_APP_URL phải dùng http hoặc https.");
  return url.origin;
}

function authLink(purpose: AuthTokenPurpose, token: string): string {
  const pathname = purpose === "verify_email" ? "/verify-email" : "/reset-password";
  const url = new URL(pathname, appBaseUrl());
  url.searchParams.set("token", token);
  return url.toString();
}

async function deliverEmail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
  idempotencyKey: string;
  developmentLink?: string;
}): Promise<"resend" | "console"> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    if (process.env.NODE_ENV === "production") throw new Error("RESEND_API_KEY và RESEND_FROM_EMAIL chưa được cấu hình.");
    console.info(`[HanziWork email dev] ${input.subject}: ${input.to}${input.developmentLink ? ` -> ${input.developmentLink}` : ""}`);
    return "console";
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": input.idempotencyKey,
      "User-Agent": "hanziwork/0.1",
    },
    body: JSON.stringify({ from, to: [input.to], subject: input.subject, text: input.text, html: input.html }),
  });
  if (!response.ok) throw new Error(`Resend trả về HTTP ${response.status}.`);
  return "resend";
}

export async function sendAuthLinkEmail(user: AuthEmailUser, purpose: AuthTokenPurpose, issued: IssuedAuthToken): Promise<"resend" | "console"> {
  const link = authLink(purpose, issued.token);
  const verification = purpose === "verify_email";
  const title = verification ? "Xác minh email HanziWork" : "Đặt lại mật khẩu HanziWork";
  const instruction = verification
    ? "Xác nhận địa chỉ email để kích hoạt tài khoản và bắt đầu lưu tiến độ học."
    : "Mở liên kết để đặt mật khẩu mới. Liên kết chỉ dùng một lần và hết hạn sau 30 phút.";
  const button = verification ? "Xác minh email" : "Đặt lại mật khẩu";
  const safeName = escapeHtml(user.displayName);
  const safeLink = escapeHtml(link);
  return deliverEmail({
    to: user.email,
    subject: title,
    text: `Xin chào ${user.displayName},\n\n${instruction}\n\n${link}\n\nNếu bạn không thực hiện yêu cầu này, hãy bỏ qua email.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#173c33"><h1 style="font-size:24px">${title}</h1><p>Xin chào ${safeName},</p><p style="line-height:1.6">${instruction}</p><p style="margin:28px 0"><a href="${safeLink}" style="display:inline-block;padding:13px 20px;border-radius:10px;background:#176b5b;color:#fff;text-decoration:none;font-weight:700">${button}</a></p><p style="font-size:13px;color:#65766f">Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email.</p></div>`,
    idempotencyKey: `${purpose}/${issued.id}`,
    developmentLink: link,
  });
}

export async function sendPasswordChangedEmail(user: AuthEmailUser): Promise<"resend" | "console"> {
  const subject = "Mật khẩu HanziWork đã được thay đổi";
  const emailKey = await hashPrivateIdentifier(user.email);
  return deliverEmail({
    to: user.email,
    subject,
    text: `Xin chào ${user.displayName},\n\nMật khẩu HanziWork của bạn vừa được thay đổi. Mọi phiên đăng nhập cũ đã bị thu hồi. Nếu đây không phải là bạn, hãy liên hệ hỗ trợ ngay.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#173c33"><h1 style="font-size:24px">${subject}</h1><p>Xin chào ${escapeHtml(user.displayName)},</p><p style="line-height:1.6">Mật khẩu của bạn vừa được thay đổi. Mọi phiên đăng nhập cũ đã bị thu hồi.</p><p style="line-height:1.6">Nếu đây không phải là bạn, hãy liên hệ hỗ trợ ngay.</p></div>`,
    idempotencyKey: `password-changed/${emailKey}/${Date.now()}`,
  });
}
