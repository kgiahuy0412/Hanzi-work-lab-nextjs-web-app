import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.ts";

let sqlClient: ReturnType<typeof postgres> | undefined;
let database: ReturnType<typeof drizzle<typeof schema>> | undefined;

function databaseErrorSummary(error: unknown, depth = 0): Record<string, unknown> {
  const candidate = error instanceof Error ? error : undefined;
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String(error.code)
      : undefined;
  const configuredUrl = process.env.DATABASE_URL;
  let message = candidate?.message ?? "Unknown database error";

  if (configuredUrl) message = message.replaceAll(configuredUrl, "[DATABASE_URL]");
  message = message.replace(/postgres(?:ql)?:\/\/\S+/gi, "[DATABASE_URL]");
  message = message.replace(/\nparams:[\s\S]*$/i, "\nparams: [redacted]");

  const summary: Record<string, unknown> = {
    name: candidate?.name ?? "DatabaseError",
    ...(code ? { code } : {}),
    message,
  };

  if (depth < 3 && candidate?.cause && candidate.cause !== error) {
    summary.cause = databaseErrorSummary(candidate.cause, depth + 1);
  }

  return summary;
}

function reportDatabaseError(operation: "read" | "write", error: unknown) {
  console.error(`[database] ${operation} failed`, databaseErrorSummary(error));
}

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
  const requestClient = postgres(connectionString(), { prepare: false, max: 4 });
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

  reportDatabaseError("read", lastError);
  throw lastError;
}

export async function writeDb<T>(operation: (db: Database) => PromiseLike<T>): Promise<T> {
  try {
    return await withRequestDb(operation);
  } catch (error) {
    reportDatabaseError("write", error);
    throw error;
  }
}

export async function closeDb() {
  if (!sqlClient) return;
  await sqlClient.end({ timeout: 5 });
  sqlClient = undefined;
  database = undefined;
}
