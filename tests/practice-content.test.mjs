import test from "node:test";
import assert from "node:assert/strict";
import { coreWorkplaceLessons } from "../lib/core-workplace-course-seed.ts";
import { ecommerceLessons } from "../lib/ecommerce-course-seed.ts";
import { getPracticeListeningStatement, getPracticeMeaningQuestion, practiceIndustries, practiceScenarios } from "../lib/practice-content.ts";
import { getWeeklyChallenge } from "../lib/weekly-challenges.ts";
import { factoryLessons } from "../lib/factory-course-seed.ts";
import { logisticsLessons } from "../lib/logistics-course-seed.ts";
import { officeLessons } from "../lib/office-course-seed.ts";
import { restaurantLessons } from "../lib/restaurant-course-seed.ts";
import { salesLessons } from "../lib/sales-course-seed.ts";

test("work practice catalogue covers seven job families", () => {
  assert.deepEqual(practiceIndustries.map((industry) => industry.id), ["office", "factory", "logistics", "sales", "restaurant", "ecommerce", "core"]);
  assert.equal(practiceScenarios.length, 22);
  assert.ok(practiceIndustries.every((industry) => practiceScenarios.some((scenario) => scenario.industry === industry.id)));
});

test("weekly challenges link to a real published specialization", () => {
  const challenges = Array.from({ length: 72 }, (_, week) => getWeeklyChallenge(new Date(Date.UTC(2026, 0, 1 + (week * 7)))));
  assert.ok(challenges.some((challenge) => challenge.courseSlug === "van-phong-hanh-chinh"));
  assert.ok(challenges.some((challenge) => challenge.courseSlug === "nha-may-san-xuat"));
  assert.ok(challenges.some((challenge) => challenge.courseSlug === "kho-van-logistics"));
  assert.ok(challenges.some((challenge) => challenge.courseSlug === "ban-hang-cham-soc-khach-hang"));
  assert.ok(challenges.some((challenge) => challenge.courseSlug === "nha-hang-dich-vu"));
  assert.ok(challenges.some((challenge) => challenge.courseSlug === "thuong-mai-dien-tu"));
  assert.ok(challenges.some((challenge) => challenge.courseSlug === "giao-tiep-cong-so"));
  const lessonSlugsByCourse = new Map([
    ["van-phong-hanh-chinh", new Set(officeLessons.map((lesson) => lesson.slug))],
    ["nha-may-san-xuat", new Set(factoryLessons.map((lesson) => lesson.slug))],
    ["kho-van-logistics", new Set(logisticsLessons.map((lesson) => lesson.slug))],
    ["ban-hang-cham-soc-khach-hang", new Set(salesLessons.map((lesson) => lesson.slug))],
    ["nha-hang-dich-vu", new Set(restaurantLessons.map((lesson) => lesson.slug))],
    ["thuong-mai-dien-tu", new Set(ecommerceLessons.map((lesson) => lesson.slug))],
    ["giao-tiep-cong-so", new Set(coreWorkplaceLessons.map((lesson) => lesson.slug))],
  ]);
  assert.ok(challenges.every((challenge) => lessonSlugsByCourse.get(challenge.courseSlug)?.has(challenge.lessonSlug)));
});

test("practice catalogue provides a meaningful free sample without opening the whole library", () => {
  const freeScenarios = practiceScenarios.filter((scenario) => scenario.isFree);
  assert.equal(freeScenarios.length, 8);
  assert.ok(practiceIndustries.every((industry) => freeScenarios.some((scenario) => scenario.industry === industry.id)));
  assert.ok(practiceScenarios.some((scenario) => !scenario.isFree));
});

test("every work scenario contains a complete three-turn exercise", () => {
  const ids = practiceScenarios.map((scenario) => scenario.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(practiceScenarios.every((scenario) => scenario.exercises.length === 3));
  assert.ok(practiceScenarios.every((scenario) => scenario.exercises.every((exercise) => (
    exercise.options.length === 3
    && exercise.correctOption >= 0
    && exercise.correctOption < exercise.options.length
    && exercise.explanation.length > 20
  ))));
});

test("work scenarios create both correct and incorrect audio judgements", () => {
  const statements = practiceScenarios.flatMap((scenario) => (
    scenario.exercises.map((exercise) => getPracticeListeningStatement(exercise, scenario))
  ));
  assert.ok(statements.some((statement) => statement.isCorrect));
  assert.ok(statements.some((statement) => !statement.isCorrect));
  assert.ok(statements.every((statement) => statement.text.length > 0 && statement.correctText.length > 0));
  assert.ok(statements.every((statement) => /[㐀-鿿]/u.test(statement.text)));
});

test("every seeded audio offers four distinct Vietnamese meaning choices", () => {
  const questions = practiceScenarios.flatMap((scenario) => (
    scenario.exercises.map((exercise) => getPracticeMeaningQuestion(exercise))
  ));
  assert.ok(questions.every((question) => question.options.length === 4));
  assert.ok(questions.every((question) => new Set(question.options).size === 4));
  assert.ok(questions.every((question) => question.correctOption >= 0 && question.correctOption < 4));
  assert.ok(questions.every((question) => question.options.every((option) => !/[㐀-鿿]/u.test(option))));
});
