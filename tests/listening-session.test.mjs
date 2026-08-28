import assert from "node:assert/strict";
import test from "node:test";
import {
  getListeningLessonWords,
  listeningLevels,
} from "../lib/listening-content.ts";

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
