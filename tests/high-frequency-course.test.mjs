import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  highFrequencyCourseStats,
  highFrequencyLessons,
  highFrequencyModules,
} from "../lib/high-frequency-course-seed.ts";
import { getLessonPageData } from "../lib/lesson-repository.ts";

test("compact source becomes a complete two-stage, 27-topic course", () => {
  assert.equal(highFrequencyModules.length, 2);
  assert.equal(highFrequencyLessons.length, 27);
  assert.equal(highFrequencyCourseStats.vocabulary, 735);
  assert.equal(highFrequencyCourseStats.sentences, 270);
  assert.equal(highFrequencyCourseStats.freeLessons, 6);
  assert.equal(highFrequencyLessons.filter((lesson) => lesson.moduleSlug === "giao-tiep-hang-ngay").length, 15);
  assert.equal(highFrequencyLessons.filter((lesson) => lesson.moduleSlug === "giao-tiep-theo-tinh-huong").length, 12);
  assert.ok(highFrequencyLessons.every((lesson) => lesson.vocabulary.length >= 25));
  assert.ok(highFrequencyLessons.every((lesson) => lesson.content.dialogue.length === 0));
  assert.ok(highFrequencyLessons.every((lesson) => lesson.content.phrases?.length === 10));
  assert.equal(highFrequencyLessons[0].vocabulary[0].example, "");
});

test("every imported word audio URL resolves to a public file", () => {
  const audioUrls = highFrequencyLessons.flatMap((lesson) => lesson.vocabulary.map((word) => word.audioUrl));
  assert.equal(audioUrls.length, 735);
  assert.ok(audioUrls.every((url) => url && existsSync(resolve(process.cwd(), "public", url.slice(1)))));
});

test("course repository serves imported phrases without inventing a roleplay dialogue", async () => {
  const previous = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  try {
    const data = await getLessonPageData({ courseSlug: "tieng-trung-tan-suat-cao" });
    assert.equal(data?.lesson?.slug, "hf-upgrade-bai01");
    assert.equal(data?.lesson?.vocabulary.length, 25);
    assert.equal(data?.lesson?.phrases?.length, 10);
    assert.deepEqual(data?.lesson?.dialogue, []);
    assert.equal(data?.access?.source, "free");
  } finally {
    if (previous === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previous;
  }
});
