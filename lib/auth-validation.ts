export const MIN_PASSWORD_LENGTH = 10;
export const MAX_PASSWORD_LENGTH = 128;

export type RegistrationInput = {
  displayName: string;
  email: string;
  password: string;
};

export function normalizeEmail(value: string): string {
  return value.trim().toLocaleLowerCase("en-US");
}

export function validateEmail(value: string): boolean {
  return value.length <= 255 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(value);
}

export function validatePassword(value: string): boolean {
  return value.length >= MIN_PASSWORD_LENGTH && value.length <= MAX_PASSWORD_LENGTH;
}

export function validateAuthToken(value: string): boolean {
  return value.length === 43 && /^[A-Za-z0-9_-]+$/u.test(value);
}

export function parseRegistrationInput(values: {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
}): { data?: RegistrationInput; error?: "invalid_name" | "invalid_email" | "invalid_password" | "password_mismatch" } {
  const displayName = values.displayName.trim().replace(/\s+/gu, " ");
  const email = normalizeEmail(values.email);
  if (displayName.length < 2 || displayName.length > 120) return { error: "invalid_name" };
  if (!validateEmail(email)) return { error: "invalid_email" };
  if (!validatePassword(values.password)) return { error: "invalid_password" };
  if (values.password !== values.confirmPassword) return { error: "password_mismatch" };
  return { data: { displayName, email, password: values.password } };
}

export function safeReturnTo(value: string | null | undefined, fallback = "/"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  try {
    const parsed = new URL(value, "https://hanziwork.local");
    if (parsed.origin !== "https://hanziwork.local") return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
