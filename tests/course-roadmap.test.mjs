import test from "node:test";
import assert from "node:assert/strict";
import { officeLessons, officeModules } from "../lib/office-course-seed.ts";

test("course roadmap groups 24 lessons into four stages and identifies the next lesson", async () => {
  const roadmapModule = await import("../lib/course-roadmap.ts").catch(() => null);
  assert.ok(roadmapModule, "the course roadmap builder should be available");

  const completedLessonSlugs = officeLessons.slice(0, 8).map((lesson) => lesson.slug);
  const roadmap = roadmapModule.buildCourseRoadmap({
    courseSlug: "van-phong-hanh-chinh",
    lessons: officeLessons.map((lesson, order) => ({
      ...lesson,
      order,
      moduleTitle: officeModules.find((module) => module.slug === lesson.moduleSlug)?.title ?? "",
      moduleOrder: officeModules.findIndex((module) => module.slug === lesson.moduleSlug),
    })),
    completedLessonSlugs,
    viewerHasVip: true,
  });

  assert.equal(roadmap.modules.length, 4);
  assert.deepEqual(roadmap.modules.map((module) => module.lessons.length), [6, 6, 6, 6]);
  assert.equal(roadmap.completedLessons, 8);
  assert.equal(roadmap.completedModules, 1);
  assert.equal(roadmap.progressPercent, 33);
  assert.equal(roadmap.modules[0].status, "completed");
  assert.equal(roadmap.modules[1].status, "active");
  assert.equal(roadmap.modules[1].lessons[2].status, "current");
  assert.equal(roadmap.modules[1].lessons[2].slug, officeLessons[8].slug);
  assert.equal(roadmap.modules[2].status, "locked");
  assert.equal(roadmap.remainingLessonsInActiveModule, 4);
});

test("course roadmap stops at the first VIP lesson when the viewer has no entitlement", async () => {
  const roadmapModule = await import("../lib/course-roadmap.ts").catch(() => null);
  assert.ok(roadmapModule, "the course roadmap builder should be available");

  const roadmap = roadmapModule.buildCourseRoadmap({
    courseSlug: "van-phong-hanh-chinh",
    lessons: officeLessons.map((lesson, order) => ({
      ...lesson,
      order,
      moduleTitle: officeModules.find((module) => module.slug === lesson.moduleSlug)?.title ?? "",
      moduleOrder: officeModules.findIndex((module) => module.slug === lesson.moduleSlug),
    })),
    completedLessonSlugs: officeLessons.slice(0, 6).map((lesson) => lesson.slug),
    viewerHasVip: false,
  });

  assert.equal(roadmap.modules[0].status, "completed");
  assert.equal(roadmap.modules[1].status, "active");
  assert.equal(roadmap.modules[1].lessons[0].status, "vip_locked");
  assert.equal(roadmap.nextLesson, null);
  assert.equal(roadmap.blockedByVip, true);
});

test("roadmap repository returns a complete public course overview without a database", async () => {
  const repository = await import("../lib/course-roadmap-repository.ts").catch(() => null);
  assert.ok(repository, "the course roadmap repository should be available");
  const previous = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;

  try {
    const data = await repository.getCourseRoadmapPageData({
      courseSlug: "van-phong-hanh-chinh",
      userId: null,
    });
    assert.equal(data?.course.title, "Văn phòng & hành chính");
    assert.equal(data?.roadmap.modules.length, 4);
    assert.equal(data?.roadmap.totalLessons, 24);
    assert.equal(data?.roadmap.nextLesson?.slug, "chao-hoi-tai-noi-lam-viec");
    assert.equal(data?.viewerHasVip, false);
  } finally {
    if (previous === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previous;
  }
});
