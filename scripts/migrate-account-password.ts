import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { and, eq, isNull } from "drizzle-orm";
import { closeDb, getDb } from "../db/index.ts";
import { authSessions, authTokens, users } from "../db/schema.ts";
import { hashPassword, verifyPassword } from "../lib/auth-crypto.ts";
import { normalizeEmail, validateEmail, validatePassword } from "../lib/auth-validation.ts";

const localEnvPath = resolve(process.cwd(), ".env.local");
if (existsSync(localEnvPath)) process.loadEnvFile(localEnvPath);

const email = normalizeEmail(process.env.MIGRATE_EMAIL ?? "");
const currentPassword = process.env.MIGRATE_CURRENT_PASSWORD ?? "";

if (!validateEmail(email)) throw new Error("MIGRATE_EMAIL chưa hợp lệ.");
if (!validatePassword(currentPassword)) {
  throw new Error("MIGRATE_CURRENT_PASSWORD phải có từ 10 đến 128 ký tự.");
}

const db = getDb();

try {
  const result = await db.transaction(async (tx) => {
    const rows = await tx.select({
      id: users.id,
      passwordHash: users.passwordHash,
    }).from(users).where(eq(users.email, email)).limit(1).for("update");
    const user = rows[0];

    if (!user?.passwordHash) return "not_found" as const;
    if (user.passwordHash.startsWith("pbkdf2-sha256-v2$")) return "current" as const;
    if (!user.passwordHash.startsWith("pbkdf2-sha256$")) return "unsupported" as const;
    if (!await verifyPassword(currentPassword, user.passwordHash)) return "invalid_password" as const;

    const now = new Date();
    const passwordHash = await hashPassword(currentPassword);
    await tx.update(users).set({ passwordHash, updatedAt: now }).where(eq(users.id, user.id));
    await tx.delete(authSessions).where(eq(authSessions.userId, user.id));
    await tx.update(authTokens).set({ usedAt: now }).where(and(
      eq(authTokens.userId, user.id),
      isNull(authTokens.usedAt),
    ));
    return "migrated" as const;
  });

  if (result === "migrated") console.log(`Đã chuyển ${email} sang password hash v2 và thu hồi session cũ.`);
  else if (result === "current") console.log(`${email} đã dùng password hash v2, không cần thay đổi.`);
  else if (result === "invalid_password") throw new Error("Mật khẩu hiện tại không đúng; tài khoản chưa bị thay đổi.");
  else if (result === "unsupported") throw new Error("Định dạng password hash không được hỗ trợ; tài khoản chưa bị thay đổi.");
  else throw new Error("Không tìm thấy tài khoản có mật khẩu; chưa có dữ liệu nào bị thay đổi.");
} finally {
  await closeDb();
}
