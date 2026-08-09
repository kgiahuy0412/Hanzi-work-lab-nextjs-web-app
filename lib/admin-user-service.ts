import "server-only";

import { asc, count, eq } from "drizzle-orm";
import { readDb, writeDb } from "../db/index.ts";
import { auditLogs, users } from "../db/schema.ts";
import type { MutationResult } from "./admin-content-service.ts";
import type { UserRole } from "./auth-service.ts";

export async function listAdminUsers() {
  return readDb((db) => db.select({
    id: users.id,
    email: users.email,
    displayName: users.displayName,
    role: users.role,
    isActive: users.isActive,
    emailVerifiedAt: users.emailVerifiedAt,
    createdAt: users.createdAt,
  }).from(users).orderBy(asc(users.createdAt), asc(users.email)));
}

export async function updateUserRole(userId: string, role: UserRole, actorId: string): Promise<MutationResult> {
  return writeDb((db) => db.transaction(async (tx) => {
    const rows = await tx.select({ id: users.id, email: users.email, role: users.role, emailVerifiedAt: users.emailVerifiedAt })
      .from(users).where(eq(users.id, userId)).limit(1);
    const target = rows[0];
    if (!target) return { ok: false, error: "not_found" };
    if (target.id === actorId || (!target.emailVerifiedAt && role !== "learner")) {
      return { ok: false, error: "role_change_forbidden" };
    }
    if (target.role === "admin" && role !== "admin") {
      const adminRows = await tx.select({ value: count() }).from(users).where(eq(users.role, "admin"));
      if ((adminRows[0]?.value ?? 0) <= 1) return { ok: false, error: "role_change_forbidden" };
    }
    await tx.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, userId));
    await tx.insert(auditLogs).values({
      actorId,
      action: "admin.user.role_updated",
      entityType: "user",
      entityId: userId,
      metadata: { email: target.email, fromRole: target.role, toRole: role },
    });
    return { ok: true, id: userId };
  }));
}
