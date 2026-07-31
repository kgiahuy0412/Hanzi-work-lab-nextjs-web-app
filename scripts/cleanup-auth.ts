import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { and, isNotNull, lt, or } from "drizzle-orm";
import { closeDb, getDb } from "../db/index.ts";
import { authRateLimits, authSessions, authTokens } from "../db/schema.ts";

const localEnvPath = resolve(process.cwd(), ".env.local");
if (existsSync(localEnvPath)) process.loadEnvFile(localEnvPath);

async function cleanupAuth() {
  const db = getDb();
  const now = new Date();
  const staleBefore = new Date(now.getTime() - 48 * 60 * 60_000);
  const result = await db.transaction(async (tx) => {
    const sessions = await tx.delete(authSessions).where(lt(authSessions.expiresAt, now)).returning({ id: authSessions.id });
    const tokens = await tx.delete(authTokens).where(or(
      lt(authTokens.expiresAt, now),
      and(isNotNull(authTokens.usedAt), lt(authTokens.usedAt, staleBefore)),
    )).returning({ id: authTokens.id });
    const rateLimits = await tx.delete(authRateLimits).where(lt(authRateLimits.updatedAt, staleBefore)).returning({ keyHash: authRateLimits.keyHash });
    return { sessions: sessions.length, tokens: tokens.length, rateLimits: rateLimits.length };
  });
  console.log(`Đã dọn auth: ${result.sessions} session, ${result.tokens} token, ${result.rateLimits} rate-limit.`);
}

cleanupAuth().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}).finally(closeDb);
