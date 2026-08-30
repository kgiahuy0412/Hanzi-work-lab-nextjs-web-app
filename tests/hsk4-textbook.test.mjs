import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

test("HSK 4 lower textbook converts all lessons into the HSK 1 learning shape", async () => {
  const [contentModule, curriculumModule, guidedModule] = await Promise.all([
    import("../lib/hsk4-textbook-content.ts"),
    import("../lib/hsk-curriculum.ts"),
    import("../lib/hsk-guided-lesson.ts"),
  ]);

  const lessons = contentModule.HSK4_TEXTBOOK_LESSONS;
  assert.equal(lessons.length, 10);
  assert.equal(lessons.reduce((total, lesson) => total + lesson.vocabulary.length, 0), 311);
  assert.equal(lessons.reduce((total, lesson) => total + lesson.dialogues.length, 0), 50);
  assert.equal(lessons.reduce((total, lesson) => total + lesson.grammar.length, 0), 50);
  assert.equal(lessons.reduce((total, lesson) => total + lesson.exercises.length, 0), 40);
  assert.ok(lessons.every((lesson) => lesson.modes.join(",") === "vocabulary,exercise,pronunciation,hanzi"));
  assert.ok(lessons.every((lesson) => lesson.vocabulary.length > 0));
  assert.ok(lessons.every((lesson) => lesson.dialogues.length === 5));
  assert.ok(lessons.every((lesson) => lesson.grammar.length === 5));
  assert.ok(lessons.every((lesson) => lesson.grammar.every((point) => point.examples.length > 0)));
  assert.ok(lessons.every((lesson) => lesson.pronunciationTopics.length === 6));
  assert.ok(lessons.every((lesson) => lesson.writingCharacters.length === lesson.vocabulary.length));
  assert.ok(lessons.every((lesson) => lesson.writingCharacters.every((item, index) => item.id === lesson.vocabulary[index].id)));
  assert.ok(lessons.every((lesson) => lesson.exercises.every((exercise) => exercise.answer && exercise.options.length === 4 && exercise.options.includes(exercise.answer))));

  const lesson = contentModule.getHsk4TextbookLessonContent("hsk-4", "hsk4l-tb-lesson-11");
  assert.ok(lesson);
  assert.equal(lesson.title, "Đọc sách có rất nhiều lợi ích, đọc sách hay, thích đọc sách");
  assert.equal(lesson.greeting, "读书好，读好书，好读书");
  assert.deepEqual(
    {
      vocabulary: lesson.vocabulary.length,
      grammar: lesson.grammar.length,
      dialogues: lesson.dialogues.length,
      pronunciation: lesson.pronunciationTopics.length,
      exercises: lesson.exercises.length,
      writing: lesson.writingCharacters.length,
    },
    { vocabulary: 30, grammar: 5, dialogues: 5, pronunciation: 6, exercises: 4, writing: 30 },
  );
  assert.equal(lesson.vocabulary[0].hanzi, "流利");
  assert.match(lesson.vocabulary[0].meaning.toLowerCase(), /thông thạo/u);
  assert.match(lesson.vocabulary[0].examplePinyin, /liúlì/u);
  assert.match(lesson.dialogues[0].turns[0].translation.toLowerCase(), /trôi chảy/u);
  assert.match(lesson.grammar[0].title, /连/u);
  assert.ok(lesson.grammar.every((point) => point.examples.length > 0));

  assert.equal(contentModule.getHsk4TextbookLessonContent("hsk-3", lesson.id), undefined);
  const hsk4 = curriculumModule.HSK_CURRICULUM.find((level) => level.id === "hsk-4");
  assert.ok(hsk4);
  assert.equal(hsk4.topics.length, 4);
  assert.equal(hsk4.topics.flatMap((topic) => topic.lessons).length, 20);
  assert.ok(hsk4.topics.flatMap((topic) => topic.lessons).every((item) => item.kind === "textbook" && item.available));
  assert.deepEqual(hsk4.topics[2].lessons[0], {
    id: "hsk4l-tb-lesson-11",
    lessonNumber: 11,
    title: "Đọc sách có rất nhiều lợi ích, đọc sách hay, thích đọc sách",
    kind: "textbook",
    vocabulary: 30,
    grammar: 5,
    dialogues: 5,
    writing: 30,
    exercises: 4,
    minutes: 35,
    guidedSteps: 48,
    available: true,
  });

  const sections = guidedModule.buildHskGuidedSections(lesson).map((section) => section.label);
  assert.deepEqual(sections, ["Giới thiệu", "Từ vựng", "Ngữ pháp", "Hội thoại", "Phát âm", "Luyện viết", "Luyện tập", "Hoàn thành"]);
});

test("HSK 4 renders through the same workspace, guided lesson and flashcard components as HSK 1", async (t) => {
  const server = await createServer({
    appType: "custom",
    cacheDir: path.join(os.tmpdir(), "himi-vite-tests", "hsk4-textbook"),
    configFile: false,
    resolve: {
      alias: [
        { find: "next/image", replacement: path.resolve("tests/fixtures/next-image.tsx") },
        { find: "@", replacement: process.cwd() },
      ],
    },
    root: process.cwd(),
    server: { hmr: { port: 24788 }, middlewareMode: true },
  });
  t.after(() => server.close());

  const [workspaceModule, guidedViewModule, flashcardModule, contentModule] = await Promise.all([
    server.ssrLoadModule("/components/hsk-lesson-workspace.tsx"),
    server.ssrLoadModule("/components/hsk-guided-lesson.tsx"),
    server.ssrLoadModule("/components/hsk-flashcard-session.tsx"),
    server.ssrLoadModule("/lib/hsk4-textbook-content.ts"),
  ]);
  const lesson = contentModule.getHsk4TextbookLessonContent("hsk-4", "hsk4l-tb-lesson-11");
  assert.ok(lesson);

  const workspaceHtml = renderToStaticMarkup(React.createElement(workspaceModule.HskLessonWorkspace, { lesson }));
  assert.match(workspaceHtml, /HSK 4 · 35 phút/);
  assert.match(workspaceHtml, />Từ vựng</);
  assert.match(workspaceHtml, />Bài tập</);
  assert.match(workspaceHtml, />Phát âm</);
  assert.match(workspaceHtml, />Chữ Hán</);
  assert.match(workspaceHtml, /流利/);
  assert.match(workspaceHtml, /href="\/hsk\/4\/hsk4l-tb-lesson-11\/play"/);
  assert.match(workspaceHtml, /href="\/hsk\/4\/hsk4l-tb-lesson-11\/flashcard"/);
  assert.match(workspaceHtml, /href="\/hsk\/4\/hsk4l-tb-lesson-11\/quiz"/);

  const guidedHtml = renderToStaticMarkup(React.createElement(guidedViewModule.HskGuidedLesson, { lesson }));
  for (const label of ["Giới thiệu", "Từ vựng", "Ngữ pháp", "Hội thoại", "Phát âm", "Luyện viết", "Luyện tập", "Hoàn thành"]) {
    assert.match(guidedHtml, new RegExp(`>${label}`));
  }

  const flashcardHtml = renderToStaticMarkup(React.createElement(flashcardModule.HskFlashcardSession, {
    lesson,
    backHref: "/hsk/4/hsk4l-tb-lesson-11",
  }));
  assert.match(flashcardHtml, /Flashcard HSK 4/);
  assert.match(flashcardHtml, /流利/);
  assert.match(flashcardHtml, /thông thạo/i);
});
