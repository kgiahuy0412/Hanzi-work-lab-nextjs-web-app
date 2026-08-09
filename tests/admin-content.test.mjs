import assert from "node:assert/strict";
import test from "node:test";
import { normalizeSlug, parseContentStatus, parseLessonContent, parseStringLines, parseTags } from "../lib/admin-content-validation.ts";

test("admin slugs are normalized from Vietnamese titles", () => {
  assert.equal(normalizeSlug("", "Văn phòng & Hành chính"), "van-phong-hanh-chinh");
  assert.equal(normalizeSlug("  Bài học số 01  ", "fallback"), "bai-hoc-so-01");
});

test("lesson editor parses structured dialogue and notes", () => {
  const content = parseLessonContent(
    "A | 你好 | Nǐ hǎo | Xin chào\nB | 您好 | Nín hǎo | Chào anh/chị",
    "Lịch sự | 您好 | Dùng với người lớn tuổi",
  );
  assert.equal(content?.dialogue.length, 2);
  assert.equal(content?.notes[0].pattern, "您好");
  assert.equal(parseLessonContent("Thiếu | cột", ""), null);
});

test("admin status and tags stay within supported values", () => {
  assert.equal(parseContentStatus("published"), "published");
  assert.equal(parseContentStatus("unknown"), "draft");
  assert.deepEqual(parseTags("văn phòng, email, văn phòng"), ["văn phòng", "email"]);
});

test("practice exercise options are parsed as bounded lines", () => {
  assert.deepEqual(parseStringLines("Đáp án một\nĐáp án hai\n\nĐáp án ba"), ["Đáp án một", "Đáp án hai", "Đáp án ba"]);
  assert.equal(parseStringLines("A\nB\nC", 2), null);
});
