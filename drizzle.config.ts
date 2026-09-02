import { defineConfig } from "drizzle-kit";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const envPath = [".env.local", ".env"]
  .map((fileName) => resolve(process.cwd(), fileName))
  .find((filePath) => existsSync(filePath));

if (envPath) process.loadEnvFile(envPath);

export default defineConfig({
  out: "./drizzle",
  schema: "./db/schema.ts",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
});
