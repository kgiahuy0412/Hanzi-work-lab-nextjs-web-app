import assert from "node:assert/strict";
import test from "node:test";
import {
  authenticateSepayWebhook,
  buildSepayVietQrUrl,
  extractSepayPaymentCode,
  parseSepayTransactionDate,
  parseSepayWebhookPayload,
} from "../lib/sepay.ts";

const payload = {
  id: 92704,
  gateway: "ACB",
  transactionDate: "2026-09-02 11:08:33",
  accountNumber: "12897891",
  subAccount: "",
  code: "HIMI23456789ABCD",
  content: "HIMI23456789ABCD thanh toan VIP",
  transferType: "in",
  description: "LEARNER thanh toan",
  transferAmount: 329000,
  accumulated: 1000000,
  referenceCode: "ACB92704",
};

function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hmac(secret, message) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return bytesToHex(new Uint8Array(digest));
}

test("VietQR contains the configured ACB account, exact amount and payment code", () => {
  const result = new URL(buildSepayVietQrUrl({
    amountVnd: 329000,
    bankAccount: { bankCode: "ACB", accountNumber: "12897891", accountName: "LE CHAU KIET" },
    paymentCode: "HIMI23456789ABCD",
  }));
  assert.equal(result.origin + result.pathname, "https://vietqr.app/img");
  assert.equal(result.searchParams.get("bank"), "ACB");
  assert.equal(result.searchParams.get("acc"), "12897891");
  assert.equal(result.searchParams.get("amount"), "329000");
  assert.equal(result.searchParams.get("addInfo"), "HIMI23456789ABCD");
  assert.equal(result.searchParams.get("holder"), "LE CHAU KIET");
});

test("SePay payload validation and payment-code extraction are strict", () => {
  const parsed = parseSepayWebhookPayload(payload);
  assert.deepEqual(parsed, payload);
  assert.equal(extractSepayPaymentCode(parsed), payload.code);
  assert.equal(extractSepayPaymentCode({ code: null, content: `noi dung ${payload.code} thanh toan` }), payload.code);
  assert.equal(parseSepayWebhookPayload({ ...payload, transferAmount: -1 }), null);
  assert.equal(parseSepayWebhookPayload({ ...payload, transferType: "refund" }), null);
  assert.equal(parseSepayTransactionDate(payload.transactionDate)?.toISOString(), "2026-09-02T04:08:33.000Z");
});

test("HMAC authentication uses the raw body and rejects stale requests", async () => {
  const rawBody = JSON.stringify(payload);
  const secret = "test-sepay-webhook-secret";
  const timestamp = "1788322113";
  const signature = `sha256=${await hmac(secret, `${timestamp}.${rawBody}`)}`;
  assert.deepEqual(await authenticateSepayWebhook({
    rawBody,
    secret,
    signature,
    timestamp,
    authorization: null,
    nowMs: Number(timestamp) * 1000,
  }), { ok: true, method: "hmac" });
  assert.deepEqual(await authenticateSepayWebhook({
    rawBody,
    secret,
    signature,
    timestamp,
    authorization: null,
    nowMs: (Number(timestamp) + 301) * 1000,
  }), { ok: false, error: "expired" });
});

test("API key is accepted only when HMAC is not configured", async () => {
  assert.deepEqual(await authenticateSepayWebhook({
    apiKey: "sepay-key",
    authorization: "Apikey sepay-key",
    rawBody: "{}",
    signature: null,
    timestamp: null,
  }), { ok: true, method: "api_key" });
  assert.deepEqual(await authenticateSepayWebhook({
    apiKey: "sepay-key",
    authorization: "Bearer sepay-key",
    rawBody: "{}",
    signature: null,
    timestamp: null,
  }), { ok: false, error: "invalid" });
});
