import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { and, count, eq, isNotNull, isNull } from "drizzle-orm";
import { closeDb, getDb } from "../db/index.ts";
import { practiceAudioAssets, practiceExercises, practiceScenarios as practiceScenarioTable } from "../db/schema.ts";
import { getPracticeListeningStatement, practiceScenarios } from "../lib/practice-content.ts";
import { detectPracticeAudioMime } from "../lib/practice-audio-validation.ts";

type ManifestItem = {
  scenarioSlug: string;
  exerciseSlug: string;
  fileName: string;
  listeningText: string;
  isStatementCorrect: boolean;
  mimeType: string;
  sizeBytes: number;
  durationMs: number | null;
  checksumSha256: string;
};

const localEnvPath = resolve(process.cwd(), ".env.local");
if (existsSync(localEnvPath)) process.loadEnvFile(localEnvPath);

const audioDirectory = resolve(process.cwd(), "content", "practice-audio");
const manifestPath = resolve(audioDirectory, "manifest.json");

function loadManifest(): ManifestItem[] {
  if (!existsSync(manifestPath)) throw new Error("Chưa có manifest. Chạy npm run practice:audio:generate trước.");
  const parsed = JSON.parse(readFileSync(manifestPath, "utf8")) as { version?: number; items?: ManifestItem[] };
  if (parsed.version !== 1 || !Array.isArray(parsed.items) || parsed.items.length === 0) {
    throw new Error("Manifest audio không hợp lệ.");
  }
  return parsed.items;
}

async function seedPracticeAudio() {
  const manifest = loadManifest();
  const expectedStatements = new Map(
    practiceScenarios.flatMap((scenario) => scenario.exercises.map((exercise) => {
      const statement = getPracticeListeningStatement(exercise, scenario);
      return [exercise.id, {
        scenarioSlug: scenario.id,
        isFree: scenario.isFree,
        text: statement.text,
        isCorrect: statement.isCorrect,
      }] as const;
    })),
  );
  if (manifest.length !== expectedStatements.size) {
    throw new Error(`Manifest có ${manifest.length} mục nhưng toàn bộ Luyện ca cần ${expectedStatements.size}.`);
  }

  const db = getDb();
  let attached = 0;
  let preserved = 0;

  await db.transaction(async (tx) => {
    for (const item of manifest) {
      const expected = expectedStatements.get(item.exerciseSlug);
      if (!expected
        || expected.scenarioSlug !== item.scenarioSlug
        || expected.text !== item.listeningText
        || expected.isCorrect !== item.isStatementCorrect) {
        throw new Error(`Manifest không khớp nội dung ${item.exerciseSlug}.`);
      }

      const [exercise] = await tx.select({ id: practiceExercises.id, audioAssetId: practiceExercises.audioAssetId })
        .from(practiceExercises)
        .innerJoin(practiceScenarioTable, eq(practiceExercises.scenarioId, practiceScenarioTable.id))
        .where(and(
          eq(practiceScenarioTable.slug, item.scenarioSlug),
          eq(practiceExercises.slug, item.exerciseSlug),
        ))
        .limit(1);
      if (!exercise) throw new Error(`Không tìm thấy exercise ${item.exerciseSlug} trong PostgreSQL.`);
      if (exercise.audioAssetId) {
        preserved += 1;
        continue;
      }

      const filePath = resolve(audioDirectory, item.fileName);
      if (!existsSync(filePath)) throw new Error(`Thiếu tệp ${item.fileName}.`);
      const bytes = readFileSync(filePath);
      const checksumSha256 = createHash("sha256").update(bytes).digest("hex");
      const mimeType = detectPracticeAudioMime(bytes);
      if (checksumSha256 !== item.checksumSha256 || bytes.byteLength !== item.sizeBytes || mimeType !== item.mimeType) {
        throw new Error(`${item.fileName} không còn khớp manifest.`);
      }

      const [inserted] = await tx.insert(practiceAudioAssets).values({
        originalName: item.fileName,
        mimeType,
        sizeBytes: bytes.byteLength,
        durationMs: item.durationMs,
        checksumSha256,
        content: new Uint8Array(bytes),
      }).onConflictDoNothing().returning({ id: practiceAudioAssets.id });
      const asset = inserted ?? (await tx.select({ id: practiceAudioAssets.id })
        .from(practiceAudioAssets)
        .where(eq(practiceAudioAssets.checksumSha256, checksumSha256))
        .limit(1))[0];
      if (!asset) throw new Error(`Không thể lưu asset ${item.fileName}.`);

      const updated = await tx.update(practiceExercises)
        .set({
          audioAssetId: asset.id,
          audioReviewStatus: expected.isFree ? "approved" : "pending",
          audioReviewIssues: [],
          audioReviewNotes: null,
          audioReviewedBy: null,
          audioReviewedAt: null,
          updatedAt: new Date(),
        })
        .where(and(eq(practiceExercises.id, exercise.id), isNull(practiceExercises.audioAssetId)))
        .returning({ id: practiceExercises.id });
      attached += updated.length;
      if (updated.length === 0) preserved += 1;
    }
  });

  const [{ value: ready }] = await db.select({ value: count() })
    .from(practiceExercises)
    .innerJoin(practiceScenarioTable, eq(practiceExercises.scenarioId, practiceScenarioTable.id))
    .where(isNotNull(practiceExercises.audioAssetId));

  console.log(`Audio Luyện ca: gắn mới ${attached}, giữ nguyên ${preserved}, sẵn sàng ${ready}/${manifest.length}.`);
}

seedPracticeAudio()
  .catch((error) => {
    console.error("Seed audio Luyện ca thất bại:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(closeDb);
