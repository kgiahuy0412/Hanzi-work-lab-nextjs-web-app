import { pbkdf2 } from "node:crypto";

const CURRENT_PASSWORD_ALGORITHM = "pbkdf2-sha256-v2";
const LEGACY_PASSWORD_ALGORITHM = "pbkdf2-sha256";
const PASSWORD_ITERATIONS = 100_000;
const LEGACY_PASSWORD_MAX_ITERATIONS = 600_000;
const PASSWORD_SALT_BYTES = 16;
const PASSWORD_HASH_BYTES = 32;
const SESSION_TOKEN_BYTES = 32;

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padding = "=".repeat((4 - normalized.length % 4) % 4);
  const binary = atob(normalized + padding);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

function authSecret(): string {
  const configuredSecret = process.env.AUTH_SECRET;
  if (!configuredSecret && process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET chưa được cấu hình.");
  }
  return configuredSecret || "hanziwork-development-only-secret";
}

async function pepperPassword(password: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(authSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(password));
  return new Uint8Array(digest);
}

async function derivePasswordHash(password: string | Uint8Array, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    pbkdf2(password, salt, iterations, PASSWORD_HASH_BYTES, "sha256", (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(new Uint8Array(derivedKey));
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(PASSWORD_SALT_BYTES));
  const hash = await derivePasswordHash(await pepperPassword(password), salt, PASSWORD_ITERATIONS);
  return `${CURRENT_PASSWORD_ALGORITHM}$${PASSWORD_ITERATIONS}$${bytesToBase64Url(salt)}$${bytesToBase64Url(hash)}`;
}

export async function verifyPassword(password: string, encodedHash: string): Promise<boolean> {
  const [algorithm, iterationsValue, saltValue, hashValue, extra] = encodedHash.split("$");
  const iterations = Number(iterationsValue);
  const isCurrent = algorithm === CURRENT_PASSWORD_ALGORITHM;
  const isLegacy = algorithm === LEGACY_PASSWORD_ALGORITHM;
  if ((!isCurrent && !isLegacy) || extra !== undefined || !Number.isSafeInteger(iterations) || iterations < 1) return false;
  if (isCurrent && iterations !== PASSWORD_ITERATIONS) return false;
  if (isLegacy && iterations > LEGACY_PASSWORD_MAX_ITERATIONS) return false;

  try {
    const salt = base64UrlToBytes(saltValue);
    const expected = base64UrlToBytes(hashValue);
    const passwordMaterial = isCurrent ? await pepperPassword(password) : password;
    const actual = await derivePasswordHash(passwordMaterial, salt, iterations);
    return constantTimeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function createSessionToken(): string {
  return bytesToBase64Url(crypto.getRandomValues(new Uint8Array(SESSION_TOKEN_BYTES)));
}

export function createAuthToken(): string {
  return createSessionToken();
}

export async function hashSessionToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return bytesToHex(new Uint8Array(digest));
}

export async function hashAuthToken(token: string): Promise<string> {
  return hashSessionToken(token);
}

export async function hashPrivateIdentifier(value: string): Promise<string> {
  const configuredSecret = process.env.AUTH_SECRET;
  if (!configuredSecret && process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET chưa được cấu hình.");
  }
  const secret = configuredSecret || "hanziwork-development-only-secret";
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return bytesToHex(new Uint8Array(digest));
}
