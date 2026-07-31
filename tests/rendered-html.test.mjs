import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("home page contains the HanziWork daily learning dashboard", async () => {
  const source = await read("app/page.tsx");
  assert.match(source, /Bài học hôm nay/);
  assert.match(source, /Bắt đầu bài học/);
});

test("prototype includes learner, VIP and admin routes", async () => {
  const files = await Promise.all([read("app/courses/page.tsx"), read("app/vip/page.tsx"), read("app/admin/page.tsx")]);
  assert.match(files[0], /CourseExplorer/);
  assert.match(files[1], /Quy trình mua VIP dự kiến/);
  assert.match(files[2], /Tổng quan vận hành/);
});

test("layout provides Vietnamese metadata", async () => {
  const source = await read("app/layout.tsx");
  assert.match(source, /HanziWork — Tiếng Trung cho người đi làm/);
  assert.match(source, /<html lang="vi"/);
});
