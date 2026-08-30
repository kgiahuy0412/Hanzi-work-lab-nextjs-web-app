import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

test("HSK 4 upper textbook converts all lessons into the HSK 1 learning shape", async () => {
  const [contentModule, curriculumModule, guidedModule] = await Promise.all([
    import("../lib/hsk4-upper-textbook-content.ts"),
    import("../lib/hsk-curriculum.ts"),
    import("../lib/hsk-guided-lesson.ts"),
  ]);

  const lessons = contentModule.HSK4_UPPER_TEXTBOOK_LESSONS;
  assert.equal(lessons.length, 10);
  assert.equal(lessons.reduce((total, lesson) => total + lesson.vocabulary.length, 0), 309);
  assert.equal(lessons.reduce((total, lesson) => total + lesson.dialogues.length, 0), 50);
  assert.equal(lessons.reduce((total, lesson) => total + lesson.grammar.length, 0), 50);
  assert.equal(lessons.reduce((total, lesson) => total + lesson.exercises.length, 0), 40);
  assert.ok(lessons.every((lesson) => lesson.modes.join(",") === "vocabulary,exercise,pronunciation,hanzi"));
  assert.ok(lessons.every((lesson) => lesson.vocabulary.length > 0));
  assert.ok(lessons.every((lesson) => lesson.dialogues.length === 5));
  assert.ok(lessons.every((lesson) => lesson.dialogues.every((dialogue) => dialogue.turns.length > 0)));
  assert.ok(lessons.every((lesson) => lesson.grammar.length === 5));
  assert.ok(lessons.every((lesson) => lesson.grammar.every((point) => point.examples.length > 0)));
  assert.ok(lessons.every((lesson) => lesson.pronunciationTopics.length === 6));
  assert.ok(lessons.every((lesson) => lesson.writingCharacters.length === lesson.vocabulary.length));
  assert.ok(lessons.every((lesson) => lesson.writingCharacters.every((item, index) => item.id === lesson.vocabulary[index].id)));
  assert.ok(lessons.every((lesson) => lesson.exercises.every((exercise) => (
    exercise.answer
    && exercise.options.length === 4
    && exercise.options.includes(exercise.answer)
  ))));

  const lesson = contentModule.getHsk4UpperTextbookLessonContent("hsk-4", "hsk4u-tb-lesson-01");
  assert.ok(lesson);
  assert.equal(lesson.title, "Tình yêu đơn giản");
  assert.equal(lesson.greeting, "简单的爱情");
  assert.deepEqual(
    {
      vocabulary: lesson.vocabulary.length,
      grammar: lesson.grammar.length,
      dialogues: lesson.dialogues.length,
      pronunciation: lesson.pronunciationTopics.length,
      exercises: lesson.exercises.length,
      writing: lesson.writingCharacters.length,
    },
    { vocabulary: 32, grammar: 5, dialogues: 5, pronunciation: 6, exercises: 4, writing: 32 },
  );
  assert.equal(lesson.vocabulary[0].hanzi, "法律");
  assert.match(lesson.vocabulary[0].meaning.toLowerCase(), /luật/u);
  assert.match(lesson.vocabulary[0].examplePinyin, /fǎ lǜ/u);
  assert.equal(
    lesson.dialogues[0].turns[0].hanzi,
    "听说你男朋友李进跟你是一个学校的，是你同学吗？",
  );
  assert.doesNotMatch(
    lesson.dialogues.flatMap((dialogue) => dialogue.turns).map((turn) => turn.hanzi).join("\n"),
    /生词|专有名词|[A-Za-z]/u,
  );
  assert.match(lesson.grammar[0].title, /不仅/u);
  assert.ok(lesson.grammar.every((point) => point.examples.length > 0));

  assert.equal(contentModule.getHsk4UpperTextbookLessonContent("hsk-3", lesson.id), undefined);

  const hsk4 = curriculumModule.HSK_CURRICULUM.find((level) => level.id === "hsk-4");
  assert.ok(hsk4);
  assert.equal(hsk4.topics.length, 4);
  assert.equal(hsk4.topics.flatMap((topic) => topic.lessons).length, 20);
  assert.ok(hsk4.description.includes("Tập 1 và Tập 2"));
  assert.ok(hsk4.topics.flatMap((topic) => topic.lessons).every((item) => item.kind === "textbook" && item.available));
  assert.deepEqual(hsk4.topics[0].lessons[0], {
    id: "hsk4u-tb-lesson-01",
    lessonNumber: 1,
    title: "Tình yêu đơn giản",
    kind: "textbook",
    vocabulary: 32,
    grammar: 5,
    dialogues: 5,
    writing: 32,
    exercises: 4,
    minutes: 36,
    guidedSteps: 50,
    available: true,
  });

  const sections = guidedModule.buildHskGuidedSections(lesson).map((section) => section.label);
  assert.deepEqual(sections, ["Giới thiệu", "Từ vựng", "Ngữ pháp", "Hội thoại", "Phát âm", "Luyện viết", "Luyện tập", "Hoàn thành"]);
});

test("HSK 4 upper renders through the same workspace, guided lesson and flashcard components as HSK 1", async (t) => {
  const server = await createServer({
    appType: "custom",
    cacheDir: path.join(os.tmpdir(), "himi-vite-tests", "hsk4-upper-textbook"),
    configFile: false,
    resolve: {
      alias: [
        { find: "next/image", replacement: path.resolve("tests/fixtures/next-image.tsx") },
        { find: "@", replacement: process.cwd() },
      ],
    },
    root: process.cwd(),
    server: { hmr: { port: 24789 }, middlewareMode: true },
  });
  t.after(() => server.close());

  const [workspaceModule, guidedViewModule, flashcardModule, contentModule, resolverModule] = await Promise.all([
    server.ssrLoadModule("/components/hsk-lesson-workspace.tsx"),
    server.ssrLoadModule("/components/hsk-guided-lesson.tsx"),
    server.ssrLoadModule("/components/hsk-flashcard-session.tsx"),
    server.ssrLoadModule("/lib/hsk4-upper-textbook-content.ts"),
    server.ssrLoadModule("/lib/hsk-learning-content.ts"),
  ]);
  const lesson = contentModule.getHsk4UpperTextbookLessonContent("hsk-4", "hsk4u-tb-lesson-01");
  assert.ok(lesson);
  assert.equal(resolverModule.getHskLearningLessonContent("4", lesson.id)?.id, lesson.id);

  const workspaceHtml = renderToStaticMarkup(React.createElement(workspaceModule.HskLessonWorkspace, { lesson }));
  assert.match(workspaceHtml, /HSK 4 · 36 phút/);
  assert.match(workspaceHtml, />Từ vựng</);
  assert.match(workspaceHtml, />Bài tập</);
  assert.match(workspaceHtml, />Phát âm</);
  assert.match(workspaceHtml, />Chữ Hán</);
  assert.match(workspaceHtml, /法律/);
  assert.match(workspaceHtml, /href="\/hsk\/4\/hsk4u-tb-lesson-01\/play"/);
  assert.match(workspaceHtml, /href="\/hsk\/4\/hsk4u-tb-lesson-01\/flashcard"/);
  assert.match(workspaceHtml, /href="\/hsk\/4\/hsk4u-tb-lesson-01\/quiz"/);

  const guidedHtml = renderToStaticMarkup(React.createElement(guidedViewModule.HskGuidedLesson, { lesson }));
  for (const label of ["Giới thiệu", "Từ vựng", "Ngữ pháp", "Hội thoại", "Phát âm", "Luyện viết", "Luyện tập", "Hoàn thành"]) {
    assert.match(guidedHtml, new RegExp(`>${label}`));
  }

  const flashcardHtml = renderToStaticMarkup(React.createElement(flashcardModule.HskFlashcardSession, {
    lesson,
    backHref: "/hsk/4/hsk4u-tb-lesson-01",
  }));
  assert.match(flashcardHtml, /Flashcard HSK 4/);
  assert.match(flashcardHtml, /法律/);
  assert.match(flashcardHtml, /Luật/i);
});
