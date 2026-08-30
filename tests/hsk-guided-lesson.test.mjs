import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

test("guided HSK lesson builds its journey from the textbook section counts", async () => {
  const [contentModule, guidedModule] = await Promise.all([
    import("../lib/hsk-lesson-content.ts").catch(() => null),
    import("../lib/hsk-guided-lesson.ts").catch(() => null),
  ]);
  assert.ok(contentModule, "the HSK lesson content module should exist");
  assert.ok(guidedModule, "the guided lesson model should exist");

  const lesson = contentModule.getHskLessonContent("hsk-1", "hsk1-bai-01-chao-anh");
  assert.ok(lesson);
  const steps = guidedModule.buildHskGuidedLessonSteps(lesson);
  const sections = guidedModule.buildHskGuidedSections(lesson);

  assert.equal(steps.length, 15);
  assert.deepEqual(
    steps.map((step) => step.kind),
    [
      "introduction",
      ...Array(6).fill("vocabulary"),
      "dialogue",
      "dialogue",
      "dialogue",
      "pronunciation",
      "writing",
      "practice",
      "practice",
      "complete",
    ],
  );
  assert.deepEqual(
    sections.map(({ label, count }) => [label, count]),
    [
      ["Giới thiệu", undefined],
      ["Từ vựng", 6],
      ["Hội thoại", 3],
      ["Phát âm", undefined],
      ["Luyện viết", undefined],
      ["Luyện tập", 2],
      ["Hoàn thành", undefined],
    ],
  );
});

test("guided progress is restored safely and can complete the whole lesson", async () => {
  const [contentModule, progressModule] = await Promise.all([
    import("../lib/hsk-lesson-content.ts"),
    import("../lib/hsk-lesson-progress.ts"),
  ]);
  const lesson = contentModule.getHskLessonContent("hsk-1", "hsk1-bai-01-chao-anh");
  assert.ok(lesson);

  const restored = progressModule.parseHskLessonProgress(JSON.stringify({
    guidedStep: 99,
    guidedCompleted: false,
  }));
  assert.equal(restored.guidedStep, 99);
  assert.equal(restored.guidedCompleted, false);

  const completed = {
    ...progressModule.EMPTY_HSK_LESSON_PROGRESS,
    guidedStep: 14,
    guidedCompleted: true,
  };
  assert.equal(progressModule.calculateHskLessonProgress(lesson, completed), 100);
});

test("guided HSK lesson exposes progress, controls, sections and step navigation", async (t) => {
  const server = await createServer({
    appType: "custom",
    cacheDir: path.join(os.tmpdir(), "himi-vite-tests", "hsk-guided-lesson"),
    configFile: false,
    resolve: {
      alias: [
        { find: "next/image", replacement: path.resolve("tests/fixtures/next-image.tsx") },
        { find: "@", replacement: process.cwd() },
      ],
    },
    root: process.cwd(),
    server: { hmr: { port: 24784 }, middlewareMode: true },
  });
  t.after(() => server.close());

  const [viewModule, contentModule] = await Promise.all([
    server.ssrLoadModule("/components/hsk-guided-lesson.tsx").catch(() => null),
    server.ssrLoadModule("/lib/hsk-lesson-content.ts"),
  ]);
  assert.ok(viewModule, "the guided lesson workspace should be renderable");
  const lesson = contentModule.getHskLessonContent("hsk-1", "hsk1-bai-01-chao-anh");
  const html = renderToStaticMarkup(React.createElement(viewModule.HskGuidedLesson, { lesson }));

  assert.match(html, /aria-label="Thoát bài học"/);
  assert.match(html, /aria-valuenow="1"/);
  assert.match(html, /1 \/ 15/);
  assert.match(html, /Ẩn pinyin/);
  assert.match(html, /0\.75×/);
  assert.match(html, /Từ vựng/);
  assert.doesNotMatch(html, /<span>Ngữ pháp<\/span>/);
  assert.match(html, /Hội thoại/);
  assert.match(html, /Luyện viết/);
  assert.match(html, /Luyện tập/);
  assert.match(html, /Hoàn thành/);
  assert.match(html, />Trước</);
  assert.match(html, />Tiếp</);
});
