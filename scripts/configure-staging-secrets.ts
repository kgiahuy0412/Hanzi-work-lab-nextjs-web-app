import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const wranglerCli = resolve(projectRoot, "node_modules", "wrangler", "bin", "wrangler.js");
const workerName = process.env.CLOUDFLARE_STAGING_WORKER_NAME?.trim() || "hanziwork-staging";

function requiredEnvironmentValue(name: "DATABASE_URL" | "AUTH_SECRET" | "CLOUDINARY_URL" | "BREVO_API_KEY" | "BREVO_FROM_EMAIL" | "SEPAY_WEBHOOK_SECRET") {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Thiếu ${name} trong file môi trường local.`);
  return value;
}

function stagingApplicationUrl() {
  const value = process.env.STAGING_APP_URL?.trim();
  if (!value) throw new Error("Thiếu STAGING_APP_URL của Worker vừa deploy.");

  const url = new URL(value);
  if (url.protocol !== "https:" || url.hostname === "localhost" || url.hostname === "127.0.0.1") {
    throw new Error("STAGING_APP_URL phải là địa chỉ HTTPS công khai của staging.");
  }

  return url.origin;
}

if (!existsSync(wranglerCli)) {
  throw new Error("Không tìm thấy Wrangler. Hãy chạy `npm install` rồi thử lại.");
}

const iflytekAppId = process.env.IFLYTEK_ISE_APP_ID?.trim();
const iflytekApiKey = process.env.IFLYTEK_ISE_API_KEY?.trim();
const iflytekApiSecret = process.env.IFLYTEK_ISE_API_SECRET?.trim();
const iflytekValues = [iflytekAppId, iflytekApiKey, iflytekApiSecret];
const hasCompleteIflytekConfig = iflytekValues.every(Boolean);
if (iflytekValues.some(Boolean) && !hasCompleteIflytekConfig) {
  throw new Error("Cấu hình iFlytek chưa đủ bộ IFLYTEK_ISE_APP_ID, IFLYTEK_ISE_API_KEY và IFLYTEK_ISE_API_SECRET.");
}

const secrets = {
  DATABASE_URL: requiredEnvironmentValue("DATABASE_URL"),
  AUTH_SECRET: requiredEnvironmentValue("AUTH_SECRET"),
  CLOUDINARY_URL: requiredEnvironmentValue("CLOUDINARY_URL"),
  BREVO_API_KEY: requiredEnvironmentValue("BREVO_API_KEY"),
  BREVO_FROM_EMAIL: requiredEnvironmentValue("BREVO_FROM_EMAIL"),
  BREVO_FROM_NAME: process.env.BREVO_FROM_NAME?.trim() || "HanziWork",
  SEPAY_WEBHOOK_SECRET: requiredEnvironmentValue("SEPAY_WEBHOOK_SECRET"),
  SEPAY_BANK_CODE: process.env.SEPAY_BANK_CODE?.trim() || "ACB",
  SEPAY_BANK_ACCOUNT_NUMBER: process.env.SEPAY_BANK_ACCOUNT_NUMBER?.trim() || "12897891",
  SEPAY_BANK_ACCOUNT_NAME: process.env.SEPAY_BANK_ACCOUNT_NAME?.trim() || "LE CHAU KIET",
  NEXT_PUBLIC_APP_URL: stagingApplicationUrl(),
  AUTH_COOKIE_SECURE: "1",
  AUTH_TRUST_X_FORWARDED_FOR: "0",
  AUTH_TRUST_CF_CONNECTING_IP: "1",
  ...(hasCompleteIflytekConfig ? {
    IFLYTEK_ISE_APP_ID: iflytekAppId!,
    IFLYTEK_ISE_API_KEY: iflytekApiKey!,
    IFLYTEK_ISE_API_SECRET: iflytekApiSecret!,
  } : {}),
};

console.log(`Uploading ${Object.keys(secrets).length} staging secrets to ${workerName}...`);

const child = spawn(
  process.execPath,
  [wranglerCli, "secret", "bulk", "--name", workerName],
  {
    cwd: projectRoot,
    env: process.env,
    stdio: ["pipe", "inherit", "inherit"],
  },
);

child.stdin.end(JSON.stringify(secrets));

child.on("error", (error) => {
  console.error("Không thể cấu hình staging secrets:", error.message);
  process.exitCode = 1;
});

child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
