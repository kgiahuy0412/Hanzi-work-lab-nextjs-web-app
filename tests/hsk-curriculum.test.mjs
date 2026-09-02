import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

test("HSK curriculum exposes 15 HSK 1 lessons and 15 HSK 2 textbook lessons", async () => {
  const curriculumModule = await import("../lib/hsk-curriculum.ts").catch(() => null);
  assert.ok(curriculumModule, "the HSK curriculum should be available");

  const { HSK_CURRICULUM } = curriculumModule;
  assert.deepEqual(
    HSK_CURRICULUM.map((level) => level.label),
    ["HSK 1", "HSK 2", "HSK 3", "HSK 4", "HSK 5", "HSK 6", "HSK 7–9"],
  );
  assert.equal(HSK_CURRICULUM[0].topics.length, 3);
  assert.equal(HSK_CURRICULUM[1].topics.length, 3);
  assert.ok(HSK_CURRICULUM.slice(2).every((level) => level.topics.length >= 4));
  assert.ok(HSK_CURRICULUM.every((level) => level.topics.every((topic) => topic.lessons.length >= 3)));
  assert.ok(HSK_CURRICULUM.every((level) => level.topics.every((topic) => (
    topic.lessons.every((lesson) => lesson.writing === lesson.vocabulary)
  ))));
  assert.equal(HSK_CURRICULUM[0].topics.flatMap((topic) => topic.lessons).length, 15);
  assert.equal(HSK_CURRICULUM[1].topics.flatMap((topic) => topic.lessons).length, 15);
  assert.ok(HSK_CURRICULUM[1].topics.flatMap((topic) => topic.lessons).every((lesson) => lesson.kind === "textbook" && lesson.available));
  assert.equal(HSK_CURRICULUM[0].topics[0].title, "Nền tảng & Làm quen");
  assert.deepEqual(HSK_CURRICULUM[0].topics[0].lessons[0], {
    id: "hsk1-bai-01-chao-anh",
    lessonNumber: 1,
    title: "Chào anh!",
    kind: "textbook",
    vocabulary: 6,
    grammar: 0,
    dialogues: 3,
    writing: 6,
    minutes: 25,
    guidedSteps: 15,
    available: true,
  });
  assert.deepEqual(HSK_CURRICULUM[1].topics[0].lessons[0], {
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
});

test("HSK curriculum renders the reference hierarchy and a working lesson destination", async (t) => {
  const server = await createServer({
    appType: "custom",
    cacheDir: path.join(os.tmpdir(), "himi-vite-tests", "hsk-curriculum"),
    configFile: false,
    resolve: {
      alias: [
        { find: "next/image", replacement: path.resolve("tests/fixtures/next-image.tsx") },
        { find: "@", replacement: process.cwd() },
      ],
    },
    root: process.cwd(),
    server: { hmr: { port: 24782 }, middlewareMode: true },
  });
  t.after(() => server.close());

  const [viewModule, curriculumModule] = await Promise.all([
    server.ssrLoadModule("/components/hsk-curriculum-explorer.tsx").catch(() => null),
    server.ssrLoadModule("/lib/hsk-curriculum.ts").catch(() => null),
  ]);
  assert.ok(viewModule, "the HSK curriculum explorer should be renderable");
  assert.ok(curriculumModule, "the HSK curriculum data should be renderable");

  const html = renderToStaticMarkup(React.createElement(viewModule.HskCurriculumExplorer, {
    curriculum: curriculumModule.HSK_CURRICULUM,
  }));
  assert.match(html, /aria-label="Chọn cấp độ HSK"/);
  assert.match(html, /aria-pressed="true"[^>]*>[^<]*<span[^>]*>壹/);
  assert.match(html, />Lộ trình bài học HSK 1</);
  assert.match(html, />Nền tảng &amp; Làm quen</);
  assert.match(html, />Bài 1: Chào anh!</);
  assert.match(html, /6 từ vựng/);
  assert.doesNotMatch(html, /0 ngữ pháp/);
  assert.match(html, /3 hội thoại/);
  assert.match(html, /href="\/hsk\/1\/hsk1-bai-01-chao-anh"/);
  assert.doesNotMatch(html, />HSK 7–9</);
});

test("course library opens the HSK curriculum from a dedicated catalog card", async (t) => {
  const server = await createServer({
    appType: "custom",
    cacheDir: path.join(os.tmpdir(), "himi-vite-tests", "hsk-curriculum-catalog"),
    configFile: false,
    resolve: {
      alias: [
        { find: "next/image", replacement: path.resolve("tests/fixtures/next-image.tsx") },
        { find: "@", replacement: process.cwd() },
      ],
    },
    root: process.cwd(),
    server: { hmr: { port: 24783 }, middlewareMode: true },
  });
  t.after(() => server.close());

  const [{ CourseLibraryView }, { courses }, { HSK_CURRICULUM }] = await Promise.all([
    server.ssrLoadModule("/components/course-library-view.tsx"),
    server.ssrLoadModule("/lib/course-data.ts"),
    server.ssrLoadModule("/lib/hsk-curriculum.ts"),
  ]);

  const catalogHtml = renderToStaticMarkup(React.createElement(CourseLibraryView, { courses, hskCurriculum: HSK_CURRICULUM, view: "catalog" }));
  assert.match(catalogHtml, /href="\/courses\?view=hsk"/);
  assert.match(catalogHtml, />Giáo trình HSK</);
  assert.match(catalogHtml, />Văn phòng &amp; hành chính</);
  assert.doesNotMatch(catalogHtml, /aria-label="Chọn cấp độ HSK"/);

  const hskHtml = renderToStaticMarkup(React.createElement(CourseLibraryView, { courses, hskCurriculum: HSK_CURRICULUM, view: "hsk" }));
  assert.match(hskHtml, /aria-label="Chọn cấp độ HSK"/);
  assert.match(hskHtml, /href="\/courses"/);
  assert.doesNotMatch(hskHtml, />Văn phòng &amp; hành chính</);
});
