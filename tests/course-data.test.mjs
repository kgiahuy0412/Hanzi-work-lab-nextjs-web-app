import test from "node:test";
import assert from "node:assert/strict";
import { courses, getCourse } from "../lib/course-data.ts";
import { getPublishedCourse, listPublishedCourses } from "../lib/course-repository.ts";

test("demo catalog contains the approved tracks and imported topic course", () => {
  assert.equal(courses.length, 8);
  assert.equal(new Set(courses.map((course) => course.slug)).size, courses.length);
  assert.equal(courses.filter((course) => course.availability === "available").length, 8);
  assert.equal(courses.filter((course) => course.availability === "coming_soon").length, 0);
  assert.ok(courses.filter((course) => course.availability === "coming_soon").every((course) => course.lessons === 0 && course.freeLessons === 0));
});

test("factory track is published with the same depth as office", () => {
  const course = getCourse("nha-may-san-xuat");
  assert.equal(course?.chineseTitle, "工厂与生产");
  assert.equal(course?.lessons, 24);
  assert.equal(course?.freeLessons, 6);
  assert.equal(course?.availability, "available");
});

test("logistics track is published with the same depth as office", () => {
  const course = getCourse("kho-van-logistics");
  assert.equal(course?.chineseTitle, "仓储与物流");
  assert.equal(course?.lessons, 24);
  assert.equal(course?.freeLessons, 6);
  assert.equal(course?.availability, "available");
});

test("sales track is published with the same depth as office", () => {
  const course = getCourse("ban-hang-cham-soc-khach-hang");
  assert.equal(course?.chineseTitle, "销售与客户服务");
  assert.equal(course?.lessons, 24);
  assert.equal(course?.freeLessons, 6);
  assert.equal(course?.availability, "available");
});

test("restaurant track is published with the same depth as office", () => {
  const course = getCourse("nha-hang-dich-vu");
  assert.equal(course?.chineseTitle, "餐饮与服务");
  assert.equal(course?.lessons, 24);
  assert.equal(course?.freeLessons, 6);
  assert.equal(course?.availability, "available");
});

test("ecommerce track is published with the same depth as office", () => {
  const course = getCourse("thuong-mai-dien-tu");
  assert.equal(course?.chineseTitle, "电子商务");
  assert.equal(course?.lessons, 24);
  assert.equal(course?.freeLessons, 6);
  assert.equal(course?.availability, "available");
});

test("core workplace track is published with the same depth as office", () => {
  const course = getCourse("giao-tiep-cong-so");
  assert.equal(course?.chineseTitle, "职场基础沟通");
  assert.equal(course?.lessons, 24);
  assert.equal(course?.freeLessons, 6);
  assert.equal(course?.availability, "available");
});

test("high-frequency topic track exposes all imported lessons", () => {
  const course = getCourse("tieng-trung-tan-suat-cao");
  assert.equal(course?.chineseTitle, "高频汉语主题");
  assert.equal(course?.lessons, 27);
  assert.equal(course?.freeLessons, 6);
  assert.equal(course?.availability, "available");
});

test("course lookup returns the approved office track", () => {
  const course = getCourse("van-phong-hanh-chinh");
  assert.equal(course?.chineseTitle, "办公室与行政");
  assert.equal(course?.hanzi, "办");
  assert.equal(course?.lessons, 24);
  assert.equal(course?.freeLessons, 6);
});

test("repository falls back to demo content without DATABASE_URL", async () => {
  const previous = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;

  try {
    const catalog = await listPublishedCourses();
    const course = await getPublishedCourse("van-phong-hanh-chinh");
    assert.equal(catalog.length, 8);
    assert.equal(course?.title, "Văn phòng & hành chính");
  } finally {
    if (previous === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previous;
  }
});
