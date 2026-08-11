import { isNotNull, sql } from "drizzle-orm";
import { readDb } from "../db/index.ts";
import { users } from "../db/schema.ts";

const algorithm = sql<string>`split_part(${users.passwordHash}, '$', 1)`;
const inventory = await readDb((db) => db
  .select({
    algorithm,
    role: users.role,
    accounts: sql<number>`count(*)::int`,
  })
  .from(users)
  .where(isNotNull(users.passwordHash))
  .groupBy(algorithm, users.role)
  .orderBy(algorithm, users.role));

console.log("Password hash inventory (không chứa email hoặc hash):");
for (const item of inventory) console.log(`- ${item.algorithm} / ${item.role}: ${item.accounts} tài khoản`);

const legacyAccounts = inventory
  .filter((item) => item.algorithm === "pbkdf2-sha256")
  .reduce((total, item) => total + item.accounts, 0);

if (legacyAccounts > 0) {
  console.log(`Cần đặt lại mật khẩu trước khi đăng nhập Cloudflare Workers: ${legacyAccounts} tài khoản.`);
} else {
  console.log("Không còn tài khoản dùng hash legacy.");
}
