import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

test("the textbook bundle supplies all 15 HSK 1 lessons for the four learning modes", async () => {
  const contentModule = await import("../lib/hsk-lesson-content.ts").catch(() => null);
  assert.ok(contentModule, "the HSK lesson content module should exist");

  assert.equal(contentModule.HSK_LESSONS.length, 15);
  assert.equal(contentModule.HSK_LESSONS.reduce((total, item) => total + item.vocabulary.length, 0), 172);
  assert.equal(contentModule.HSK_LESSONS.reduce((total, item) => total + item.grammar.length, 0), 45);
  assert.equal(contentModule.HSK_LESSONS.reduce((total, item) => total + item.dialogues.length, 0), 45);
  assert.equal(contentModule.HSK_LESSONS.reduce((total, item) => total + item.exercises.length, 0), 30);
  assert.equal(contentModule.HSK_LESSONS.reduce((total, item) => total + item.writingCharacters.length, 0), 172);
  assert.ok(contentModule.HSK_LESSONS.every((item) => item.writingCharacters.length === item.vocabulary.length));
  assert.ok(contentModule.HSK_LESSONS.every((item) => (
    item.writingCharacters.every((writingItem, index) => writingItem.id === item.vocabulary[index].id)
  )));
  assert.ok(contentModule.HSK_LESSONS.every((item) => item.vocabulary.every((word) => word.example && word.examplePinyin && word.translation)));

  const lesson = contentModule.getHskLessonContent("hsk-1", "hsk1-bai-01-chao-anh");
  assert.ok(lesson, "the selected HSK 1 lesson should have learning content");
  assert.equal(lesson.title, "Chào anh!");
  assert.equal(lesson.vocabulary.length, 6);
  assert.deepEqual(lesson.modes, ["vocabulary", "exercise", "pronunciation", "hanzi"]);
  assert.equal(lesson.dialogues.length, 3);
  assert.equal(lesson.pronunciationTopics.length, 4);
  assert.ok(lesson.exercises.some((exercise) => exercise.type === "pinyin"));
  assert.ok(lesson.exercises.some((exercise) => exercise.type === "meaning"));
  assert.equal(lesson.writingCharacters.length, 6);
  assert.ok(lesson.vocabulary.every((word) => word.example && word.translation));
  assert.equal(contentModule.getHskLessonContent("hsk-1", "hsk-1-lam-quen-lan-dau")?.id, lesson.id, "the previous lesson URL should remain compatible");
});

test("HSK lesson progress reaches completion only after all four modes are completed", async () => {
  const [contentModule, progressModule] = await Promise.all([
    import("../lib/hsk-lesson-content.ts").catch(() => null),
    import("../lib/hsk-lesson-progress.ts").catch(() => null),
  ]);
  assert.ok(contentModule, "the HSK lesson content module should exist");
  assert.ok(progressModule, "the HSK lesson progress module should exist");

  const lesson = contentModule.getHskLessonContent("hsk-1", "hsk1-bai-01-chao-anh");
  assert.ok(lesson);

  const partial = {
    vocabulary: [lesson.vocabulary[0].id],
    pronunciation: [],
    exerciseBestPercent: 0,
    writing: [],
  };
  assert.ok(progressModule.calculateHskLessonProgress(lesson, partial) > 0);
  assert.ok(progressModule.calculateHskLessonProgress(lesson, partial) < 100);

  const complete = {
    vocabulary: lesson.vocabulary.map((word) => word.id),
    pronunciation: lesson.vocabulary.map((word) => word.id),
    exerciseBestPercent: 100,
    writing: lesson.writingCharacters.map((character) => character.id),
  };
  assert.equal(progressModule.calculateHskLessonProgress(lesson, complete), 100);
  assert.deepEqual(progressModule.parseHskLessonProgress("not-json"), progressModule.EMPTY_HSK_LESSON_PROGRESS);
});

test("HSK lesson workspace exposes the four requested learning tabs", async (t) => {
  const server = await createServer({
    appType: "custom",
    cacheDir: path.join(os.tmpdir(), "himi-vite-tests", "hsk-lesson"),
    configFile: false,
    resolve: {
      alias: [
        { find: "next/image", replacement: path.resolve("tests/fixtures/next-image.tsx") },
        { find: "@", replacement: process.cwd() },
      ],
    },
    root: process.cwd(),
    server: { hmr: { port: 24781 }, middlewareMode: true },
  });
  t.after(() => server.close());

  const [viewModule, flashcardModule, contentModule] = await Promise.all([
    server.ssrLoadModule("/components/hsk-lesson-workspace.tsx").catch(() => null),
    server.ssrLoadModule("/components/hsk-flashcard-session.tsx").catch(() => null),
    server.ssrLoadModule("/lib/hsk-lesson-content.ts").catch(() => null),
  ]);
  assert.ok(viewModule, "the HSK lesson workspace should be renderable");
  assert.ok(flashcardModule, "the HSK flashcard session should be renderable");
  assert.ok(contentModule, "the HSK lesson content should be renderable");

  const lesson = contentModule.getHskLessonContent("hsk-1", "hsk1-bai-01-chao-anh");
  const html = renderToStaticMarkup(React.createElement(viewModule.HskLessonWorkspace, { lesson }));
  assert.match(html, /role="tablist"/);
  assert.match(html, />Từ vựng</);
  assert.match(html, />Bài tập</);
  assert.match(html, />Phát âm</);
  assert.match(html, />Chữ Hán</);
  assert.match(html, /6 từ trọng tâm/);
  assert.match(html, /href="\/hsk\/1\/hsk1-bai-01-chao-anh\/play"/);
  assert.match(html, />Bắt đầu học</);
  assert.match(html, /href="\/hsk\/1\/hsk1-bai-01-chao-anh\/flashcard"/);
  assert.match(html, />Flashcard</);
  assert.match(html, /href="\/hsk\/1\/hsk1-bai-01-chao-anh\/quiz"/);
  assert.match(html, />Quiz</);

  const flashcardHtml = renderToStaticMarkup(React.createElement(flashcardModule.HskFlashcardSession, {
    backHref: "/hsk/1/hsk1-bai-01-chao-anh",
    lesson,
  }));
  assert.match(flashcardHtml, /game-immersive-dashboard/);
  assert.match(flashcardHtml, /TIẾN ĐỘ/);
  assert.match(flashcardHtml, /1 \/ 6/);
  assert.match(flashcardHtml, /Lật thẻ xem nghĩa/);
  assert.match(flashcardHtml, /Nghe phát âm/);
  assert.match(flashcardHtml, /Cần ôn lại/);
  assert.match(flashcardHtml, /Đã nhớ/);
});
