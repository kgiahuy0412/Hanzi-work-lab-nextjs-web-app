import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

test("HSK 5 lower textbook converts all lessons into the HSK 1 learning shape", async () => {
  const [contentModule, curriculumModule, guidedModule] = await Promise.all([
    import("../lib/hsk5-lower-textbook-content.ts"),
    import("../lib/hsk-curriculum.ts"),
    import("../lib/hsk-guided-lesson.ts"),
  ]);

  const lessons = contentModule.HSK5_LOWER_TEXTBOOK_LESSONS;
  assert.equal(lessons.length, 18);
  assert.equal(lessons.reduce((total, lesson) => total + lesson.vocabulary.length, 0), 502);
  assert.equal(lessons.reduce((total, lesson) => total + lesson.dialogues.length, 0), 18);
  assert.equal(lessons.reduce((total, lesson) => total + lesson.exercises.length, 0), 72);
  assert.ok(lessons.every((lesson) => lesson.modes.join(",") === "vocabulary,exercise,pronunciation,hanzi"));
  assert.ok(lessons.every((lesson) => lesson.vocabulary.length > 0));
  assert.ok(lessons.every((lesson) => lesson.grammar.length > 0));
  assert.ok(lessons.every((lesson) => lesson.grammar.every((point) => point.examples.length > 0)));
  assert.ok(lessons.every((lesson) => lesson.dialogues.length === 1));
  assert.ok(lessons.every((lesson) => lesson.dialogues.every((dialogue) => dialogue.turns.length > 0)));
  assert.ok(lessons.every((lesson) => lesson.pronunciationTopics.length === 4));
  assert.ok(lessons.every((lesson) => lesson.writingCharacters.length === lesson.vocabulary.length));
  assert.ok(lessons.every((lesson) => lesson.writingCharacters.every((item, index) => item.id === lesson.vocabulary[index].id)));
  assert.ok(lessons.every((lesson) => lesson.exercises.every((exercise) => (
    exercise.answer
    && exercise.options.length === 4
    && exercise.options.includes(exercise.answer)
  ))));

  const lesson = contentModule.getHsk5LowerTextbookLessonContent("hsk-5", "hsk5l-lesson-19");
  assert.ok(lesson);
  assert.equal(lesson.title, "Bánh củ cải quê nhà");
  assert.equal(lesson.greeting, "家乡的萝卜饼");
  assert.deepEqual(
    {
      vocabulary: lesson.vocabulary.length,
      grammar: lesson.grammar.length,
      dialogues: lesson.dialogues.length,
      pronunciation: lesson.pronunciationTopics.length,
      exercises: lesson.exercises.length,
      writing: lesson.writingCharacters.length,
    },
    { vocabulary: 30, grammar: 3, dialogues: 1, pronunciation: 4, exercises: 4, writing: 30 },
  );
  assert.equal(lesson.vocabulary[0].hanzi, "薄");
  assert.equal(lesson.vocabulary[0].pinyin, "báo");
  assert.match(lesson.dialogues[0].turns.map((turn) => turn.hanzi).join("\n"), /萝卜饼/u);
  assert.match(lesson.grammar.map((point) => point.title).join("\n"), /般/u);
  assert.equal(contentModule.getHsk5LowerTextbookLessonContent("hsk-4", lesson.id), undefined);

  const hsk5 = curriculumModule.HSK_CURRICULUM.find((level) => level.id === "hsk-5");
  assert.ok(hsk5);
  assert.equal(hsk5.topics.length, 12);
  assert.equal(hsk5.topics.flatMap((topic) => topic.lessons).length, 36);
  assert.ok(hsk5.description.includes("Giáo trình chuẩn HSK 5 - Tập 2"));
  const textbookLessons = hsk5.topics.flatMap((topic) => topic.lessons).filter((item) => item.kind === "textbook");
  assert.equal(textbookLessons.length, 18);
  assert.ok(textbookLessons.every((item) => item.available));
  assert.equal(textbookLessons[0].id, lesson.id);
  assert.equal(textbookLessons[0].writing, textbookLessons[0].vocabulary);

  const sections = guidedModule.buildHskGuidedSections(lesson).map((section) => section.label);
  assert.deepEqual(sections, ["Giới thiệu", "Từ vựng", "Ngữ pháp", "Hội thoại", "Phát âm", "Luyện viết", "Luyện tập", "Hoàn thành"]);
});

test("HSK 5 lower renders through the same workspace, guided lesson and flashcard components as HSK 1", async (t) => {
  const server = await createServer({
    appType: "custom",
    cacheDir: path.join(os.tmpdir(), "himi-vite-tests", "hsk5-lower-textbook"),
    configFile: false,
    resolve: {
      alias: [
        { find: "next/image", replacement: path.resolve("tests/fixtures/next-image.tsx") },
        { find: "@", replacement: process.cwd() },
      ],
    },
    root: process.cwd(),
    server: { hmr: { port: 24790 }, middlewareMode: true },
  });
  t.after(() => server.close());

  const [workspaceModule, guidedViewModule, flashcardModule, contentModule, resolverModule] = await Promise.all([
    server.ssrLoadModule("/components/hsk-lesson-workspace.tsx"),
    server.ssrLoadModule("/components/hsk-guided-lesson.tsx"),
    server.ssrLoadModule("/components/hsk-flashcard-session.tsx"),
    server.ssrLoadModule("/lib/hsk5-lower-textbook-content.ts"),
    server.ssrLoadModule("/lib/hsk-learning-content.ts"),
  ]);
  const lesson = contentModule.getHsk5LowerTextbookLessonContent("hsk-5", "hsk5l-lesson-19");
  assert.ok(lesson);
  assert.equal(resolverModule.getHskLearningLessonContent("5", lesson.id)?.id, lesson.id);

  const workspaceHtml = renderToStaticMarkup(React.createElement(workspaceModule.HskLessonWorkspace, { lesson }));
  assert.match(workspaceHtml, /HSK 5 · 45 phút/);
  assert.match(workspaceHtml, />Từ vựng</);
  assert.match(workspaceHtml, />Bài tập</);
  assert.match(workspaceHtml, />Phát âm</);
  assert.match(workspaceHtml, />Chữ Hán</);
  assert.match(workspaceHtml, /薄/);
  assert.match(workspaceHtml, /href="\/hsk\/5\/hsk5l-lesson-19\/play"/);
  assert.match(workspaceHtml, /href="\/hsk\/5\/hsk5l-lesson-19\/flashcard"/);
  assert.match(workspaceHtml, /href="\/hsk\/5\/hsk5l-lesson-19\/quiz"/);

  const guidedHtml = renderToStaticMarkup(React.createElement(guidedViewModule.HskGuidedLesson, { lesson }));
  for (const label of ["Giới thiệu", "Từ vựng", "Ngữ pháp", "Hội thoại", "Phát âm", "Luyện viết", "Luyện tập", "Hoàn thành"]) {
    assert.match(guidedHtml, new RegExp(`>${label}`));
  }

  const flashcardHtml = renderToStaticMarkup(React.createElement(flashcardModule.HskFlashcardSession, {
    lesson,
    backHref: "/hsk/5/hsk5l-lesson-19",
  }));
  assert.match(flashcardHtml, /Flashcard HSK 5/);
  assert.match(flashcardHtml, /薄/);
});
