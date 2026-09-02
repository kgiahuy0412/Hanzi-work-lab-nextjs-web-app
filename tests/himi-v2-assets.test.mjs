import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const projectUrl = new URL("../", import.meta.url);
const assetUrl = (name) => new URL(`public/assets/mascot/himi-v2/${name}`, projectUrl);
const assetPath = (name) => fileURLToPath(assetUrl(name));
const read = (path) => readFile(new URL(path, projectUrl), "utf8");

const variants = ["wave", "listen", "cheer", "celebrate", "writing", "video"];

test("Himi v2 ships transparent animated and reduced-motion assets", async () => {
  for (const variant of variants) {
    const animated = await sharp(assetPath(`himi-${variant}.gif`), { animated: true }).metadata();
    const fallback = await sharp(assetPath(`himi-${variant}.webp`)).metadata();

    assert.equal(animated.format, "gif");
    assert.equal(animated.hasAlpha, true);
    assert.equal(animated.pages, 60);
    assert.equal(animated.pageHeight, 512);
    assert.ok(animated.delay?.every((delay) => delay <= 20));
    assert.equal(fallback.format, "webp");
    assert.equal(fallback.hasAlpha, true);
  }
});

test("UI references only the Himi v2 mascot suite", async () => {
  const sources = await Promise.all([
    read("components/review-home-studio.tsx"),
    read("components/listening-studio.tsx"),
    read("components/course-roadmap.tsx"),
    read("app/himi-section-banner.css"),
    read("app/video-learning.css"),
  ]);
  const combined = sources.join("\n");

  assert.match(combined, /\/assets\/mascot\/himi-v2\/himi-wave\.gif/);
  assert.match(combined, /\/assets\/mascot\/himi-v2\/himi-listen\.gif/);
  assert.match(combined, /\/assets\/mascot\/himi-v2\/himi-cheer\.gif/);
  assert.match(combined, /\/assets\/mascot\/himi-v2\/himi-celebrate\.webp/);
  assert.match(combined, /\/assets\/mascot\/himi-v2\/himi-writing\.gif/);
  assert.match(combined, /\/assets\/mascot\/himi-v2\/himi-video\.gif/);
  assert.doesNotMatch(combined, /\/assets\/mascot\/penguin|himi-current-wave-fixed|himi-current-static/);

  await assert.rejects(access(new URL("public/assets/mascot/penguin", projectUrl)));
  await assert.rejects(access(new URL("public/assets/home/himi-current-wave-fixed.gif", projectUrl)));
  await assert.rejects(access(new URL("public/assets/home/himi-current-static.webp", projectUrl)));
});
