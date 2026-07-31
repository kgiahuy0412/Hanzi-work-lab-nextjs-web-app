import { and, eq, gt, isNull, lte, or } from "drizzle-orm";
import { readDb } from "../db/index.ts";
import type { Database } from "../db/index.ts";
import { subscriptions } from "../db/schema.ts";
import type { LessonAccess } from "./content-types.ts";

export async function getLessonAccess({
  isFree,
  userId,
  database,
}: {
  isFree: boolean;
  userId: string | null;
  database?: Database;
}): Promise<LessonAccess> {
  if (isFree) return { allowed: true, source: "free" };
  if (!userId || !process.env.DATABASE_URL) return { allowed: false, source: "vip_required" };

  const allowed = await hasActiveVipAccess(userId, database);
  return allowed
    ? { allowed: true, source: "vip" }
    : { allowed: false, source: "vip_required" };
}

export async function hasActiveVipAccess(userId: string, database?: Database): Promise<boolean> {
  if (!process.env.DATABASE_URL) return false;

  const now = new Date();
  const query = (db: Database) => db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(and(
      eq(subscriptions.userId, userId),
      eq(subscriptions.status, "active"),
      or(isNull(subscriptions.startsAt), lte(subscriptions.startsAt, now)),
      or(isNull(subscriptions.endsAt), gt(subscriptions.endsAt, now)),
    ))
    .limit(1);
  const [activeSubscription] = database ? await query(database) : await readDb(query);

  return Boolean(activeSubscription);
}
