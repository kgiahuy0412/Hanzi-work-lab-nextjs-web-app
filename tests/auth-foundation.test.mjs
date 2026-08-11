import assert from "node:assert/strict";
import test from "node:test";
import { createSessionToken, hashPassword, hashPrivateIdentifier, hashSessionToken, verifyPassword } from "../lib/auth-crypto.ts";
import { normalizeEmail, parseRegistrationInput, safeReturnTo, validateAuthToken } from "../lib/auth-validation.ts";
import { clientAddress, isSameOriginRequest } from "../lib/request-security.ts";
import { scheduleReview } from "../lib/review-scheduler.ts";

test("passwords are salted and verified with PBKDF2", async () => {
  const first = await hashPassword("Mat-khau-an-toan-2026!");
  const second = await hashPassword("Mat-khau-an-toan-2026!");
  assert.notEqual(first, second);
  assert.match(first, /^pbkdf2-sha256-v2\$100000\$/u);
  assert.equal(await verifyPassword("Mat-khau-an-toan-2026!", first), true);
  assert.equal(await verifyPassword("mat-khau-sai", first), false);
});

test("password v2 hashes require the configured server-side pepper", async () => {
  const previousSecret = process.env.AUTH_SECRET;
  try {
    process.env.AUTH_SECRET = "pepper-qa-a";
    const encodedHash = await hashPassword("Mat-khau-an-toan-2026!");
    assert.equal(await verifyPassword("Mat-khau-an-toan-2026!", encodedHash), true);

    process.env.AUTH_SECRET = "pepper-qa-b";
    assert.equal(await verifyPassword("Mat-khau-an-toan-2026!", encodedHash), false);
  } finally {
    if (previousSecret === undefined) delete process.env.AUTH_SECRET;
    else process.env.AUTH_SECRET = previousSecret;
  }
});

test("session tokens are random and only have deterministic hashes", async () => {
  const first = createSessionToken();
  const second = createSessionToken();
  assert.notEqual(first, second);
  assert.equal((await hashSessionToken(first)).length, 64);
  assert.equal(await hashSessionToken(first), await hashSessionToken(first));
  assert.equal(validateAuthToken(first), true);
  assert.equal(validateAuthToken(`${first}x`), false);
});

test("private audit identifiers use deterministic keyed hashes", async () => {
  const first = await hashPrivateIdentifier("203.0.113.9");
  assert.equal(first.length, 64);
  assert.equal(first, await hashPrivateIdentifier("203.0.113.9"));
  assert.notEqual(first, await hashPrivateIdentifier("203.0.113.10"));
});

test("registration normalization and validation keep learner input bounded", () => {
  const result = parseRegistrationInput({
    displayName: "  Gia   Huy  ",
    email: "  GIAHUY@EXAMPLE.COM ",
    password: "mat-khau-dai-2026",
    confirmPassword: "mat-khau-dai-2026",
  });
  assert.equal(result.data?.displayName, "Gia Huy");
  assert.equal(result.data?.email, "giahuy@example.com");
  assert.equal(normalizeEmail(" USER@Example.com "), "user@example.com");
});

test("return targets reject cross-origin redirects", () => {
  assert.equal(safeReturnTo("/learn/van-phong-hanh-chinh?lesson=1"), "/learn/van-phong-hanh-chinh?lesson=1");
  assert.equal(safeReturnTo("https://example.com/steal"), "/");
  assert.equal(safeReturnTo("//example.com/steal"), "/");
});

test("auth mutations require a matching Origin header", () => {
  assert.equal(isSameOriginRequest(new Request("https://hanziwork.vn/api/auth/login", { headers: { origin: "https://hanziwork.vn" } })), true);
  assert.equal(isSameOriginRequest(new Request("https://hanziwork.vn/api/auth/login", { headers: { origin: "https://evil.example" } })), false);
  assert.equal(isSameOriginRequest(new Request("https://hanziwork.vn/api/auth/login")), false);
  assert.equal(clientAddress(new Request("https://hanziwork.vn", { headers: { "x-forwarded-for": "203.0.113.9, 10.0.0.1" } })), "203.0.113.9");
});

test("review scheduling advances remembered words and resets hard words", () => {
  const now = new Date("2026-07-31T00:00:00.000Z");
  const first = scheduleReview(null, true, now);
  assert.equal(first.correctCount, 1);
  assert.equal(first.intervalDays, 1);
  assert.equal(first.nextReviewAt.toISOString(), "2026-08-01T00:00:00.000Z");

  const advanced = scheduleReview({ ...first, intervalDays: 4, correctCount: 3 }, true, now);
  assert.equal(advanced.correctCount, 4);
  assert.equal(advanced.intervalDays, 10);
  assert.equal(advanced.state, "reviewing");

  const hard = scheduleReview(advanced, false, now);
  assert.equal(hard.intervalDays, 1);
  assert.equal(hard.wrongCount, 1);
  assert.equal(hard.state, "learning");
  assert.ok(hard.easeScore < advanced.easeScore);
});
