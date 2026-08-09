import { randomUUID } from "node:crypto";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { MAX_PRACTICE_AUDIO_BYTES, MAX_PRACTICE_AUDIO_DURATION_MS } from "./practice-audio-validation.ts";

const allowedFormats = ["mp3", "wav", "m4a", "mp4", "aac", "ogg", "webm"] as const;
const allowedFormatSet = new Set<string>(allowedFormats);

export type CloudinaryCredentials = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
};

export type CloudinaryPracticeAudio = {
  assetId: string;
  publicId: string;
  version: number;
  secureUrl: string;
  format: string;
  mimeType: string;
  sizeBytes: number;
  durationMs: number | null;
};

export type PracticeAudioUploadIntent = {
  uploadUrl: string;
  apiKey: string;
  parameters: Record<string, string>;
  signature: string;
};

function nonEmpty(value: string | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function readCloudinaryCredentials(environment: NodeJS.ProcessEnv = process.env): CloudinaryCredentials | null {
  const cloudinaryUrl = nonEmpty(environment.CLOUDINARY_URL);
  if (cloudinaryUrl) {
    try {
      const parsed = new URL(cloudinaryUrl);
      if (parsed.protocol !== "cloudinary:" || !parsed.hostname || !parsed.username || !parsed.password) return null;
      return {
        cloudName: decodeURIComponent(parsed.hostname),
        apiKey: decodeURIComponent(parsed.username),
        apiSecret: decodeURIComponent(parsed.password),
      };
    } catch {
      return null;
    }
  }
  const cloudName = nonEmpty(environment.CLOUDINARY_CLOUD_NAME);
  const apiKey = nonEmpty(environment.CLOUDINARY_API_KEY);
  const apiSecret = nonEmpty(environment.CLOUDINARY_API_SECRET);
  return cloudName && apiKey && apiSecret ? { cloudName, apiKey, apiSecret } : null;
}

export function isCloudinaryPracticeAudioConfigured(environment: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(readCloudinaryCredentials(environment));
}

function requireCredentials(): CloudinaryCredentials {
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

export function createPracticeAudioUploadIntent(exerciseId: string, now = Date.now()): PracticeAudioUploadIntent {
  const credentials = requireCredentials();
  const parameters = {
    allowed_formats: allowedFormats.join(","),
    public_id: `hanziwork/practice-audio/${exerciseId}/${randomUUID()}`,
    tags: "hanziwork,practice-audio",
    timestamp: String(Math.floor(now / 1_000)),
  };
  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${encodeURIComponent(credentials.cloudName)}/video/upload`,
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

function integer(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isInteger(parsed) ? parsed : null;
}

function audioMimeType(format: string): string | null {
  if (format === "mp3") return "audio/mpeg";
  if (format === "wav") return "audio/wav";
  if (format === "m4a" || format === "mp4") return "audio/mp4";
  if (format === "aac") return "audio/aac";
  if (format === "ogg") return "audio/ogg";
  if (format === "webm") return "audio/webm";
  return null;
}

export function verifyPracticeAudioUploadResponse(value: unknown, exerciseId: string): CloudinaryPracticeAudio | null {
  const source = recordOf(value);
  const credentials = readCloudinaryCredentials();
  if (!source || !credentials) return null;
  const assetId = typeof source.asset_id === "string" ? source.asset_id : "";
  const publicId = typeof source.public_id === "string" ? source.public_id : "";
  const signature = typeof source.signature === "string" ? source.signature : "";
  const secureUrl = typeof source.secure_url === "string" ? source.secure_url : "";
  const resourceType = typeof source.resource_type === "string" ? source.resource_type : "";
  const format = typeof source.format === "string" ? source.format.toLowerCase() : "";
  const version = integer(source.version);
  const sizeBytes = integer(source.bytes);
  const rawDuration = typeof source.duration === "number" ? source.duration : Number(source.duration);
  const durationMs = Number.isFinite(rawDuration) && rawDuration > 0 ? Math.round(rawDuration * 1_000) : null;
  const mimeType = audioMimeType(format);
  if (!assetId || assetId.length > 255 || !publicId || publicId.length > 500 || !signature || !secureUrl || !mimeType) return null;
  if (!publicId.startsWith(`hanziwork/practice-audio/${exerciseId}/`)) return null;
  if (resourceType !== "video" || !allowedFormatSet.has(format) || version === null || version <= 0) return null;
  if (sizeBytes === null || sizeBytes <= 0 || sizeBytes > MAX_PRACTICE_AUDIO_BYTES) return null;
  if (durationMs !== null && durationMs > MAX_PRACTICE_AUDIO_DURATION_MS) return null;
  const expectedSignature = cloudinary.utils.api_sign_request({ public_id: publicId, version: String(version) }, credentials.apiSecret);
  if (signature !== expectedSignature) return null;
  try {
    const parsedUrl = new URL(secureUrl);
    if (parsedUrl.protocol !== "https:" || parsedUrl.hostname !== "res.cloudinary.com") return null;
    if (!parsedUrl.pathname.startsWith(`/${credentials.cloudName}/video/upload/`)) return null;
  } catch {
    return null;
  }
  return { assetId, publicId, version, secureUrl, format, mimeType, sizeBytes, durationMs };
}

export async function uploadPracticeAudioBuffer(input: {
  content: Uint8Array;
  publicId: string;
  overwrite?: boolean;
}): Promise<CloudinaryPracticeAudio> {
  const credentials = requireCredentials();
  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({
      resource_type: "video",
      public_id: input.publicId,
      overwrite: input.overwrite ?? false,
      allowed_formats: [...allowedFormats],
      tags: ["hanziwork", "practice-audio", "legacy-migration"],
    }, (error, response) => {
      if (error || !response) reject(error ?? new Error("Cloudinary không trả dữ liệu upload."));
      else resolve(response);
    });
    stream.end(Buffer.from(input.content));
  });
  const mimeType = audioMimeType(result.format);
  if (!mimeType || result.resource_type !== "video" || !result.secure_url) throw new Error("Cloudinary trả về asset audio không hợp lệ.");
  const expectedSignature = cloudinary.utils.api_sign_request({ public_id: result.public_id, version: String(result.version) }, credentials.apiSecret);
  if (result.signature !== expectedSignature) throw new Error("Chữ ký phản hồi Cloudinary không hợp lệ.");
  return {
    assetId: result.asset_id,
    publicId: result.public_id,
    version: result.version,
    secureUrl: result.secure_url,
    format: result.format,
    mimeType,
    sizeBytes: result.bytes,
    durationMs: typeof result.duration === "number" ? Math.round(result.duration * 1_000) : null,
  };
}

export async function deleteCloudinaryPracticeAudio(publicId: string): Promise<void> {
  if (!readCloudinaryCredentials()) return;
  requireCredentials();
  await cloudinary.uploader.destroy(publicId, { resource_type: "video", invalidate: true });
}
