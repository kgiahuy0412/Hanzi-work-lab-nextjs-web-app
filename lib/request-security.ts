import { safeReturnTo } from "./auth-validation.ts";

export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export function formString(formData: FormData, name: string, maxLength = 512): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.slice(0, maxLength + 1) : "";
}

export function clientAddress(request: Request): string {
  const development = process.env.NODE_ENV !== "production";
  const trustForwardedFor = process.env.VERCEL === "1" || process.env.AUTH_TRUST_X_FORWARDED_FOR === "1" || development;
  const trustCloudflare = process.env.AUTH_TRUST_CF_CONNECTING_IP === "1" || development;
  const forwardedFor = trustForwardedFor ? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() : undefined;
  const cloudflareAddress = trustCloudflare ? request.headers.get("cf-connecting-ip")?.trim() : undefined;
  return forwardedFor || cloudflareAddress || "unknown";
}

export function authRedirectUrl(request: Request, pathname: string, options: {
  error?: string;
  returnTo?: string;
} = {}): URL {
  const url = new URL(pathname, request.url);
  if (options.error) url.searchParams.set("error", options.error);
  if (options.returnTo) url.searchParams.set("returnTo", safeReturnTo(options.returnTo));
  return url;
}
