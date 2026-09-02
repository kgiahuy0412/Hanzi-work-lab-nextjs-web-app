export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
export const AVATAR_ACCEPT = "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";

const supportedAvatarMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export function isValidAvatarUploadMetadata(fileSize: number, mimeType: string): boolean {
  return Number.isInteger(fileSize)
    && fileSize > 0
    && fileSize <= MAX_AVATAR_BYTES
    && supportedAvatarMimeTypes.has(mimeType.toLowerCase());
}

