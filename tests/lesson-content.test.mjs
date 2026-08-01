import test from "node:test";
import assert from "node:assert/strict";
import { coreWorkplaceCourseStats, coreWorkplaceLessons, coreWorkplaceModules } from "../lib/core-workplace-course-seed.ts";
import { ecommerceCourseStats, ecommerceLessons, ecommerceModules } from "../lib/ecommerce-course-seed.ts";
import { factoryCourseStats, factoryLessons, factoryModules } from "../lib/factory-course-seed.ts";
import { logisticsCourseStats, logisticsLessons, logisticsModules } from "../lib/logistics-course-seed.ts";
import { officeCourseStats, officeLessons, officeModules } from "../lib/office-course-seed.ts";
import { restaurantCourseStats, restaurantLessons, restaurantModules } from "../lib/restaurant-course-seed.ts";
import { salesCourseStats, salesLessons, salesModules } from "../lib/sales-course-seed.ts";
import { getLessonPageData, listPracticeVocabulary } from "../lib/lesson-repository.ts";

async function withoutDatabase(callback) {
  const previous = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  try {
    return await callback();
  } finally {
    if (previous === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previous;
  }
}

test("office curriculum contains four complete modules and 24 lessons", () => {
  assert.equal(officeModules.length, 4);
  assert.equal(officeLessons.length, 24);
  assert.equal(officeLessons.filter((lesson) => lesson.isFree).length, 6);
  assert.ok(officeModules.every((module) => officeLessons.filter((lesson) => lesson.moduleSlug === module.slug).length === 6));
  assert.ok(officeLessons.every((lesson) => lesson.vocabulary.length === 6));
  assert.ok(officeLessons.every((lesson) => lesson.content.dialogue.length >= 4));
  assert.ok(officeLessons.every((lesson) => lesson.content.notes.length >= 2));
  assert.equal(officeLessons.filter((lesson) => lesson.content.challenge).length, 4);
  assert.equal(officeCourseStats.vocabulary, 144);
});

test("factory curriculum contains four complete modules and 24 lessons", () => {
  assert.equal(factoryModules.length, 4);
  assert.equal(factoryLessons.length, 24);
  assert.equal(factoryLessons.filter((lesson) => lesson.isFree).length, 6);
  assert.ok(factoryModules.every((module) => factoryLessons.filter((lesson) => lesson.moduleSlug === module.slug).length === 6));
  assert.ok(factoryLessons.every((lesson) => lesson.vocabulary.length === 6));
  assert.ok(factoryLessons.every((lesson) => lesson.content.dialogue.length === 4));
  assert.ok(factoryLessons.every((lesson) => lesson.content.notes.length === 2));
  assert.equal(factoryLessons.filter((lesson) => lesson.content.challenge).length, 4);
  assert.equal(factoryCourseStats.vocabulary, 144);
});

test("logistics curriculum contains four complete modules and 24 lessons", () => {
  assert.equal(logisticsModules.length, 4);
  assert.equal(logisticsLessons.length, 24);
  assert.equal(logisticsLessons.filter((lesson) => lesson.isFree).length, 6);
  assert.ok(logisticsModules.every((module) => logisticsLessons.filter((lesson) => lesson.moduleSlug === module.slug).length === 6));
  assert.ok(logisticsLessons.every((lesson) => lesson.vocabulary.length === 6));
  assert.ok(logisticsLessons.every((lesson) => lesson.content.dialogue.length === 4));
  assert.ok(logisticsLessons.every((lesson) => lesson.content.notes.length === 2));
  assert.equal(logisticsLessons.filter((lesson) => lesson.content.challenge).length, 4);
  assert.equal(logisticsCourseStats.vocabulary, 144);
});

test("sales curriculum contains four complete modules and 24 lessons", () => {
  assert.equal(salesModules.length, 4);
  assert.equal(salesLessons.length, 24);
  assert.equal(salesLessons.filter((lesson) => lesson.isFree).length, 6);
  assert.ok(salesModules.every((module) => salesLessons.filter((lesson) => lesson.moduleSlug === module.slug).length === 6));
  assert.ok(salesLessons.every((lesson) => lesson.vocabulary.length === 6));
  assert.ok(salesLessons.every((lesson) => lesson.content.dialogue.length === 4));
  assert.ok(salesLessons.every((lesson) => lesson.content.notes.length === 2));
  assert.deepEqual(salesLessons.filter((lesson) => lesson.content.challenge).map((lesson) => lesson.content.challenge.questions.length), [5, 5, 5, 6]);
  assert.equal(salesCourseStats.vocabulary, 144);
});

test("restaurant curriculum contains four complete modules and 24 lessons", () => {
  assert.equal(restaurantModules.length, 4);
  assert.equal(restaurantLessons.length, 24);
  assert.equal(restaurantLessons.filter((lesson) => lesson.isFree).length, 6);
  assert.ok(restaurantModules.every((module) => restaurantLessons.filter((lesson) => lesson.moduleSlug === module.slug).length === 6));
  assert.ok(restaurantLessons.every((lesson) => lesson.vocabulary.length === 6));
  assert.ok(restaurantLessons.every((lesson) => lesson.content.dialogue.length === 4));
  assert.ok(restaurantLessons.every((lesson) => lesson.content.notes.length === 2));
  assert.deepEqual(restaurantLessons.filter((lesson) => lesson.content.challenge).map((lesson) => lesson.content.challenge.questions.length), [5, 5, 5, 6]);
  assert.equal(restaurantCourseStats.vocabulary, 144);
});

test("ecommerce curriculum contains four complete modules and 24 lessons", () => {
  assert.equal(ecommerceModules.length, 4);
  assert.equal(ecommerceLessons.length, 24);
  assert.equal(ecommerceLessons.filter((lesson) => lesson.isFree).length, 6);
  assert.ok(ecommerceModules.every((module) => ecommerceLessons.filter((lesson) => lesson.moduleSlug === module.slug).length === 6));
  assert.ok(ecommerceLessons.every((lesson) => lesson.vocabulary.length === 6));
  assert.ok(ecommerceLessons.every((lesson) => lesson.content.dialogue.length === 4));
  assert.ok(ecommerceLessons.every((lesson) => lesson.content.notes.length === 2));
  assert.deepEqual(ecommerceLessons.filter((lesson) => lesson.content.challenge).map((lesson) => lesson.content.challenge.questions.length), [5, 5, 5, 6]);
  assert.equal(ecommerceCourseStats.vocabulary, 144);
  const ecommerceWords = ecommerceLessons.flatMap((lesson) => lesson.vocabulary);
  assert.ok(ecommerceWords.every((word) => /^ecommerce-[a-z0-9-]+$/.test(word.slug)));
  assert.equal(new Set(ecommerceWords.map((word) => word.hanzi)).size, ecommerceWords.length);
});

test("core workplace curriculum contains four complete modules and 24 lessons", () => {
  assert.equal(coreWorkplaceModules.length, 4);
  assert.equal(coreWorkplaceLessons.length, 24);
  assert.equal(coreWorkplaceLessons.filter((lesson) => lesson.isFree).length, 6);
  assert.ok(coreWorkplaceModules.every((module) => coreWorkplaceLessons.filter((lesson) => lesson.moduleSlug === module.slug).length === 6));
  assert.ok(coreWorkplaceLessons.every((lesson) => lesson.vocabulary.length === 6));
  assert.ok(coreWorkplaceLessons.every((lesson) => lesson.content.dialogue.length === 4));
  assert.ok(coreWorkplaceLessons.every((lesson) => lesson.content.notes.length === 2));
  assert.deepEqual(coreWorkplaceLessons.filter((lesson) => lesson.content.challenge).map((lesson) => lesson.content.challenge.questions.length), [5, 5, 5, 6]);
  assert.equal(coreWorkplaceCourseStats.vocabulary, 144);
  const coreWords = coreWorkplaceLessons.flatMap((lesson) => lesson.vocabulary);
  assert.ok(coreWords.every((word) => /^core-[a-z0-9-]+$/.test(word.slug)));
  assert.equal(new Set(coreWords.map((word) => word.hanzi)).size, coreWords.length);
});

test("free lesson content is returned by the server repository", async () => withoutDatabase(async () => {
  const data = await getLessonPageData({ courseSlug: "van-phong-hanh-chinh" });
  assert.equal(data?.lesson?.slug, "chao-hoi-tai-noi-lam-viec");
  assert.equal(data?.access?.source, "free");
  assert.equal(data?.lesson?.vocabulary.length, 6);
  assert.equal(data?.lesson?.dialogue.length, 4);
}));

test("VIP lesson content is not returned to an anonymous viewer", async () => withoutDatabase(async () => {
  const data = await getLessonPageData({ courseSlug: "van-phong-hanh-chinh", lessonSlug: "lam-ro-yeu-cau-cong-viec" });
  assert.equal(data?.access?.allowed, false);
  assert.equal(data?.access?.source, "vip_required");
  assert.deepEqual(data?.lesson?.vocabulary, []);
  assert.deepEqual(data?.lesson?.dialogue, []);
  assert.deepEqual(data?.lesson?.notes, []);
}));

test("factory free and VIP lesson access is enforced by the server repository", async () => withoutDatabase(async () => {
  const freeData = await getLessonPageData({ courseSlug: "nha-may-san-xuat" });
  const vipData = await getLessonPageData({ courseSlug: "nha-may-san-xuat", lessonSlug: "doc-ke-hoach-san-xuat" });
  assert.equal(freeData?.lesson?.slug, "nhan-ca-va-kiem-tra-khu-vuc");
  assert.equal(freeData?.lesson?.vocabulary.length, 6);
  assert.equal(vipData?.access?.source, "vip_required");
  assert.deepEqual(vipData?.lesson?.vocabulary, []);
}));

test("logistics free and VIP lesson access is enforced by the server repository", async () => withoutDatabase(async () => {
  const freeData = await getLessonPageData({ courseSlug: "kho-van-logistics" });
  const vipData = await getLessonPageData({ courseSlug: "kho-van-logistics", lessonSlug: "doc-ma-hang-va-vi-tri-luu" });
  assert.equal(freeData?.lesson?.slug, "nhan-xe-va-xac-nhan-lich-den");
  assert.equal(freeData?.lesson?.vocabulary.length, 6);
  assert.equal(vipData?.access?.source, "vip_required");
  assert.deepEqual(vipData?.lesson?.vocabulary, []);
}));

test("sales free and VIP lesson access is enforced by the server repository", async () => withoutDatabase(async () => {
  const freeData = await getLessonPageData({ courseSlug: "ban-hang-cham-soc-khach-hang" });
  const vipData = await getLessonPageData({ courseSlug: "ban-hang-cham-soc-khach-hang", lessonSlug: "chuan-bi-va-gui-bao-gia" });
  assert.equal(freeData?.lesson?.slug, "chao-va-xac-dinh-nhu-cau");
  assert.equal(freeData?.lesson?.vocabulary.length, 6);
  assert.equal(vipData?.access?.source, "vip_required");
  assert.deepEqual(vipData?.lesson?.vocabulary, []);
}));

test("restaurant free and VIP lesson access is enforced by the server repository", async () => withoutDatabase(async () => {
  const freeData = await getLessonPageData({ courseSlug: "nha-hang-dich-vu" });
  const vipData = await getLessonPageData({ courseSlug: "nha-hang-dich-vu", lessonSlug: "gioi-thieu-thuc-don-va-mon-dac-trung" });
  assert.equal(freeData?.lesson?.slug, "chao-khach-va-hoi-so-nguoi");
  assert.equal(freeData?.lesson?.vocabulary.length, 6);
  assert.equal(vipData?.access?.source, "vip_required");
  assert.deepEqual(vipData?.lesson?.vocabulary, []);
}));

test("ecommerce free and VIP lesson access is enforced by the server repository", async () => withoutDatabase(async () => {
  const freeData = await getLessonPageData({ courseSlug: "thuong-mai-dien-tu" });
  const vipData = await getLessonPageData({ courseSlug: "thuong-mai-dien-tu", lessonSlug: "tim-kiem-va-sang-loc-nha-cung-cap" });
  assert.equal(freeData?.lesson?.slug, "phan-loai-san-pham-va-vai-tro-gian-hang");
  assert.equal(freeData?.lesson?.vocabulary.length, 6);
  assert.equal(vipData?.access?.source, "vip_required");
  assert.deepEqual(vipData?.lesson?.vocabulary, []);
}));

test("core workplace free and VIP lesson access is enforced by the server repository", async () => withoutDatabase(async () => {
  const freeData = await getLessonPageData({ courseSlug: "giao-tiep-cong-so" });
  const vipData = await getLessonPageData({ courseSlug: "giao-tiep-cong-so", lessonSlug: "tiep-nhan-va-nhac-lai-nhiem-vu" });
  assert.equal(freeData?.lesson?.slug, "chao-hoi-va-xung-ho-lich-su");
  assert.equal(freeData?.lesson?.vocabulary.length, 6);
  assert.equal(vipData?.access?.source, "vip_required");
  assert.deepEqual(vipData?.lesson?.vocabulary, []);
}));

test("practice repository only returns vocabulary from free lessons", async () => withoutDatabase(async () => {
  const vocabulary = await listPracticeVocabulary(12);
  assert.equal(vocabulary.length, 12);
  assert.ok(!vocabulary.some((word) => word.slug === "yaoqiu"));
  assert.ok(vocabulary.some((word) => word.slug.startsWith("factory-")));
  assert.ok(vocabulary.some((word) => word.slug.startsWith("logistics-")));
  assert.ok(vocabulary.some((word) => word.slug.startsWith("sales-")));
  assert.ok(vocabulary.some((word) => word.slug.startsWith("restaurant-")));
  assert.ok(vocabulary.some((word) => word.slug.startsWith("ecommerce-")));
  assert.ok(vocabulary.some((word) => word.slug.startsWith("core-")));
}));
