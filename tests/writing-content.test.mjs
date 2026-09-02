import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "vite";

test("writing catalog exposes every available HSK 1–6 lesson", async (t) => {
  const server = await createServer({
    appType: "custom",
    configFile: false,
    resolve: { alias: { "@": process.cwd() } },
    root: process.cwd(),
    server: { middlewareMode: true },
  });
  t.after(() => server.close());

  const writing = await server.ssrLoadModule("/lib/writing-content.ts");
  const levels = writing.getWritingLevels();

  assert.deepEqual(levels.map((level) => level.lessonCount), [15, 15, 20, 20, 36, 40]);
  assert.equal(levels.reduce((total, level) => total + level.lessonCount, 0), 146);

  for (const level of levels) {
    const lessons = writing.getWritingLessons(level.id);
    assert.equal(lessons.length, level.lessonCount);
    assert.ok(lessons.every((lesson) => lesson.characterCount > 0));

    const firstLesson = lessons[0];
    const topic = writing.getWritingTopic(level.id, firstLesson.id);
    assert.equal(topic.levelId, level.id);
    assert.equal(topic.lessonNumber, firstLesson.lessonNumber);
    assert.equal(topic.characters.length, firstLesson.characterCount);
    assert.ok(topic.characters.every((character) => character.id && character.hanzi));
  }
});
