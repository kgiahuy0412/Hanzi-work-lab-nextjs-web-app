import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

test("HSK 6 volume 1 converts all source lessons into the HSK 1 learning shape", async () => {
  const [contentModule, curriculumModule, guidedModule] = await Promise.all([
    import("../lib/hsk6-volume1-textbook-content.ts"),
    import("../lib/hsk-curriculum.ts"),
    import("../lib/hsk-guided-lesson.ts"),
  ]);

  const lessons = contentModule.HSK6_VOLUME1_TEXTBOOK_LESSONS;
  assert.equal(lessons.length, 20);
  assert.equal(lessons.reduce((total, lesson) => total + lesson.vocabulary.length, 0), 894);
  assert.equal(lessons.reduce((total, lesson) => total + lesson.grammar.length, 0), 60);
  assert.equal(lessons.reduce((total, lesson) => total + lesson.dialogues.length, 0), 20);
  assert.equal(lessons.reduce((total, lesson) => total + lesson.exercises.length, 0), 80);
  assert.ok(lessons.every((lesson) => lesson.modes.join(",") === "vocabulary,exercise,pronunciation,hanzi"));
  assert.ok(lessons.every((lesson) => lesson.vocabulary.length > 0));
  assert.ok(lessons.every((lesson) => lesson.grammar.length === 3));
  assert.ok(lessons.every((lesson) => lesson.grammar.every((point) => point.examples.length > 0)));
  assert.ok(lessons.every((lesson) => lesson.dialogues.length === 1));
  assert.ok(lessons.every((lesson) => lesson.dialogues[0].turns.length > 0));
  assert.ok(lessons.every((lesson) => lesson.pronunciationTopics.length > 0));
  assert.ok(lessons.every((lesson) => lesson.writingCharacters.length === lesson.vocabulary.length));
  assert.ok(lessons.every((lesson) => lesson.writingCharacters.every((item, index) => item.id === lesson.vocabulary[index].id)));
  assert.ok(lessons.every((lesson) => lesson.exercises.every((exercise) => (
    exercise.answer
    && exercise.options.length === 4
    && exercise.options.includes(exercise.answer)
  ))));

  const lesson = contentModule.getHsk6Volume1TextbookLessonContent("hsk-6", "hsk6t1-lesson-01");
  assert.ok(lesson);
  assert.equal(lesson.title, "Điều con trẻ dạy chúng ta");
  assert.equal(lesson.greeting, "孩子给我们的启示");
  assert.deepEqual(
    {
      vocabulary: lesson.vocabulary.length,
      grammar: lesson.grammar.length,
      dialogues: lesson.dialogues.length,
      pronunciation: lesson.pronunciationTopics.length,
      exercises: lesson.exercises.length,
      writing: lesson.writingCharacters.length,
    },
    { vocabulary: 32, grammar: 3, dialogues: 1, pronunciation: 4, exercises: 4, writing: 32 },
  );
  assert.equal(lesson.vocabulary[0].hanzi, "别扭");
  assert.equal(lesson.vocabulary[0].pinyin, "biè niǔ");
  assert.match(lesson.dialogues[0].turns.map((turn) => turn.hanzi).join(""), /天天的父母要出差/u);
  assert.match(lesson.grammar.map((point) => point.title).join("\n"), /巴不得/u);
  assert.equal(lesson.audioAvailable, false);
  assert.equal(contentModule.getHsk6Volume1TextbookLessonContent("hsk-5", lesson.id), undefined);

  const hsk6 = curriculumModule.HSK_CURRICULUM.find((level) => level.id === "hsk-6");
  assert.ok(hsk6);
  assert.equal(hsk6.topics.length, 10);
  assert.equal(hsk6.topics.flatMap((topic) => topic.lessons).length, 40);
  assert.equal(hsk6.topics[0].id, "hsk6t1-unit-01");
  assert.equal(hsk6.topics[0].lessons[0].id, lesson.id);
  assert.equal(hsk6.topics[0].lessons[0].writing, hsk6.topics[0].lessons[0].vocabulary);
  assert.ok(hsk6.topics.flatMap((topic) => topic.lessons).every((item) => item.kind === "textbook" && item.available));

  const sections = guidedModule.buildHskGuidedSections(lesson).map((section) => section.label);
  assert.deepEqual(sections, ["Giới thiệu", "Từ vựng", "Ngữ pháp", "Hội thoại", "Phát âm", "Luyện viết", "Luyện tập", "Hoàn thành"]);
});

test("HSK 6 volume 1 renders through the same workspace, guided lesson and flashcard components as HSK 1", async (t) => {
  const server = await createServer({
    appType: "custom",
    cacheDir: path.join(os.tmpdir(), "himi-vite-tests", "hsk6-volume1-textbook"),
    configFile: false,
    resolve: {
      alias: [
        { find: "next/image", replacement: path.resolve("tests/fixtures/next-image.tsx") },
        { find: "@", replacement: process.cwd() },
      ],
    },
    root: process.cwd(),
    server: { hmr: { port: 24793 }, middlewareMode: true },
  });
  t.after(() => server.close());

  const [workspaceModule, guidedViewModule, flashcardModule, contentModule, resolverModule] = await Promise.all([
    server.ssrLoadModule("/components/hsk-lesson-workspace.tsx"),
    server.ssrLoadModule("/components/hsk-guided-lesson.tsx"),
    server.ssrLoadModule("/components/hsk-flashcard-session.tsx"),
    server.ssrLoadModule("/lib/hsk6-volume1-textbook-content.ts"),
    server.ssrLoadModule("/lib/hsk-learning-content.ts"),
  ]);
  const lesson = contentModule.getHsk6Volume1TextbookLessonContent("hsk-6", "hsk6t1-lesson-01");
  assert.ok(lesson);
  assert.equal(resolverModule.getHskLearningLessonContent("6", lesson.id)?.id, lesson.id);

  const workspaceHtml = renderToStaticMarkup(React.createElement(workspaceModule.HskLessonWorkspace, { lesson }));
  assert.match(workspaceHtml, /HSK 6 · 46 phút/);
  assert.match(workspaceHtml, />Từ vựng</);
  assert.match(workspaceHtml, />Bài tập</);
  assert.match(workspaceHtml, />Phát âm</);
  assert.match(workspaceHtml, />Chữ Hán</);
  assert.match(workspaceHtml, /别扭/);
  assert.match(workspaceHtml, /href="\/hsk\/6\/hsk6t1-lesson-01\/play"/);
  assert.match(workspaceHtml, /href="\/hsk\/6\/hsk6t1-lesson-01\/flashcard"/);
  assert.match(workspaceHtml, /href="\/hsk\/6\/hsk6t1-lesson-01\/quiz"/);

  const guidedHtml = renderToStaticMarkup(React.createElement(guidedViewModule.HskGuidedLesson, { lesson }));
  for (const label of ["Giới thiệu", "Từ vựng", "Ngữ pháp", "Hội thoại", "Phát âm", "Luyện viết", "Luyện tập", "Hoàn thành"]) {
    assert.match(guidedHtml, new RegExp(`>${label}`));
  }

  const flashcardHtml = renderToStaticMarkup(React.createElement(flashcardModule.HskFlashcardSession, {
    lesson,
    backHref: "/hsk/6/hsk6t1-lesson-01",
  }));
  assert.match(flashcardHtml, /Flashcard HSK 6/);
  assert.match(flashcardHtml, /别扭/);
  assert.match(flashcardHtml, /Coxichmich/i);
});
