import test from "node:test";
import assert from "node:assert/strict";
import { parsePracticeScenarioSnapshot, preparePracticeVersionRestore } from "../lib/practice-version.ts";

function snapshotFixture() {
  return {
    scenario: {
      id: "ignored-id",
      slug: "ignored-slug",
      industryId: "ignored-industry",
      title: "Xác nhận lịch họp",
      brief: "Bản nội dung cũ",
      context: "Văn phòng",
      durationMinutes: 6,
      level: "Thực tế",
      isFree: true,
      sentenceZh: "我确认一下。",
      pinyin: "Wǒ quèrèn yíxià.",
      translation: "Tôi xác nhận lại.",
      focus: ["确认"],
      status: "published",
      sortOrder: 2,
    },
    exercises: [
      {
        id: "ignored-exercise-id",
        scenarioId: "ignored-scenario-id",
        audioAssetId: "audio-kept",
        slug: "confirm-time",
        eyebrow: "Lượt 1",
        prompt: "Câu này có phù hợp không?",
        chinese: "下午两点，对吗？",
        listeningText: "下午两点，对吗？",
        isStatementCorrect: true,
        audioUrl: null,
        options: ["Đúng", "Sai"],
        correctOption: 0,
        explanation: "Xác nhận đúng thời gian.",
        sortOrder: 0,
      },
      {
        audioAssetId: "audio-missing",
        slug: "confirm-room",
        eyebrow: "Lượt 2",
        prompt: "Địa điểm có đúng không?",
        chinese: "不是三号会议室。",
        listeningText: "不是三号会议室。",
        isStatementCorrect: false,
        audioUrl: null,
        options: ["Đúng", "Sai"],
        correctOption: 1,
        explanation: "Địa điểm không khớp.",
        sortOrder: 1,
      },
    ],
  };
}

test("practice version snapshots keep editable content and discard stable database identity", () => {
  const snapshot = parsePracticeScenarioSnapshot(snapshotFixture());
  assert.ok(snapshot);
  assert.equal(snapshot.scenario.title, "Xác nhận lịch họp");
  assert.equal("slug" in snapshot.scenario, false);
  assert.equal("id" in snapshot.exercises[0], false);
  assert.equal(snapshot.exercises.length, 2);
});

test("practice restore keeps available audio and reports assets that have disappeared", () => {
  const snapshot = parsePracticeScenarioSnapshot(snapshotFixture());
  assert.ok(snapshot);
  const restore = preparePracticeVersionRestore(snapshot, new Set(["audio-kept"]));
  assert.equal(restore.exercises[0].audioAssetId, "audio-kept");
  assert.equal(restore.exercises[1].audioAssetId, null);
  assert.deepEqual(restore.missingAudioAssetIds, ["audio-missing"]);
  assert.equal("status" in restore.scenario, false);
});

test("legacy snapshots without listening judgement remain readable", () => {
  const legacy = snapshotFixture();
  delete legacy.exercises[0].audioAssetId;
  delete legacy.exercises[0].listeningText;
  delete legacy.exercises[0].isStatementCorrect;
  const snapshot = parsePracticeScenarioSnapshot(legacy);
  assert.ok(snapshot);
  assert.equal(snapshot.exercises[0].audioAssetId, null);
  assert.equal(snapshot.exercises[0].listeningText, legacy.exercises[0].chinese);
  assert.equal(snapshot.exercises[0].isStatementCorrect, null);
});

test("duplicate exercise slugs make a snapshot unsafe to restore", () => {
  const duplicate = snapshotFixture();
  duplicate.exercises[1].slug = duplicate.exercises[0].slug;
  assert.equal(parsePracticeScenarioSnapshot(duplicate), null);
});
