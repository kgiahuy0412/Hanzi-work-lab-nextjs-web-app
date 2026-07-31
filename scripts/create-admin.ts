import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { eq } from "drizzle-orm";
import { closeDb, getDb } from "../db/index.ts";
import { authSessions, users } from "../db/schema.ts";
import { hashPassword } from "../lib/auth-crypto.ts";
import { normalizeEmail, validateEmail, validatePassword } from "../lib/auth-validation.ts";

const localEnvPath = resolve(process.cwd(), ".env.local");
if (existsSync(localEnvPath)) process.loadEnvFile(localEnvPath);

async function createAdmin() {
  const email = normalizeEmail(process.env.ADMIN_EMAIL ?? "");
  const password = process.env.ADMIN_PASSWORD ?? "";
  const displayName = (process.env.ADMIN_DISPLAY_NAME ?? "Quản trị viên HanziWork").trim().slice(0, 120);

  if (!validateEmail(email)) throw new Error("ADMIN_EMAIL chưa hợp lệ.");
  if (!validatePassword(password)) throw new Error("ADMIN_PASSWORD phải có từ 10 đến 128 ký tự.");
  if (displayName.length < 2) throw new Error("ADMIN_DISPLAY_NAME phải có ít nhất 2 ký tự.");

  const passwordHash = await hashPassword(password);
  const db = getDb();
  await db.transaction(async (tx) => {
    const existing = await tx.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existing[0]) {
      await tx.update(users).set({ displayName, passwordHash, role: "admin", isActive: true, emailVerifiedAt: new Date(), updatedAt: new Date() }).where(eq(users.id, existing[0].id));
      await tx.delete(authSessions).where(eq(authSessions.userId, existing[0].id));
      return;
    }

    await tx.insert(users).values({ email, displayName, passwordHash, role: "admin", isActive: true, emailVerifiedAt: new Date() });
  });

  console.log(`Đã tạo/cập nhật tài khoản admin: ${email}`);
}

createAdmin().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}).finally(closeDb);
