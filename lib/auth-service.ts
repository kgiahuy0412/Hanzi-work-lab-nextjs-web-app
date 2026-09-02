import "server-only";
import { eq } from "drizzle-orm";
import { readDb, writeDb } from "../db/index.ts";
import { users } from "../db/schema.ts";
import { hashPassword, verifyPassword } from "./auth-crypto.ts";
import type { RegistrationInput } from "./auth-validation.ts";

export type UserRole = typeof users.$inferSelect.role;

export type AuthenticatedUser = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: UserRole;
  emailVerified: boolean;
  unreadNotificationCount: number;
  createdAt: Date;
};

function toAuthenticatedUser(user: typeof users.$inferSelect): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName ?? user.email,
    avatarUrl: user.avatarUrl,
    role: user.role,
    emailVerified: Boolean(user.emailVerifiedAt),
    unreadNotificationCount: 0,
    createdAt: user.createdAt,
  };
}

export async function registerLearner(input: RegistrationInput): Promise<{ user?: AuthenticatedUser; duplicate?: true }> {
  const passwordHash = await hashPassword(input.password);
  const inserted = await writeDb((db) => db
    .insert(users)
    .values({
      displayName: input.displayName,
      email: input.email,
      passwordHash,
      role: "learner",
    })
    .onConflictDoNothing({ target: users.email })
    .returning());

  const user = inserted[0];
  return user ? { user: toAuthenticatedUser(user) } : { duplicate: true };
}

export async function authenticateWithPassword(email: string, password: string): Promise<AuthenticatedUser | null> {
  const rows = await readDb((db) => db.select().from(users).where(eq(users.email, email)).limit(1));
  const user = rows[0];

  if (!user?.passwordHash) {
    await hashPassword(password);
    return null;
  }

  const passwordValid = await verifyPassword(password, user.passwordHash);
  if (!passwordValid || !user.isActive) return null;
  return toAuthenticatedUser(user);
}

export async function changePassword(userId: string, currentPassword: string, nextPassword: string): Promise<boolean> {
  const rows = await readDb((db) => db.select({ passwordHash: users.passwordHash, isActive: users.isActive }).from(users).where(eq(users.id, userId)).limit(1));
  const user = rows[0];
  if (!user?.passwordHash || !user.isActive || !await verifyPassword(currentPassword, user.passwordHash)) return false;

  const passwordHash = await hashPassword(nextPassword);
  await writeDb((db) => db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, userId)));
  return true;
}

export async function findActiveUserByEmail(email: string): Promise<AuthenticatedUser | null> {
  const rows = await readDb((db) => db.select().from(users).where(eq(users.email, email)).limit(1));
  const user = rows[0];
  return user?.isActive ? toAuthenticatedUser(user) : null;
}
