import { existsSync } from "node:fs";
import { resolve } from "node:path";
import postgres from "postgres";
import { isCloudinaryPracticeAudioConfigured, uploadPracticeAudioBuffer } from "../lib/cloudinary-practice-audio.ts";

const localEnvPath = resolve(process.cwd(), ".env.local");
if (existsSync(localEnvPath)) process.loadEnvFile(localEnvPath);

if (!process.env.DATABASE_URL) throw new Error("Thiếu DATABASE_URL.");
if (!isCloudinaryPracticeAudioConfigured()) throw new Error("Thiếu CLOUDINARY_URL.");

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

try {
  const assets = await sql<Array<{
    id: string;
    content: Uint8Array;
  }>>`
    select id, content
    from practice_audio_assets
    where content is not null
    and (storage_provider <> 'cloudinary' or cloudinary_secure_url is null)
    order by created_at asc
  `;
  let migrated = 0;
  for (const asset of assets) {
    const uploaded = await uploadPracticeAudioBuffer({
      content: new Uint8Array(asset.content),
      publicId: `hanziwork/practice-audio/legacy/${asset.id}`,
      overwrite: true,
    });
    await sql`
      update practice_audio_assets
      set storage_provider = 'cloudinary',
          cloudinary_asset_id = ${uploaded.assetId},
          cloudinary_public_id = ${uploaded.publicId},
          cloudinary_version = ${uploaded.version},
          cloudinary_secure_url = ${uploaded.secureUrl},
          cloudinary_format = ${uploaded.format},
          mime_type = ${uploaded.mimeType},
          size_bytes = ${uploaded.sizeBytes},
          duration_ms = coalesce(${uploaded.durationMs}, duration_ms),
          content = null
      where id = ${asset.id}
      and content is not null
    `;
    migrated += 1;
    console.log(`Đã chuyển ${migrated}/${assets.length}: ${asset.id}`);
  }
  console.log(assets.length ? `Hoàn tất chuyển ${migrated} audio sang Cloudinary.` : "Không còn audio database cần chuyển.");
} finally {
  await sql.end();
}
