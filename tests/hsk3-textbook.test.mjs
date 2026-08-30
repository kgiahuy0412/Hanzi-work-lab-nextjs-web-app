import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

test("HSK 3 converts all textbook lessons into the HSK 1 learning shape", async () => {
  const [contentModule, curriculumModule, guidedModule] = await Promise.all([
    import("../lib/hsk3-textbook-content.ts"),
    import("../lib/hsk-curriculum.ts"),
    import("../lib/hsk-guided-lesson.ts"),
  ]);

  const lessons = contentModule.HSK3_TEXTBOOK_LESSONS;
  assert.equal(lessons.length, 20);
  assert.equal(lessons.reduce((total, lesson) => total + lesson.vocabulary.length, 0), 314);
  assert.equal(lessons.reduce((total, lesson) => total + lesson.dialogues.length, 0), 76);
  assert.equal(lessons.reduce((total, lesson) => total + lesson.grammar.length, 0), 20);
  assert.equal(lessons.reduce((total, lesson) => total + lesson.exercises.length, 0), 80);
  assert.ok(lessons.every((lesson) => lesson.modes.join(",") === "vocabulary,exercise,pronunciation,hanzi"));
  assert.ok(lessons.every((lesson) => lesson.vocabulary.length > 0));
  assert.ok(lessons.every((lesson) => lesson.pronunciationTopics.length > 0));
  assert.ok(lessons.every((lesson) => lesson.writingCharacters.length === lesson.vocabulary.length));
  assert.ok(lessons.every((lesson) => lesson.writingCharacters.every((item, index) => item.id === lesson.vocabulary[index].id)));
  assert.ok(lessons.every((lesson) => lesson.exercises.every((exercise) => exercise.answer && exercise.options.includes(exercise.answer))));

  const lesson = contentModule.getHsk3TextbookLessonContent("hsk-3", "hsk3-tb-lesson-01");
  assert.ok(lesson);
  assert.equal(lesson.title, "Anh dự định làm gì vào cuối tuần vậy?");
  assert.equal(lesson.greeting, "周末你有什么打算？");
  assert.deepEqual(
    {
      vocabulary: lesson.vocabulary.length,
      grammar: lesson.grammar.length,
      dialogues: lesson.dialogues.length,
      pronunciation: lesson.pronunciationTopics.length,
      exercises: lesson.exercises.length,
      writing: lesson.writingCharacters.length,
    },
    { vocabulary: 15, grammar: 1, dialogues: 4, pronunciation: 5, exercises: 4, writing: 15 },
  );
  assert.equal(lesson.vocabulary[0].hanzi, "周末");
  assert.equal(lesson.vocabulary[0].meaning, "cuối tuần");
  assert.match(lesson.vocabulary[0].examplePinyin, /zhōumò/u);
  assert.match(lesson.vocabulary[0].translation, /cuối tuần/u);
  assert.match(lesson.dialogues[0].turns[0].translation, /cuối tuần/u);
  assert.equal(lesson.grammar[0].title, "Bổ ngữ kết quả “好”");
  assert.ok(lesson.grammar[0].examples.length > 0);

  const lesson18 = contentModule.getHsk3TextbookLessonContent("hsk-3", "hsk3-tb-lesson-18");
  assert.ok(lesson18);
  assert.equal(lesson18.vocabulary.length, 17);
  assert.equal(lesson18.dialogues.length, 0);
  assert.deepEqual(lesson18.guidedPlaceholders, ["dialogue"]);
  assert.equal(lesson18.exercises.length, 4);
  assert.equal(lesson18.writingCharacters.length, 17);

  assert.equal(contentModule.getHsk3TextbookLessonContent("hsk-2", lesson.id), undefined);
  const hsk3 = curriculumModule.HSK_CURRICULUM.find((level) => level.id === "hsk-3");
  assert.ok(hsk3);
  assert.equal(hsk3.topics.length, 4);
  assert.equal(hsk3.topics.flatMap((topic) => topic.lessons).length, 20);
  assert.ok(hsk3.topics.flatMap((topic) => topic.lessons).every((item) => item.kind === "textbook" && item.available));
  assert.deepEqual(hsk3.topics[0].lessons[0], {
    id: "hsk3-tb-lesson-01",
    lessonNumber: 1,
    title: "Anh dự định làm gì vào cuối tuần vậy?",
    kind: "textbook",
    vocabulary: 15,
    grammar: 1,
    dialogues: 4,
    writing: 15,
    exercises: 4,
    minutes: 25,
    guidedSteps: 28,
    available: true,
  });

  const sections = guidedModule.buildHskGuidedSections(lesson).map((section) => section.label);
  assert.deepEqual(sections, ["Giới thiệu", "Từ vựng", "Ngữ pháp", "Hội thoại", "Phát âm", "Luyện viết", "Luyện tập", "Hoàn thành"]);
});

test("HSK 3 renders through the same workspace, guided lesson, flashcard and quiz data as HSK 1", async (t) => {
  const server = await createServer({
    appType: "custom",
    cacheDir: path.join(os.tmpdir(), "himi-vite-tests", "hsk3-textbook"),
    configFile: false,
    resolve: {
      alias: [
        { find: "next/image", replacement: path.resolve("tests/fixtures/next-image.tsx") },
        { find: "@", replacement: process.cwd() },
      ],
    },
    root: process.cwd(),
    server: { hmr: { port: 24787 }, middlewareMode: true },
  });
  t.after(() => server.close());

  const [workspaceModule, guidedViewModule, flashcardModule, contentModule] = await Promise.all([
    server.ssrLoadModule("/components/hsk-lesson-workspace.tsx"),
    server.ssrLoadModule("/components/hsk-guided-lesson.tsx"),
    server.ssrLoadModule("/components/hsk-flashcard-session.tsx"),
    server.ssrLoadModule("/lib/hsk3-textbook-content.ts"),
  ]);
  const lesson = contentModule.getHsk3TextbookLessonContent("hsk-3", "hsk3-tb-lesson-01");
  assert.ok(lesson);

  const workspaceHtml = renderToStaticMarkup(React.createElement(workspaceModule.HskLessonWorkspace, { lesson }));
  assert.match(workspaceHtml, /HSK 3 · 25 phút/);
  assert.match(workspaceHtml, />Từ vựng</);
  assert.match(workspaceHtml, />Bài tập</);
  assert.match(workspaceHtml, />Phát âm</);
  assert.match(workspaceHtml, />Chữ Hán</);
  assert.match(workspaceHtml, /周末/);
  assert.match(workspaceHtml, /cuối tuần/);
  assert.match(workspaceHtml, /href="\/hsk\/3\/hsk3-tb-lesson-01\/play"/);
  assert.match(workspaceHtml, /href="\/hsk\/3\/hsk3-tb-lesson-01\/flashcard"/);
  assert.match(workspaceHtml, /href="\/hsk\/3\/hsk3-tb-lesson-01\/quiz"/);

  const guidedHtml = renderToStaticMarkup(React.createElement(guidedViewModule.HskGuidedLesson, { lesson }));
  for (const label of ["Giới thiệu", "Từ vựng", "Ngữ pháp", "Hội thoại", "Phát âm", "Luyện viết", "Luyện tập", "Hoàn thành"]) {
    assert.match(guidedHtml, new RegExp(`>${label}`));
  }

  const flashcardHtml = renderToStaticMarkup(React.createElement(flashcardModule.HskFlashcardSession, {
    lesson,
    backHref: "/hsk/3/hsk3-tb-lesson-01",
  }));
  assert.match(flashcardHtml, /Flashcard HSK 3/);
  assert.match(flashcardHtml, /周末/);
  assert.match(flashcardHtml, /cuối tuần/);
});
