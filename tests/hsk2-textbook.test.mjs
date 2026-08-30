import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

test("HSK 2 textbook supplies all 15 lessons in the HSK 1 learning shape", async () => {
  const [contentModule, curriculumModule, guidedModule] = await Promise.all([
    import("../lib/hsk2-textbook-content.ts"),
    import("../lib/hsk-curriculum.ts"),
    import("../lib/hsk-guided-lesson.ts"),
  ]);

  const lessons = contentModule.HSK2_TEXTBOOK_LESSONS;
  assert.equal(lessons.length, 15);
  assert.equal(lessons.reduce((total, lesson) => total + lesson.vocabulary.length, 0), 169);
  assert.equal(lessons.reduce((total, lesson) => total + lesson.dialogues.length, 0), 60);
  assert.equal(lessons.reduce((total, lesson) => total + lesson.grammar.length, 0), 44);
  assert.equal(lessons.reduce((total, lesson) => total + lesson.exercises.length, 0), 60);
  assert.ok(lessons.every((lesson) => lesson.modes.join(",") === "vocabulary,exercise,pronunciation,hanzi"));
  assert.ok(lessons.every((lesson) => lesson.vocabulary.length > 0));
  assert.ok(lessons.every((lesson) => lesson.dialogues.length === 4));
  assert.ok(lessons.every((lesson) => lesson.dialogues.every((dialogue) => dialogue.turns.length > 0)));
  assert.ok(lessons.every((lesson) => lesson.grammar.length >= 2 && lesson.grammar.length <= 4));
  assert.ok(lessons.every((lesson) => lesson.grammar.every((point) => point.examples.length > 0)));
  assert.ok(lessons.every((lesson) => lesson.pronunciationTopics.length === 6));
  assert.ok(lessons.every((lesson) => lesson.writingCharacters.length === lesson.vocabulary.length));
  assert.ok(lessons.every((lesson) => lesson.writingCharacters.every((item, index) => item.id === lesson.vocabulary[index].id)));
  assert.ok(lessons.every((lesson) => lesson.exercises.every((exercise) => (
    exercise.answer
    && exercise.options.length === 4
    && exercise.options.includes(exercise.answer)
  ))));

  const lesson = contentModule.getHsk2TextbookLessonContent("hsk-2", "hsk2-tb-lesson-01");
  assert.ok(lesson);
  assert.equal(lesson.title, "Nếu đi Bắc Kinh để du lịch thì tốt nhất là đi vào tháng chín.");
  assert.equal(lesson.greeting, "九月去北京旅游最好。");
  assert.deepEqual(
    {
      vocabulary: lesson.vocabulary.length,
      grammar: lesson.grammar.length,
      dialogues: lesson.dialogues.length,
      pronunciation: lesson.pronunciationTopics.length,
      exercises: lesson.exercises.length,
      writing: lesson.writingCharacters.length,
    },
    { vocabulary: 12, grammar: 3, dialogues: 4, pronunciation: 6, exercises: 4, writing: 12 },
  );
  assert.equal(lesson.vocabulary[0].hanzi, "旅游");
  assert.match(lesson.vocabulary[0].meaning.toLowerCase(), /du lịch/u);
  assert.match(lesson.vocabulary[0].examplePinyin, /lǚ yóu/u);
  assert.equal(lesson.dialogues[0].turns[0].hanzi, "我要去北京旅游，你觉得什么时候去最好？");
  assert.match(lesson.dialogues[0].turns[0].translation, /Bắc Kinh/u);
  assert.match(lesson.grammar[0].title, /Trợ động từ 要/u);
  assert.ok(lesson.grammar.every((point) => point.explanation && point.examples.length > 0));
  assert.equal(contentModule.getHsk2TextbookLessonContent("hsk-1", lesson.id), undefined);

  const hsk2 = curriculumModule.HSK_CURRICULUM.find((level) => level.id === "hsk-2");
  assert.ok(hsk2);
  assert.equal(hsk2.topics.length, 3);
  assert.equal(hsk2.topics.flatMap((topic) => topic.lessons).length, 15);
  assert.ok(hsk2.description.includes("Giáo trình chuẩn HSK 2"));
  assert.ok(hsk2.topics.flatMap((topic) => topic.lessons).every((item) => item.kind === "textbook" && item.available));
  assert.deepEqual(hsk2.topics[0].lessons[0], {
    id: "hsk2-tb-lesson-01",
    lessonNumber: 1,
    title: "Nếu đi Bắc Kinh để du lịch thì tốt nhất là đi vào tháng chín.",
    kind: "textbook",
    vocabulary: 12,
    grammar: 3,
    dialogues: 4,
    writing: 12,
    exercises: 4,
    minutes: 27,
    guidedSteps: 27,
    available: true,
  });

  const sections = guidedModule.buildHskGuidedSections(lesson).map((section) => section.label);
  assert.deepEqual(sections, ["Giới thiệu", "Từ vựng", "Ngữ pháp", "Hội thoại", "Phát âm", "Luyện viết", "Luyện tập", "Hoàn thành"]);
});

test("HSK 2 textbook progress uses the same storage shape as HSK 1", async () => {
  const [contentModule, progressModule] = await Promise.all([
    import("../lib/hsk2-textbook-content.ts"),
    import("../lib/hsk-lesson-progress.ts"),
  ]);
  const lesson = contentModule.getHsk2TextbookLessonContent("hsk-2", "hsk2-tb-lesson-01");
  assert.ok(lesson);
  assert.deepEqual(progressModule.parseHskLessonProgress("not-json"), progressModule.EMPTY_HSK_LESSON_PROGRESS);
  assert.equal(progressModule.calculateHskLessonProgress(lesson, progressModule.EMPTY_HSK_LESSON_PROGRESS), 0);
  assert.equal(progressModule.calculateHskLessonProgress(lesson, {
    ...progressModule.EMPTY_HSK_LESSON_PROGRESS,
    vocabulary: lesson.vocabulary.map((word) => word.id),
    reviewedExercises: lesson.exercises.map((exercise) => exercise.id),
    exerciseBestPercent: 100,
    pronunciation: lesson.vocabulary.map((word) => word.id),
    writing: lesson.writingCharacters.map((character) => character.id),
    guidedCompleted: true,
  }), 100);
});

test("HSK 2 textbook renders through the same workspace, guided lesson and flashcard components as HSK 1", async (t) => {
  const server = await createServer({
    appType: "custom",
    cacheDir: path.join(os.tmpdir(), "himi-vite-tests", "hsk2-textbook"),
    configFile: false,
    resolve: {
      alias: [
        { find: "next/image", replacement: path.resolve("tests/fixtures/next-image.tsx") },
        { find: "@", replacement: process.cwd() },
      ],
    },
    root: process.cwd(),
    server: { hmr: { port: 24786 }, middlewareMode: true },
  });
  t.after(() => server.close());

  const [workspaceModule, guidedViewModule, flashcardModule, contentModule, resolverModule] = await Promise.all([
    server.ssrLoadModule("/components/hsk-lesson-workspace.tsx"),
    server.ssrLoadModule("/components/hsk-guided-lesson.tsx"),
    server.ssrLoadModule("/components/hsk-flashcard-session.tsx"),
    server.ssrLoadModule("/lib/hsk2-textbook-content.ts"),
    server.ssrLoadModule("/lib/hsk-learning-content.ts"),
  ]);
  const lesson = contentModule.getHsk2TextbookLessonContent("hsk-2", "hsk2-tb-lesson-01");
  assert.ok(lesson);
  assert.equal(resolverModule.getHskLearningLessonContent("2", lesson.id)?.id, lesson.id);
  assert.equal(resolverModule.getHskLearningLessonContent("2", "hsk2-wb-lesson-01"), undefined);

  const workspaceHtml = renderToStaticMarkup(React.createElement(workspaceModule.HskLessonWorkspace, { lesson }));
  assert.match(workspaceHtml, /HSK 2 · 27 phút/);
  assert.match(workspaceHtml, />Từ vựng</);
  assert.match(workspaceHtml, />Bài tập</);
  assert.match(workspaceHtml, />Phát âm</);
  assert.match(workspaceHtml, />Chữ Hán</);
  assert.match(workspaceHtml, /旅游/);
  assert.doesNotMatch(workspaceHtml, /Nội dung workbook đã được hiển thị/);
  assert.match(workspaceHtml, /href="\/hsk\/2\/hsk2-tb-lesson-01\/play"/);
  assert.match(workspaceHtml, /href="\/hsk\/2\/hsk2-tb-lesson-01\/flashcard"/);
  assert.match(workspaceHtml, /href="\/hsk\/2\/hsk2-tb-lesson-01\/quiz"/);

  const guidedHtml = renderToStaticMarkup(React.createElement(guidedViewModule.HskGuidedLesson, { lesson }));
  for (const label of ["Giới thiệu", "Từ vựng", "Ngữ pháp", "Hội thoại", "Phát âm", "Luyện viết", "Luyện tập", "Hoàn thành"]) {
    assert.match(guidedHtml, new RegExp(`>${label}`));
  }

  const flashcardHtml = renderToStaticMarkup(React.createElement(flashcardModule.HskFlashcardSession, {
    lesson,
    backHref: "/hsk/2/hsk2-tb-lesson-01",
  }));
  assert.match(flashcardHtml, /Flashcard HSK 2/);
  assert.match(flashcardHtml, /旅游/);
  assert.match(flashcardHtml, /du lịch/i);
});
