import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

test("lesson views render the learning content without a course sidebar", async (t) => {
  const server = await createServer({
    appType: "custom",
    configFile: false,
    resolve: {
      alias: [{ find: "@", replacement: process.cwd() }],
    },
    root: process.cwd(),
    server: { middlewareMode: true },
  });
  t.after(() => server.close());

  const [{ LessonWorkspace }, loadingModule] = await Promise.all([
    server.ssrLoadModule("/components/lesson-workspace.tsx"),
    server.ssrLoadModule("/app/learn/[slug]/loading.tsx"),
  ]);
  const lessonSummary = {
    slug: "lesson-one",
    title: "Bài học mẫu",
    summary: "Nội dung chính của bài học",
    situation: "Giao tiếp công việc",
    estimatedMinutes: 8,
    isFree: false,
    order: 0,
    moduleSlug: "module-one",
    moduleTitle: "Module mẫu",
    moduleOrder: 0,
  };
  const course = {
    slug: "course-without-sidebar",
    category: "Công việc",
    title: "Lộ trình mẫu",
    chineseTitle: "",
    hanzi: "",
    description: "",
    lessons: 1,
    minutes: 8,
    freeLessons: 0,
    level: "HSK 1",
    color: "#ffffff",
    ink: "#000000",
    availability: "available",
  };
  const loadedHtml = renderToStaticMarkup(React.createElement(LessonWorkspace, {
    course,
    lessons: [lessonSummary],
    lesson: {
      ...lessonSummary,
      dialogue: [],
      notes: [],
      vocabulary: [],
    },
    access: { allowed: false, source: "vip_required" },
    progress: null,
    authenticated: false,
    dailyFlow: false,
    dailyNextStep: null,
  }));
  const loadingHtml = renderToStaticMarkup(React.createElement(loadingModule.default));

  for (const html of [loadedHtml, loadingHtml]) {
    assert.match(html, /class="lesson-main"/);
    assert.doesNotMatch(html, /lesson-shell|lesson-sidebar|lesson-course-navigation|Danh sách bài học/);
  }
  assert.match(loadedHtml, />Bài học mẫu</);
});
