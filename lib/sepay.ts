export const SEPAY_PROVIDER = "sepay";
export const SEPAY_PAYMENT_CODE_PREFIX = "HIMI";
export const SEPAY_ORDER_TTL_MINUTES = 30;

const defaultBankAccount = {
  bankCode: "ACB",
  accountNumber: "12897891",
  accountName: "LE CHAU KIET",
} as const;

export type SepayBankAccount = {
  bankCode: string;
  accountNumber: string;
  accountName: string;
};

export type SepayWebhookPayload = {
  id: number;
  gateway: string;
  transactionDate: string;
  accountNumber: string;
  subAccount: string;
  code: string | null;
  content: string;
  transferType: "in" | "out";
  description: string;
  transferAmount: number;
  accumulated: number;
  referenceCode: string;
};

export type SepayWebhookAuthentication =
  | { ok: true; method: "api_key" | "hmac" }
  | { ok: false; error: "expired" | "invalid" | "misconfigured" };

function boundedString(value: unknown, maximum: number, allowEmpty = false): string | null {
  if (typeof value !== "string") return null;
  const result = value.trim().slice(0, maximum);
  return result || (allowEmpty ? "" : null);
}

function constantTimeTextEqual(left: string, right: string): boolean {
  const leftBytes = new TextEncoder().encode(left);
  const rightBytes = new TextEncoder().encode(right);
  if (leftBytes.length !== rightBytes.length) return false;
  let difference = 0;
  for (let index = 0; index < leftBytes.length; index += 1) {
    difference |= leftBytes[index] ^ rightBytes[index];
  }
  return difference === 0;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function normalizedAccountNumber(value: string): string {
  return value.replace(/[\s.-]/gu, "").toUpperCase();
}

export function getSepayBankAccount(environment: NodeJS.ProcessEnv = process.env): SepayBankAccount {
  const bankCode = environment.SEPAY_BANK_CODE?.trim()
    || environment.VIP_BANK_NAME?.trim()
    || defaultBankAccount.bankCode;
  const accountNumber = environment.SEPAY_BANK_ACCOUNT_NUMBER?.trim()
    || environment.VIP_BANK_ACCOUNT_NUMBER?.trim()
    || defaultBankAccount.accountNumber;
  const accountName = environment.SEPAY_BANK_ACCOUNT_NAME?.trim()
    || environment.VIP_BANK_ACCOUNT_NAME?.trim()
    || defaultBankAccount.accountName;

  return {
    bankCode: bankCode.toUpperCase().slice(0, 30),
    accountNumber: normalizedAccountNumber(accountNumber).slice(0, 60),
    accountName: accountName.replace(/\s+/gu, " ").slice(0, 120),
  };
}

export function accountNumberMatchesSepayConfig(received: string, expected: string): boolean {
  return constantTimeTextEqual(normalizedAccountNumber(received), normalizedAccountNumber(expected));
}

export function createSepayPaymentCode(): string {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  let token = "";
  for (const byte of bytes) token += alphabet[byte % alphabet.length];
  return `${SEPAY_PAYMENT_CODE_PREFIX}${token}`;
}

export function buildSepayVietQrUrl(input: {
  amountVnd: number;
  bankAccount?: SepayBankAccount;
  paymentCode: string;
}): string {
  if (!Number.isSafeInteger(input.amountVnd) || input.amountVnd < 1) {
    throw new RangeError("Số tiền thanh toán không hợp lệ.");
  }
  const bankAccount = input.bankAccount ?? getSepayBankAccount();
  const url = new URL("https://vietqr.app/img");
  url.searchParams.set("bank", bankAccount.bankCode);
  url.searchParams.set("acc", bankAccount.accountNumber);
  url.searchParams.set("template", "compact");
  url.searchParams.set("amount", String(input.amountVnd));
  url.searchParams.set("addInfo", input.paymentCode);
  url.searchParams.set("showinfo", "true");
  url.searchParams.set("holder", bankAccount.accountName);
  return url.toString();
}

export function parseSepayWebhookPayload(value: unknown): SepayWebhookPayload | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const data = value as Record<string, unknown>;
  const id = data.id;
  const transferAmount = data.transferAmount;
  const accumulated = data.accumulated;
  const gateway = boundedString(data.gateway, 80);
  const transactionDate = boundedString(data.transactionDate, 40);
  const accountNumber = boundedString(data.accountNumber, 80);
  const subAccount = boundedString(data.subAccount ?? "", 120, true);
  const content = boundedString(data.content, 1_000, true);
  const description = boundedString(data.description ?? "", 2_000, true);
  const referenceCode = boundedString(data.referenceCode ?? "", 160, true);
  const code = data.code === null || data.code === undefined
    ? null
    : boundedString(data.code, 120, true);

  if (!Number.isSafeInteger(id) || (id as number) < 0
    || !Number.isSafeInteger(transferAmount) || (transferAmount as number) < 1
    || !Number.isSafeInteger(accumulated) || (accumulated as number) < 0
    || !gateway || !transactionDate || !accountNumber
    || subAccount === null || content === null || description === null || referenceCode === null
    || (data.code !== null && data.code !== undefined && code === null)
    || (data.transferType !== "in" && data.transferType !== "out")) {
    return null;
  }

  return {
    id: id as number,
    gateway,
    transactionDate,
    accountNumber,
    subAccount,
    code,
    content,
    transferType: data.transferType,
    description,
    transferAmount: transferAmount as number,
    accumulated: accumulated as number,
    referenceCode,
  };
}

export function extractSepayPaymentCode(payload: Pick<SepayWebhookPayload, "code" | "content">): string | null {
  const exactCode = payload.code?.trim().toUpperCase() ?? "";
  if (/^HIMI[2-9A-HJ-NP-Z]{12}$/u.test(exactCode)) return exactCode;
  return payload.content.toUpperCase().match(/(?:^|[^A-Z0-9])(HIMI[2-9A-HJ-NP-Z]{12})(?:$|[^A-Z0-9])/u)?.[1] ?? null;
}

export function parseSepayTransactionDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/u.test(value)) return null;
  const parsed = new Date(`${value.replace(" ", "T")}+07:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

async function verifySepayHmac(input: {
  rawBody: string;
  secret: string;
  signature: string | null;
  timestamp: string | null;
  nowMs: number;
}): Promise<SepayWebhookAuthentication> {
  if (!input.signature || !input.timestamp || !/^\d{10}$/u.test(input.timestamp)) {
    return { ok: false, error: "invalid" };
  }
  const timestampSeconds = Number(input.timestamp);
  if (!Number.isSafeInteger(timestampSeconds)
    || Math.abs(Math.floor(input.nowMs / 1_000) - timestampSeconds) > 300) {
    return { ok: false, error: "expired" };
  }
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(input.secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${input.timestamp}.${input.rawBody}`),
  );
  const expected = `sha256=${bytesToHex(new Uint8Array(digest))}`;
  return constantTimeTextEqual(expected, input.signature.toLowerCase())
    ? { ok: true, method: "hmac" }
    : { ok: false, error: "invalid" };
}

export async function authenticateSepayWebhook(input: {
  apiKey?: string | null;
  authorization: string | null;
  nowMs?: number;
  rawBody: string;
  secret?: string | null;
  signature: string | null;
  timestamp: string | null;
}): Promise<SepayWebhookAuthentication> {
  const secret = input.secret?.trim();
  if (secret) {
    return verifySepayHmac({
      rawBody: input.rawBody,
      secret,
      signature: input.signature,
      timestamp: input.timestamp,
      nowMs: input.nowMs ?? Date.now(),
    });
  }
  const apiKey = input.apiKey?.trim();
  if (!apiKey) return { ok: false, error: "misconfigured" };
  const expected = `Apikey ${apiKey}`;
  return input.authorization && constantTimeTextEqual(expected, input.authorization)
    ? { ok: true, method: "api_key" }
    : { ok: false, error: "invalid" };
}
