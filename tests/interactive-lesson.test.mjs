import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

test("typed role-play evaluation accepts a close Chinese response and rejects an unrelated one", async () => {
  const { evaluateTypedDialogueResponse, normalizeChineseResponse } = await import("../lib/dialogue-evaluation.ts");
  assert.equal(normalizeChineseResponse("我想买一件衬衫。"), "我想买一件衬衫");
  assert.equal(evaluateTypedDialogueResponse("我想买一件衬衫！", "我想买一件衬衫。").accepted, true);
  assert.equal(evaluateTypedDialogueResponse("我不知道", "我想买一件衬衫。").accepted, false);
});

test("iFlytek authorization keeps the API secret out of the signed websocket URL", async () => {
  const { createIflytekIseAuthUrl } = await import("../lib/iflytek-ise.ts");
  const url = await createIflytekIseAuthUrl({
    apiKey: "test-api-key",
    apiSecret: "never-expose-this-secret",
    now: new Date("2026-09-03T04:05:06.000Z"),
  });
  const parsed = new URL(url);
  const authorization = Buffer.from(parsed.searchParams.get("authorization"), "base64").toString("utf8");

  assert.equal(parsed.protocol, "wss:");
  assert.equal(parsed.hostname, "ise-api-sg.xf-yun.com");
  assert.equal(parsed.pathname, "/v2/ise");
  assert.match(authorization, /api_key="test-api-key"/);
  assert.match(authorization, /algorithm="hmac-sha256"/);
  assert.doesNotMatch(url, /never-expose-this-secret/);
});

test("an unlocked workplace lesson exposes phrase, pronunciation and role-play modes", async (t) => {
  const server = await createServer({
    appType: "custom",
    configFile: false,
    resolve: { alias: [{ find: "@", replacement: process.cwd() }] },
    root: process.cwd(),
    server: { middlewareMode: true },
  });
  t.after(() => server.close());

  const { LessonWorkspace } = await server.ssrLoadModule("/components/lesson-workspace.tsx");
  const lessonSummary = {
    slug: "shopping",
    title: "Đi mua hàng",
    summary: "Mua một chiếc áo sơ mi",
    situation: "Tại cửa hàng quần áo",
    estimatedMinutes: 10,
    isFree: true,
    order: 0,
    moduleSlug: "daily",
    moduleTitle: "Đời sống",
    moduleOrder: 0,
  };
  const html = renderToStaticMarkup(React.createElement(LessonWorkspace, {
    course: {
      slug: "giao-tiep-doi-song",
      category: "Đời sống",
      title: "Giao tiếp đời sống",
      chineseTitle: "",
      hanzi: "",
      description: "",
      lessons: 1,
      minutes: 10,
      freeLessons: 1,
      level: "HSK 1",
      color: "#fff",
      ink: "#000",
      availability: "available",
    },
    lessons: [lessonSummary],
    lesson: {
      ...lessonSummary,
      vocabulary: [{ slug: "shirt", hanzi: "衬衫", pinyin: "chènshān", meaning: "áo sơ mi", example: "我想买一件衬衫。", translation: "Tôi muốn mua một chiếc áo sơ mi.", audioUrl: null }],
      dialogue: [
        { speaker: "A", hanzi: "您好，请问您需要什么？", pinyin: "Nín hǎo, qǐngwèn nín xūyào shénme?", translation: "Xin chào, anh/chị cần gì?" },
        { speaker: "B", hanzi: "我想买一件衬衫。", pinyin: "Wǒ xiǎng mǎi yí jiàn chènshān.", translation: "Tôi muốn mua một chiếc áo sơ mi." },
      ],
      notes: [{ title: "Nói nhu cầu", pattern: "我想买……", explanation: "Dùng để nói món đồ muốn mua." }],
    },
    access: { allowed: true, source: "free" },
    progress: null,
    authenticated: false,
    dailyFlow: false,
    dailyNextStep: null,
  }));

  for (const label of ["Từ vựng", "Cụm từ", "Nghe &amp; nói", "Hội thoại"]) assert.match(html, new RegExp(`>${label}<`));

  const { LessonPhrasebook } = await server.ssrLoadModule("/components/lesson-phrasebook.tsx");
  const phraseHtml = renderToStaticMarkup(React.createElement(LessonPhrasebook, {
    words: [{ slug: "shirt", hanzi: "衬衫", pinyin: "chènshān", meaning: "áo sơ mi", example: "我想买一件衬衫。", translation: "Tôi muốn mua một chiếc áo sơ mi.", audioUrl: null }],
    dialogue: [
      { speaker: "A", hanzi: "您好，请问您需要什么？", pinyin: "Nín hǎo, qǐngwèn nín xūyào shénme?", translation: "Xin chào, anh/chị cần gì?" },
      { speaker: "B", hanzi: "我想买一件衬衫。", pinyin: "Wǒ xiǎng mǎi yí jiàn chènshān.", translation: "Tôi muốn mua một chiếc áo sơ mi." },
    ],
    notes: [{ title: "Nói nhu cầu", pattern: "我想买……", explanation: "Dùng để nói món đồ muốn mua." }],
    onFinished() {},
  }));

  assert.match(phraseHtml, /data-testid="lesson-phrase-deck"/);
  assert.match(phraseHtml, /role="progressbar"/);
  assert.match(phraseHtml, /Cụm 01 \/ 03/);
  for (const label of ["Nghe cụm từ", "Lưu cụm", "Đã hiểu · Tiếp tục", "Cụm tiếp theo"]) assert.match(phraseHtml, new RegExp(label));
});
