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
import {
  advanceListeningQuestion,
  answerListeningQuestion,
  createInitialListeningState,
  leaveListeningSession,
  selectListeningLevel,
  startListeningLesson,
} from "../lib/listening-studio-state.ts";

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

test("the listening state flows from a selected level into its selected lesson", () => {
  const initial = createInitialListeningState("hsk-1");
  const level = listeningLevels[3];
  const selected = selectListeningLevel(initial, level.id);
  const started = startListeningLesson(selected, level, level.lessons[1], () => 0.25);

  assert.equal(selected.view, "intro");
  assert.equal(selected.selectedLevelId, "hsk-4");
  assert.equal(started.view, "session");
  assert.equal(started.selectedLessonId, "hsk-4-lesson-2");
  assert.equal(started.round.length, 10);
  assert.equal(started.questionIndex, 0);
});

test("a question accepts one answer and advances without losing lesson context", () => {
  const level = listeningLevels[0];
  const started = startListeningLesson(
    createInitialListeningState(level.id),
    level,
    level.lessons[0],
    () => 0.25,
  );
  const question = started.round[0];
  const wrongChoice = question.choices.find((choice) => choice !== question.word.hanzi);
  assert.ok(wrongChoice);

  const answered = answerListeningQuestion(started, wrongChoice);
  const ignoredSecondAnswer = answerListeningQuestion(answered, question.word.hanzi);
  const advanced = advanceListeningQuestion(ignoredSecondAnswer);

  assert.equal(answered.answerStatus, "wrong");
  assert.equal(answered.score, 0);
  assert.deepEqual(ignoredSecondAnswer, answered);
  assert.equal(advanced.questionIndex, 1);
  assert.equal(advanced.answerStatus, "idle");
  assert.equal(advanced.selectedLessonId, level.lessons[0].id);
});

test("the final answered question completes the lesson and returning keeps the level selected", () => {
  const level = listeningLevels[1];
  const started = startListeningLesson(
    createInitialListeningState(level.id),
    level,
    level.lessons[2],
    () => 0.25,
  );
  const finalQuestion = started.round.at(-1);
  assert.ok(finalQuestion);
  const onFinalQuestion = { ...started, questionIndex: started.round.length - 1 };
  const answered = answerListeningQuestion(onFinalQuestion, finalQuestion.word.hanzi);
  const completed = advanceListeningQuestion(answered);
  const catalog = leaveListeningSession(completed);

  assert.equal(completed.view, "complete");
  assert.equal(completed.score, 1);
  assert.equal(catalog.view, "intro");
  assert.equal(catalog.selectedLevelId, level.id);
  assert.equal(catalog.selectedLessonId, level.lessons[2].id);
  assert.equal(catalog.round.length, 0);
});
