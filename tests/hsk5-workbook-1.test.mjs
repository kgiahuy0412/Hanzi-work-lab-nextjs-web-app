import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

test("HSK 5 workbook 1 converts all lessons into the HSK 1 learning shape", async () => {
  const [contentModule, curriculumModule, guidedModule] = await Promise.all([
    import("../lib/hsk5-workbook-1-content.ts"),
    import("../lib/hsk-curriculum.ts"),
    import("../lib/hsk-guided-lesson.ts"),
  ]);

  const lessons = contentModule.HSK5_WORKBOOK_1_LESSONS;
  assert.equal(lessons.length, 18);
  assert.equal(lessons.reduce((total, lesson) => total + lesson.vocabulary.length, 0), 90);
  assert.equal(lessons.reduce((total, lesson) => total + lesson.grammar.length, 0), 54);
  assert.equal(lessons.reduce((total, lesson) => total + lesson.dialogues.length, 0), 252);
  assert.equal(lessons.reduce((total, lesson) => total + lesson.exercises.length, 0), 72);
  assert.equal(lessons.reduce((total, lesson) => total + lesson.writingCharacters.length, 0), 90);
  assert.ok(lessons.every((lesson) => lesson.modes.join(",") === "vocabulary,exercise,pronunciation,hanzi"));
  assert.ok(lessons.every((lesson) => lesson.vocabulary.length === 5));
  assert.ok(lessons.every((lesson) => lesson.grammar.length === 3));
  assert.ok(lessons.every((lesson) => lesson.grammar.every((point) => point.examples.length > 0)));
  assert.ok(lessons.every((lesson) => lesson.dialogues.length === 14));
  assert.ok(lessons.every((lesson) => lesson.dialogues.every((dialogue) => dialogue.turns.length === 1)));
  assert.ok(lessons.every((lesson) => lesson.pronunciationTopics.length === 16));
  assert.ok(lessons.every((lesson) => lesson.writingCharacters.length === lesson.vocabulary.length));
  assert.ok(lessons.every((lesson) => lesson.exercises.every((exercise) => (
    exercise.answer
    && exercise.options.length === 4
    && exercise.options.includes(exercise.answer)
  ))));

  const lesson = contentModule.getHsk5Workbook1LessonContent("hsk-5", "hsk5w1-lesson-01");
  assert.ok(lesson);
  assert.equal(lesson.title, "Những chi tiết của tình yêu");
  assert.equal(lesson.greeting, "爱的细节");
  assert.equal(lesson.vocabulary[0].hanzi, "等待");
  assert.equal(lesson.vocabulary[0].pinyin, "děng dài");
  assert.equal(lesson.vocabulary[0].meaning, "Chờ đợi");
  assert.match(lesson.summary, /32 câu luyện Nghe – Đọc – Viết/u);
  assert.match(lesson.dialogues[0].turns.map((turn) => turn.hanzi).join("\n"), /婚姻/u);
  assert.match(lesson.grammar[0].formula, /放弃了/u);
  assert.equal(contentModule.getHsk5Workbook1LessonContent("hsk-4", lesson.id), undefined);

  const hsk5 = curriculumModule.HSK_CURRICULUM.find((level) => level.id === "hsk-5");
  assert.ok(hsk5);
  assert.equal(hsk5.topics.length, 12);
  assert.equal(hsk5.topics.flatMap((topic) => topic.lessons).length, 36);
  const workbookLessons = hsk5.topics.flatMap((topic) => topic.lessons).filter((item) => item.kind === "workbook");
  assert.equal(workbookLessons.length, 18);
  assert.ok(workbookLessons.every((item) => item.available && item.scoredExercises));
  assert.equal(workbookLessons[0].id, lesson.id);
  assert.equal(workbookLessons[0].listening, 14);
  assert.equal(workbookLessons[0].reading, 14);
  assert.equal(workbookLessons[0].writing, workbookLessons[0].vocabulary);

  const sections = guidedModule.buildHskGuidedSections(lesson).map((section) => section.label);
  assert.deepEqual(sections, ["Giới thiệu", "Từ vựng", "Ngữ pháp", "Hội thoại", "Phát âm", "Luyện viết", "Luyện tập", "Hoàn thành"]);
});

test("HSK 5 workbook 1 renders through the same workspace, guided lesson and flashcard components as HSK 1", async (t) => {
  const server = await createServer({
    appType: "custom",
    cacheDir: path.join(os.tmpdir(), "himi-vite-tests", "hsk5-workbook-1"),
    configFile: false,
    resolve: {
      alias: [
        { find: "next/image", replacement: path.resolve("tests/fixtures/next-image.tsx") },
        { find: "@", replacement: process.cwd() },
      ],
    },
    root: process.cwd(),
    server: { hmr: { port: 24791 }, middlewareMode: true },
  });
  t.after(() => server.close());

  const [workspaceModule, guidedViewModule, flashcardModule, contentModule, resolverModule] = await Promise.all([
    server.ssrLoadModule("/components/hsk-lesson-workspace.tsx"),
    server.ssrLoadModule("/components/hsk-guided-lesson.tsx"),
    server.ssrLoadModule("/components/hsk-flashcard-session.tsx"),
    server.ssrLoadModule("/lib/hsk5-workbook-1-content.ts"),
    server.ssrLoadModule("/lib/hsk-learning-content.ts"),
  ]);
  const lesson = contentModule.getHsk5Workbook1LessonContent("hsk-5", "hsk5w1-lesson-01");
  assert.ok(lesson);
  assert.equal(resolverModule.getHskLearningLessonContent("5", lesson.id)?.id, lesson.id);

  const workspaceHtml = renderToStaticMarkup(React.createElement(workspaceModule.HskLessonWorkspace, { lesson }));
  assert.match(workspaceHtml, /HSK 5 · 40 phút/);
  assert.match(workspaceHtml, />Từ vựng</);
  assert.match(workspaceHtml, />Bài tập</);
  assert.match(workspaceHtml, />Phát âm</);
  assert.match(workspaceHtml, />Chữ Hán</);
  assert.match(workspaceHtml, /等待/);
  assert.match(workspaceHtml, /href="\/hsk\/5\/hsk5w1-lesson-01\/play"/);
  assert.match(workspaceHtml, /href="\/hsk\/5\/hsk5w1-lesson-01\/flashcard"/);
  assert.match(workspaceHtml, /href="\/hsk\/5\/hsk5w1-lesson-01\/quiz"/);

  const guidedHtml = renderToStaticMarkup(React.createElement(guidedViewModule.HskGuidedLesson, { lesson }));
  for (const label of ["Giới thiệu", "Từ vựng", "Ngữ pháp", "Hội thoại", "Phát âm", "Luyện viết", "Luyện tập", "Hoàn thành"]) {
    assert.match(guidedHtml, new RegExp(`>${label}`));
  }

  const flashcardHtml = renderToStaticMarkup(React.createElement(flashcardModule.HskFlashcardSession, {
    lesson,
    backHref: "/hsk/5/hsk5w1-lesson-01",
  }));
  assert.match(flashcardHtml, /Flashcard HSK 5/);
  assert.match(flashcardHtml, /等待/);
  assert.match(flashcardHtml, /Chờ đợi/);
});
