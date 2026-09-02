import "server-only";
import { cache } from "react";
import { and, eq, gt, isNotNull, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { readDb, writeDb } from "../db/index.ts";
import { authSessions, notifications, users } from "../db/schema.ts";
import { createSessionToken, hashSessionToken } from "./auth-crypto.ts";
import type { AuthenticatedUser } from "./auth-service.ts";

const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

export type NewSession = {
  token: string;
  expiresAt: Date;
};

export function secureAuthCookiesEnabled(): boolean {
  const override = process.env.AUTH_COOKIE_SECURE?.trim();
  if (override === "1" || override === "true") return true;
  if (override === "0" || override === "false") return false;
  return process.env.NODE_ENV === "production";
}

export function sessionCookieName(): string {
  return secureAuthCookiesEnabled() ? "__Host-hanziwork-session" : "hanziwork_session";
}

export function sessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: secureAuthCookiesEnabled(),
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt,
    maxAge: SESSION_TTL_SECONDS,
  };
}

export async function createSession(userId: string): Promise<NewSession> {
  const token = createSessionToken();
  const tokenHash = await hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1_000);
  await writeDb((db) => db.insert(authSessions).values({ userId, tokenHash, expiresAt }));
  return { token, expiresAt };
}

export async function deleteSession(token: string | undefined): Promise<void> {
  if (!token) return;
  const tokenHash = await hashSessionToken(token);
  await writeDb((db) => db.delete(authSessions).where(eq(authSessions.tokenHash, tokenHash)));
}

export async function revokeUserSessions(userId: string): Promise<void> {
  await writeDb((db) => db.delete(authSessions).where(eq(authSessions.userId, userId)));
}

async function readCurrentUser(): Promise<AuthenticatedUser | null> {
  if (!process.env.DATABASE_URL) return null;
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName())?.value;
  if (!token) return null;

  const tokenHash = await hashSessionToken(token);
  const rows = await readDb((db) => db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      role: users.role,
      emailVerifiedAt: users.emailVerifiedAt,
      createdAt: users.createdAt,
      unreadNotificationCount: sql<number>`(
        select count(*)::int
        from ${notifications}
        where ${notifications.userId} = ${users.id}
          and ${notifications.readAt} is null
      )`,
    })
    .from(authSessions)
    .innerJoin(users, eq(authSessions.userId, users.id))
    .where(and(
      eq(authSessions.tokenHash, tokenHash),
      gt(authSessions.expiresAt, new Date()),
      eq(users.isActive, true),
      isNotNull(users.emailVerifiedAt),
    ))
    .limit(1));

  const user = rows[0];
  return user ? {
    id: user.id,
    email: user.email,
    displayName: user.displayName ?? user.email,
    avatarUrl: user.avatarUrl,
    role: user.role,
    emailVerified: Boolean(user.emailVerifiedAt),
    unreadNotificationCount: user.unreadNotificationCount,
    createdAt: user.createdAt,
  } : null;
}

export const getCurrentUser = cache(readCurrentUser);
