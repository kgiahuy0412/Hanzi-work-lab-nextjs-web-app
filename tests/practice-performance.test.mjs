import assert from "node:assert/strict";
import test from "node:test";
import {
  clampPracticeReactionMs,
  formatPracticeReactionTime,
  PRACTICE_ANSWER_WINDOW_MS,
  summarizePracticePerformance,
} from "../lib/practice-performance.ts";

test("practice answers use an eight-second reaction window", () => {
  assert.equal(PRACTICE_ANSWER_WINDOW_MS, 8_000);
  assert.equal(clampPracticeReactionMs(-10), 0);
  assert.equal(clampPracticeReactionMs(2_345.4), 2_345);
  assert.equal(clampPracticeReactionMs(9_000), 8_000);
});

test("practice performance combines accuracy and weighted reaction speed", () => {
  assert.deepEqual(summarizePracticePerformance([
    { correctAnswers: 2, totalQuestions: 3, totalReactionMs: 9_000 },
    { correctAnswers: 3, totalQuestions: 3, totalReactionMs: 12_000 },
    { correctAnswers: 1, totalQuestions: 2, totalReactionMs: null },
  ]), {
    accuracyPercent: 75,
    averageReactionMs: 3_500,
  });
  assert.equal(formatPracticeReactionTime(3_500), "3.5 giây");
  assert.equal(formatPracticeReactionTime(null), "Chưa có");
});
