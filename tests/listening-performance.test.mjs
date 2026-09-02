import assert from "node:assert/strict";
import test from "node:test";
import {
  combineListeningPerformance,
  emptyListeningPerformance,
  parseListeningPerformance,
  parseScenarioListeningPerformance,
  recordListeningQuestion,
  summarizeListeningPerformance,
} from "../lib/listening-performance.ts";

test("malformed HSK listening performance falls back to empty totals", () => {
  assert.deepEqual(parseListeningPerformance(null), emptyListeningPerformance);
  assert.deepEqual(parseListeningPerformance("not-json"), emptyListeningPerformance);
  assert.deepEqual(parseListeningPerformance('{"correctAnswers":2,"totalQuestions":1}'), emptyListeningPerformance);
});

test("guest scenario totals can be read by the shared overview report", () => {
  assert.deepEqual(parseScenarioListeningPerformance(JSON.stringify({
    attemptCount: 2,
    correctAnswers: 6,
    totalQuestions: 10,
    totalReactionMs: 31_500,
  })), {
    correctAnswers: 6,
    totalQuestions: 10,
    totalReactionMs: 31_500,
    reactionQuestions: 10,
  });
  assert.deepEqual(parseScenarioListeningPerformance(JSON.stringify({
    attemptCount: 2,
    correctAnswers: 6,
    totalQuestions: 10,
    totalReactionMs: 81_000,
  })), emptyListeningPerformance);
});

test("HSK questions record correctness and bounded reaction time", () => {
  const first = recordListeningQuestion(emptyListeningPerformance, true, 1_250);
  const second = recordListeningQuestion(first, false, 12_000);

  assert.deepEqual(second, {
    correctAnswers: 1,
    totalQuestions: 2,
    totalReactionMs: 9_250,
    reactionQuestions: 2,
  });
});

test("listening report combines HSK and scenario question totals", () => {
  const combined = combineListeningPerformance(
    { correctAnswers: 7, totalQuestions: 10, totalReactionMs: 28_000, reactionQuestions: 10 },
    { correctAnswers: 2, totalQuestions: 3, totalReactionMs: 12_000, reactionQuestions: 3 },
  );

  assert.deepEqual(combined, {
    correctAnswers: 9,
    totalQuestions: 13,
    totalReactionMs: 40_000,
    reactionQuestions: 13,
  });
  assert.deepEqual(summarizeListeningPerformance(combined), {
    accuracyPercent: 69,
    averageReactionMs: 3_077,
  });
});

test("listening report treats fields missing from legacy progress as zero", () => {
  assert.deepEqual(combineListeningPerformance(
    { correctAnswers: undefined, totalQuestions: undefined, totalReactionMs: undefined, reactionQuestions: undefined },
    { correctAnswers: 2, totalQuestions: 3, totalReactionMs: 4_000, reactionQuestions: 3 },
  ), {
    correctAnswers: 2,
    totalQuestions: 3,
    totalReactionMs: 4_000,
    reactionQuestions: 3,
  });
});
