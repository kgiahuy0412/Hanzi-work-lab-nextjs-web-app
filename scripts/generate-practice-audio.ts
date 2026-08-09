import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { getPracticeListeningStatement, practiceScenarios } from "../lib/practice-content.ts";
import { detectPracticeAudioMime } from "../lib/practice-audio-validation.ts";

const outputDirectory = resolve(process.cwd(), "content", "practice-audio");
const manifestPath = resolve(outputDirectory, "manifest.json");
const force = process.argv.includes("--force");
const rate = "-8%";

const industryVoices: Record<string, string> = {
  office: "zh-CN-XiaoxiaoNeural",
  factory: "zh-CN-YunxiNeural",
  logistics: "zh-CN-YunxiNeural",
  sales: "zh-CN-XiaoxiaoNeural",
  restaurant: "zh-CN-XiaoxiaoNeural",
  ecommerce: "zh-CN-XiaoxiaoNeural",
  core: "zh-CN-YunxiNeural",
};

function runEdgeTts(text: string, voice: string, outputBase: string) {
  const npmExecPath = process.env.npm_execpath;
  if (!npmExecPath) throw new Error("Hãy chạy script qua npm run practice:audio:generate.");
  execFileSync(process.execPath, [
    npmExecPath,
    "exec",
    "--yes",
    "--package=@andresaya/edge-tts",
    "--",
    "edge-tts",
    "synthesize",
    "--text",
    text,
    "--voice",
    voice,
    `--rate=${rate}`,
    "--output",
    outputBase,
  ], {
    stdio: "inherit",
  });
}

function readDurationMs(filePath: string): number | null {
  try {
    const duration = execFileSync("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      filePath,
    ], { encoding: "utf8" }).trim();
    const durationMs = Math.round(Number(duration) * 1_000);
    return Number.isFinite(durationMs) && durationMs > 0 ? durationMs : null;
  } catch {
    return null;
  }
}

mkdirSync(outputDirectory, { recursive: true });

const items = [];
for (const scenario of practiceScenarios) {
  const voice = industryVoices[scenario.industry] ?? "zh-CN-XiaoxiaoNeural";
  for (const exercise of scenario.exercises) {
    const statement = getPracticeListeningStatement(exercise, scenario);
    const fileName = `${exercise.id}.mp3`;
    const filePath = resolve(outputDirectory, fileName);
    const outputBase = `content/practice-audio/${exercise.id}`;

    if (force || !existsSync(filePath)) {
      console.log(`Tạo ${fileName} · ${voice}`);
      runEdgeTts(statement.text, voice, outputBase);
    } else {
      console.log(`Giữ ${fileName} đã có`);
    }

    if (!existsSync(filePath)) throw new Error(`Không tạo được ${fileName}.`);
    const bytes = readFileSync(filePath);
    const mimeType = detectPracticeAudioMime(bytes);
    if (mimeType !== "audio/mpeg") throw new Error(`${fileName} không phải MP3 hợp lệ.`);

    items.push({
      scenarioSlug: scenario.id,
      exerciseSlug: exercise.id,
      fileName,
      listeningText: statement.text,
      isStatementCorrect: statement.isCorrect,
      voice,
      rate,
      mimeType,
      sizeBytes: bytes.byteLength,
      durationMs: readDurationMs(filePath),
      checksumSha256: createHash("sha256").update(bytes).digest("hex"),
    });
  }
}

writeFileSync(manifestPath, `${JSON.stringify({
  version: 1,
  generatedAt: new Date().toISOString(),
  generator: "@andresaya/edge-tts",
  locale: "zh-CN",
  items,
}, null, 2)}\n`, "utf8");

console.log(`Đã chuẩn bị ${items.length} audio tại ${outputDirectory}.`);
