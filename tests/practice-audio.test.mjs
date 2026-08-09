import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import {
  detectPracticeAudioMime,
  MAX_PRACTICE_AUDIO_BYTES,
  parseAudioDurationMs,
  safeAudioOriginalName,
} from "../lib/practice-audio-validation.ts";
import { getPracticeListeningStatement, practiceScenarios } from "../lib/practice-content.ts";

test("practice audio validates file signatures instead of trusting extensions", () => {
  assert.equal(detectPracticeAudioMime(new Uint8Array([0x49, 0x44, 0x33, 0x04])), "audio/mpeg");
  assert.equal(detectPracticeAudioMime(new Uint8Array([0xff, 0xf3, 0x64, 0xc4])), "audio/mpeg");
  assert.equal(detectPracticeAudioMime(new Uint8Array([0xff, 0xf1, 0x50, 0x80])), "audio/aac");
  assert.equal(detectPracticeAudioMime(new Uint8Array([0x4f, 0x67, 0x67, 0x53])), "audio/ogg");
  assert.equal(detectPracticeAudioMime(new Uint8Array([0x1a, 0x45, 0xdf, 0xa3])), "audio/webm");
  assert.equal(detectPracticeAudioMime(new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x41, 0x56, 0x45])), "audio/wav");
  assert.equal(detectPracticeAudioMime(new TextEncoder().encode("not an audio file")), null);
  assert.equal(MAX_PRACTICE_AUDIO_BYTES, 8 * 1024 * 1024);
});

test("practice audio metadata stays bounded and filenames are safe", () => {
  assert.equal(parseAudioDurationMs("8500"), 8500);
  assert.equal(parseAudioDurationMs("9999999"), null);
  assert.equal(safeAudioOriginalName("../ca\\nghe.mp3"), "..-ca-nghe.mp3");
});

test("seeded practice audio covers every exercise and matches its manifest", () => {
  const directory = resolve(process.cwd(), "content", "practice-audio");
  const manifest = JSON.parse(readFileSync(resolve(directory, "manifest.json"), "utf8"));
  const expected = new Map(practiceScenarios.flatMap((scenario) => (
    scenario.exercises.map((exercise) => {
      const statement = getPracticeListeningStatement(exercise, scenario);
      return [exercise.id, { scenarioSlug: scenario.id, ...statement }];
    })
  )));

  assert.equal(manifest.version, 1);
  assert.equal(manifest.items.length, expected.size);
  assert.equal(new Set(manifest.items.map((item) => item.exerciseSlug)).size, expected.size);

  for (const item of manifest.items) {
    const statement = expected.get(item.exerciseSlug);
    assert.ok(statement, `unexpected exercise ${item.exerciseSlug}`);
    assert.equal(item.scenarioSlug, statement.scenarioSlug);
    assert.equal(item.listeningText, statement.text);
    assert.equal(item.isStatementCorrect, statement.isCorrect);
    assert.ok(item.durationMs > 0 && item.durationMs <= 5 * 60 * 1_000);

    const filePath = resolve(directory, item.fileName);
    assert.equal(existsSync(filePath), true, `missing ${item.fileName}`);
    const bytes = readFileSync(filePath);
    assert.equal(bytes.byteLength, item.sizeBytes);
    assert.equal(detectPracticeAudioMime(bytes), "audio/mpeg");
    assert.equal(createHash("sha256").update(bytes).digest("hex"), item.checksumSha256);
  }
});

test("stored listening transcript controls the true or false judgement", () => {
  const exercise = {
    id: "audio-truth",
    eyebrow: "Nghe và chọn",
    prompt: "Câu này có phù hợp không?",
    chinese: "我不知道。",
    listeningText: "我不知道。",
    isStatementCorrect: false,
    options: ["我马上处理。", "我不知道。"],
    correctOption: 0,
    explanation: "Cần phản hồi chủ động.",
  };
  const statement = getPracticeListeningStatement(exercise, {
    sentenceZh: "我马上处理。",
    brief: "Phản hồi chủ động",
    focus: ["Chủ động"],
    exercises: [exercise],
  });
  assert.equal(statement.text, "我不知道。");
  assert.equal(statement.isCorrect, false);
  assert.equal(statement.correctText, "我马上处理。");
});
