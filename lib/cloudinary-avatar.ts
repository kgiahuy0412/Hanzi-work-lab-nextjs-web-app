import { randomUUID } from "node:crypto";
import { v2 as cloudinary } from "cloudinary";
import { MAX_AVATAR_BYTES } from "./avatar-validation.ts";
import { readCloudinaryCredentials } from "./cloudinary-practice-audio.ts";

const allowedFormats = ["jpg", "png", "webp"] as const;
const allowedFormatSet = new Set<string>(allowedFormats);

export type AvatarUploadIntent = {
  uploadUrl: string;
  apiKey: string;
  parameters: Record<string, string>;
  signature: string;
};

export type CloudinaryAvatar = {
  assetId: string;
  publicId: string;
  secureUrl: string;
  format: string;
  width: number;
  height: number;
  sizeBytes: number;
};

function requireCredentials() {
  const credentials = readCloudinaryCredentials();
  if (!credentials) throw new Error("Cloudinary chưa được cấu hình.");
  cloudinary.config({
    cloud_name: credentials.cloudName,
    api_key: credentials.apiKey,
    api_secret: credentials.apiSecret,
    secure: true,
  });
  return credentials;
}

export function isCloudinaryAvatarConfigured(): boolean {
  return Boolean(readCloudinaryCredentials());
}

export function createAvatarUploadIntent(userId: string, now = Date.now()): AvatarUploadIntent {
  const credentials = requireCredentials();
  const parameters = {
    allowed_formats: allowedFormats.join(","),
    overwrite: "false",
    public_id: `hanziwork/avatars/${userId}/${randomUUID()}`,
    tags: "hanziwork,user-avatar",
    timestamp: String(Math.floor(now / 1_000)),
    transformation: "c_limit,w_1024,h_1024",
  };
  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${encodeURIComponent(credentials.cloudName)}/image/upload`,
    apiKey: credentials.apiKey,
    parameters,
    signature: cloudinary.utils.api_sign_request(parameters, credentials.apiSecret),
  };
}

function recordOf(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function positiveInteger(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function verifyAvatarUploadResponse(value: unknown, userId: string): CloudinaryAvatar | null {
  const source = recordOf(value);
  const credentials = readCloudinaryCredentials();
  if (!source || !credentials) return null;

  const assetId = typeof source.asset_id === "string" ? source.asset_id : "";
  const publicId = typeof source.public_id === "string" ? source.public_id : "";
  const signature = typeof source.signature === "string" ? source.signature : "";
  const secureUrl = typeof source.secure_url === "string" ? source.secure_url : "";
  const resourceType = typeof source.resource_type === "string" ? source.resource_type : "";
  const format = typeof source.format === "string" ? source.format.toLowerCase() : "";
  const version = positiveInteger(source.version);
  const sizeBytes = positiveInteger(source.bytes);
  const width = positiveInteger(source.width);
  const height = positiveInteger(source.height);

  if (!assetId || assetId.length > 255 || !publicId || publicId.length > 500 || !signature || !secureUrl) return null;
  if (!publicId.startsWith(`hanziwork/avatars/${userId}/`)) return null;
  if (resourceType !== "image" || !allowedFormatSet.has(format) || version === null) return null;
  if (sizeBytes === null || sizeBytes > MAX_AVATAR_BYTES || width === null || height === null || width > 1024 || height > 1024) return null;

  const expectedSignature = cloudinary.utils.api_sign_request({ public_id: publicId, version: String(version) }, credentials.apiSecret);
  if (signature !== expectedSignature) return null;

  try {
    const parsedUrl = new URL(secureUrl);
    if (parsedUrl.protocol !== "https:" || parsedUrl.hostname !== "res.cloudinary.com") return null;
    if (!parsedUrl.pathname.startsWith(`/${credentials.cloudName}/image/upload/`)) return null;
  } catch {
    return null;
  }

  return { assetId, publicId, secureUrl, format, width, height, sizeBytes };
}

export async function deleteCloudinaryAvatar(publicId: string): Promise<void> {
  if (!readCloudinaryCredentials()) return;
  requireCredentials();
  await cloudinary.uploader.destroy(publicId, { resource_type: "image", invalidate: true });
}

