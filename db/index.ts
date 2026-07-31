import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let sqlClient: ReturnType<typeof postgres> | undefined;

export function getDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL chưa được cấu hình. Sao chép .env.example thành .env.local và điền chuỗi kết nối PostgreSQL.");
  }
  sqlClient ??= postgres(connectionString, { prepare: false, max: 5 });
  return drizzle(sqlClient, { schema });
}
