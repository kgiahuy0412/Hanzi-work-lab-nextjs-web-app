import assert from "node:assert/strict";
import test from "node:test";
import {
  getListeningLessonWords,
  listeningLevels,
} from "../lib/listening-content.ts";
import {
  parseListeningProgress,
  recordListeningResult,
} from "../lib/listening-progress.ts";
import { buildListeningRound } from "../lib/listening-session.ts";

test("every HSK listening group exposes four usable lessons", () => {
  assert.equal(listeningLevels.length, 7);
  assert.equal(listeningLevels.flatMap((level) => level.lessons).length, 28);

  for (const level of listeningLevels) {
    assert.equal(level.lessons.length, 4, level.id);
    assert.equal(new Set(level.lessons.map((lesson) => lesson.id)).size, 4, level.id);
    assert.ok(level.words.length >= 12, `${level.id} needs at least twelve words`);

    for (const [index, lesson] of level.lessons.entries()) {
      assert.equal(lesson.levelId, level.id);
      assert.equal(lesson.order, index + 1);
      assert.equal(lesson.exerciseType, "listen-select-hanzi");
      assert.equal(lesson.wordIds.length, 8);
      assert.equal(new Set(lesson.wordIds).size, 8);
      assert.equal(getListeningLessonWords(level, lesson).length, 8);
    }
  }
});

test("listening lessons only reference words from their parent HSK group", () => {
  for (const level of listeningLevels) {
    const ids = new Set(level.words.map((word) => word.id));
    for (const lesson of level.lessons) {
      assert.deepEqual(
        lesson.wordIds.filter((wordId) => !ids.has(wordId)),
        [],
        `${lesson.id} contains an unknown word`,
      );
    }
  }
});

test("a listening lesson round has ten questions with four unique choices", () => {
  const level = listeningLevels[0];
  const lesson = level.lessons[0];
  const round = buildListeningRound(level, lesson, 10, () => 0.25);

  assert.equal(round.length, 10);
  for (const question of round) {
    assert.equal(question.choices.length, 4);
    assert.equal(new Set(question.choices).size, 4);
    assert.equal(question.choices.filter((choice) => choice === question.word.hanzi).length, 1);
    assert.ok(lesson.wordIds.includes(question.word.id));
  }
});

test("round generation rejects content without four distinct Hanzi choices", () => {
  const source = listeningLevels[0];
  const level = { ...source, words: source.words.slice(0, 3) };
  const lesson = { ...source.lessons[0], wordIds: level.words.map((word) => word.id) };

  assert.throws(() => buildListeningRound(level, lesson), /four unique Hanzi choices/i);
});

test("malformed local listening progress falls back to an empty record", () => {
  assert.deepEqual(parseListeningProgress(null), {});
  assert.deepEqual(parseListeningProgress("not-json"), {});
  assert.deepEqual(parseListeningProgress('{"lesson":{"bestScore":"10"}}'), {});
});

test("recording a result keeps the best score and increments attempts", () => {
  const first = recordListeningResult({}, "hsk-1-lesson-1", 7, 10, "2026-08-28T00:00:00.000Z");
  const second = recordListeningResult(first, "hsk-1-lesson-1", 5, 10, "2026-08-29T00:00:00.000Z");

  assert.deepEqual(second["hsk-1-lesson-1"], {
    bestScore: 7,
    attempts: 2,
    completedAt: "2026-08-29T00:00:00.000Z",
  });
});
