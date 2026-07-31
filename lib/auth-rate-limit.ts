import "server-only";
import { and, eq, sql } from "drizzle-orm";
import type { Database } from "../db/index.ts";
import { writeDb } from "../db/index.ts";
import { authRateLimits } from "../db/schema.ts";
import { hashPrivateIdentifier } from "./auth-crypto.ts";
import { clientAddress } from "./request-security.ts";

export type AuthRateLimitAction = "login" | "register" | "forgot_password" | "resend_verification" | "verify_email" | "reset_password";

type RateLimitPolicy = {
  identifierAttempts: number;
  ipAttempts: number;
  windowMinutes: number;
  blockMinutes: number;
};

const policies: Record<AuthRateLimitAction, RateLimitPolicy> = {
  login: { identifierAttempts: 8, ipAttempts: 40, windowMinutes: 15, blockMinutes: 15 },
  register: { identifierAttempts: 3, ipAttempts: 10, windowMinutes: 60, blockMinutes: 60 },
  forgot_password: { identifierAttempts: 3, ipAttempts: 20, windowMinutes: 15, blockMinutes: 30 },
  resend_verification: { identifierAttempts: 3, ipAttempts: 20, windowMinutes: 15, blockMinutes: 30 },
  verify_email: { identifierAttempts: 10, ipAttempts: 30, windowMinutes: 15, blockMinutes: 15 },
  reset_password: { identifierAttempts: 10, ipAttempts: 30, windowMinutes: 15, blockMinutes: 15 },
};

type RateLimitResult = { allowed: boolean; retryAfterSeconds: number };

async function consumeKey(
  db: Database,
  action: string,
  keyHash: string,
  maxAttempts: number,
  policy: RateLimitPolicy,
  now: Date,
): Promise<RateLimitResult> {
  const rows = await db.insert(authRateLimits).values({
    action,
    keyHash,
    attempts: 1,
    windowStartedAt: now,
    updatedAt: now,
  }).onConflictDoUpdate({
    target: [authRateLimits.action, authRateLimits.keyHash],
    set: {
      attempts: sql<number>`case when ${authRateLimits.windowStartedAt} <= now() - (${policy.windowMinutes} * interval '1 minute') then 1 else ${authRateLimits.attempts} + 1 end`,
      windowStartedAt: sql<Date>`case when ${authRateLimits.windowStartedAt} <= now() - (${policy.windowMinutes} * interval '1 minute') then now() else ${authRateLimits.windowStartedAt} end`,
      blockedUntil: sql<Date | null>`case
        when ${authRateLimits.blockedUntil} > now() then ${authRateLimits.blockedUntil}
        when ${authRateLimits.windowStartedAt} <= now() - (${policy.windowMinutes} * interval '1 minute') then null
        when ${authRateLimits.attempts} + 1 > ${maxAttempts} then now() + (${policy.blockMinutes} * interval '1 minute')
        else null
      end`,
      updatedAt: now,
    },
  }).returning({ blockedUntil: authRateLimits.blockedUntil });

  const blockedUntil = rows[0]?.blockedUntil;
  if (!blockedUntil || blockedUntil <= now) return { allowed: true, retryAfterSeconds: 0 };
  return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((blockedUntil.getTime() - now.getTime()) / 1_000)) };
}

async function keyHash(action: AuthRateLimitAction, scope: "identifier" | "ip", value: string): Promise<string> {
  return hashPrivateIdentifier(`${action}:${scope}:${value}`);
}

export async function consumeAuthRateLimit(request: Request, action: AuthRateLimitAction, identifier?: string): Promise<RateLimitResult> {
  const policy = policies[action];
  const address = clientAddress(request);
  const [ipHash, identifierHash] = await Promise.all([
    keyHash(action, "ip", address),
    identifier ? keyHash(action, "identifier", `${identifier}|${address}`) : Promise.resolve(null),
  ]);
  const now = new Date();

  return writeDb(async (db) => {
    const ipResult = await consumeKey(db, `${action}:ip`, ipHash, policy.ipAttempts, policy, now);
    if (!ipResult.allowed || !identifierHash) return ipResult;
    return consumeKey(db, `${action}:identifier`, identifierHash, policy.identifierAttempts, policy, now);
  });
}

export async function clearSuccessfulLoginLimit(request: Request, identifier: string): Promise<void> {
  const hash = await keyHash("login", "identifier", `${identifier}|${clientAddress(request)}`);
  await writeDb((db) => db.delete(authRateLimits).where(and(
    eq(authRateLimits.action, "login:identifier"),
    eq(authRateLimits.keyHash, hash),
  )));
}
