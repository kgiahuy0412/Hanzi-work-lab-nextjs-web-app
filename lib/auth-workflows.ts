import "server-only";
import { sendAuthLinkEmail } from "./auth-email.ts";
import { issueAuthToken, type AuthTokenPurpose } from "./auth-token-service.ts";

type EmailUser = { id: string; email: string; displayName: string };

export async function sendAuthLink(user: EmailUser, purpose: AuthTokenPurpose): Promise<"brevo" | "console"> {
  const issued = await issueAuthToken(user.id, purpose);
  return sendAuthLinkEmail(user, purpose, issued);
}
