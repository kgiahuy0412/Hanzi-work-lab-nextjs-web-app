import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.ts";

let sqlClient: ReturnType<typeof postgres> | undefined;
let database: ReturnType<typeof drizzle<typeof schema>> | undefined;

function connectionString(): string {
  const value = process.env.DATABASE_URL;
  if (!value) {
    throw new Error("DATABASE_URL chưa được cấu hình. Sao chép .env.example thành .env.local và điền chuỗi kết nối PostgreSQL.");
  }
  return value;
}

export function getDb() {
  sqlClient ??= postgres(connectionString(), { prepare: false, max: 5 });
  database ??= drizzle(sqlClient, { schema });
  return database;
}

export type Database = ReturnType<typeof getDb>;

async function withRequestDb<T>(operation: (db: Database) => PromiseLike<T>): Promise<T> {
  const requestClient = postgres(connectionString(), { prepare: false, max: 1 });
  const requestDb = drizzle(requestClient, { schema }) as Database;

  try {
    return await operation(requestDb);
  } finally {
    await requestClient.end({ timeout: 2 }).catch(() => undefined);
  }
}

export async function readDb<T>(operation: (db: Database) => PromiseLike<T>): Promise<T> {
  const retryDelays = [0, 100, 250];
  let lastError: unknown;

  for (const delay of retryDelays) {
    if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
    try {
      return await withRequestDb(operation);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

export async function writeDb<T>(operation: (db: Database) => PromiseLike<T>): Promise<T> {
  return withRequestDb(operation);
}

export async function closeDb() {
  if (!sqlClient) return;
  await sqlClient.end({ timeout: 5 });
  sqlClient = undefined;
  database = undefined;
}
