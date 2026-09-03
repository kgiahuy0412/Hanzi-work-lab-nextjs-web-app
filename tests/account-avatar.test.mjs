import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { v2 as cloudinary } from "cloudinary";
import { MAX_AVATAR_BYTES, isValidAvatarUploadMetadata } from "../lib/avatar-validation.ts";
import { verifyAvatarUploadResponse } from "../lib/cloudinary-avatar.ts";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("avatar upload metadata only accepts supported bounded images", () => {
  assert.equal(isValidAvatarUploadMetadata(1_024, "image/jpeg"), true);
  assert.equal(isValidAvatarUploadMetadata(MAX_AVATAR_BYTES, "image/webp"), true);
  assert.equal(isValidAvatarUploadMetadata(MAX_AVATAR_BYTES + 1, "image/png"), false);
  assert.equal(isValidAvatarUploadMetadata(1_024, "image/svg+xml"), false);
  assert.equal(isValidAvatarUploadMetadata(0, "image/jpeg"), false);
});

test("Cloudinary avatar responses are signed and scoped to the current user", () => {
  const previousCloudinaryUrl = process.env.CLOUDINARY_URL;
  try {
    process.env.CLOUDINARY_URL = "cloudinary://avatar-key:avatar-secret@avatar-cloud";
    const userId = "860309fc-62c5-41df-9377-380c66b94a54";
    const publicId = `hanziwork/avatars/${userId}/eb664c22-101e-4b2e-b27d-ce17a33e4751`;
    const version = 42;
    const response = {
      asset_id: "asset-123",
      public_id: publicId,
      signature: cloudinary.utils.api_sign_request({ public_id: publicId, version: String(version) }, "avatar-secret"),
      secure_url: `https://res.cloudinary.com/avatar-cloud/image/upload/v${version}/${publicId}.webp`,
      resource_type: "image",
      format: "webp",
      version,
      bytes: 82_000,
      width: 640,
      height: 640,
    };

    assert.equal(verifyAvatarUploadResponse(response, userId)?.secureUrl, response.secure_url);
    assert.equal(verifyAvatarUploadResponse(response, "52d27167-f40c-48aa-b412-b5c20679cf54"), null);
    assert.equal(verifyAvatarUploadResponse({ ...response, secure_url: "https://example.com/avatar.webp" }, userId), null);
    assert.equal(verifyAvatarUploadResponse({ ...response, width: 2_048 }, userId), null);
  } finally {
    if (previousCloudinaryUrl === undefined) delete process.env.CLOUDINARY_URL;
    else process.env.CLOUDINARY_URL = previousCloudinaryUrl;
  }
});

test("account avatar flow uploads in the browser, fills every frame, and persists the verified URL", async () => {
  const [component, shell, route, schema, session, layout, styles] = await Promise.all([
    read("components/account-avatar-uploader.tsx"),
    read("components/learner-app-shell.tsx"),
    read("app/api/account/avatar/route.ts"),
    read("db/schema.ts"),
    read("lib/auth-session.ts"),
    read("app/layout.tsx"),
    read("app/globals.css"),
  ]);

  assert.match(component, /type="file"/);
  assert.match(component, /XMLHttpRequest/);
  assert.match(component, /Đổi ảnh đại diện/);
  assert.match(route, /verifyAvatarUploadResponse/);
  assert.match(route, /updateUserAvatar/);
  assert.match(schema, /avatarUrl: text\("avatar_url"\)/);
  assert.match(schema, /avatarPublicId: varchar\("avatar_public_id"/);
  assert.match(session, /avatarUrl: users\.avatarUrl/);
  assert.match(layout, /avatarUrl: user\.avatarUrl/);
  assert.match(component, /account-profile-avatar-media/);
  assert.match(styles, /\.account-profile-avatar-media[^}]*inset: 0/s);
  assert.match(styles, /\.account-profile-avatar-media > \.account-profile-avatar-image[^}]*object-fit: cover/s);
  assert.match(component, /dispatchEvent\(new CustomEvent\("himi:avatar-updated"/);
  assert.match(shell, /addEventListener\("himi:avatar-updated"/);
  assert.match(shell, /className="user-chip-avatar-image"/);
  assert.match(styles, /\.user-chip-avatar > \.user-chip-avatar-image[^}]*width: 100%[^}]*height: 100%[^}]*object-fit: cover/s);
});
