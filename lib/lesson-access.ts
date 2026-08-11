import type { Database } from "../db/index.ts";
import type { LessonAccess } from "./content-types.ts";
import { getActiveVipSubscription } from "./vip-subscription.ts";

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
  return Boolean(await getActiveVipSubscription(userId, database));
}
