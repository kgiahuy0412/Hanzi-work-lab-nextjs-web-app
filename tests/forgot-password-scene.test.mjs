import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("forgot-password reuses the learner authentication scene", async () => {
  const [page, authCard] = await Promise.all([
    read("app/forgot-password/page.tsx"),
    read("components/auth-card.tsx"),
  ]);

  assert.match(page, /mode="forgot-password"/);
  assert.match(authCard, /learnerLogin \|\| registering \|\| forgotPassword/);
  assert.match(authCard, /forgotPassword \? "\/api\/auth\/forgot-password"/);
  assert.match(authCard, /forgotPassword \? "Gửi liên kết đặt lại"/);
  assert.match(authCard, /Quay lại đăng nhập/);
  assert.match(authCard, /auth-page-forgot-scene/);
  assert.match(authCard, /auth-card-forgot-scene/);
});
