import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

test("listening hub presents HSK and scenario practice as two accessible modes", async (t) => {
  const server = await createServer({
    appType: "custom",
    configFile: false,
    resolve: { alias: { "@": process.cwd() } },
    root: process.cwd(),
    server: { middlewareMode: true },
  });
  t.after(() => server.close());

  const { default: ListeningPage } = await server.ssrLoadModule("/app/listening/page.tsx");
  const page = await ListeningPage({ searchParams: Promise.resolve({}) });
  const html = renderToStaticMarkup(React.createElement(React.Fragment, null, page));

  assert.match(html, /aria-label="Chế độ Nghe và phản xạ"/);
  assert.match(html, /(?:aria-current="page"[^>]*href="\/listening"|href="\/listening"[^>]*aria-current="page")/);
  assert.match(html, /href="\/listening\?mode=scenario"/);
  assert.match(html, />Theo cấp độ HSK</);
  assert.match(html, />Theo tình huống</);
  assert.match(html, />Báo cáo luyện nghe</);
  assert.match(html, />Tổng số câu</);
  assert.match(html, />Độ chính xác</);
  assert.match(html, />Phản xạ trung bình</);
  assert.doesNotMatch(html, /HSK 7–9: Nghe chuyên sâu/);
});

test("listening hub opens the HSK level selected from the curriculum", async (t) => {
  const server = await createServer({
    appType: "custom",
    configFile: false,
    resolve: { alias: { "@": process.cwd() } },
    root: process.cwd(),
    server: { middlewareMode: true },
  });
  t.after(() => server.close());

  const { default: ListeningPage } = await server.ssrLoadModule("/app/listening/page.tsx");
  const page = await ListeningPage({ searchParams: Promise.resolve({ level: "hsk-4" }) });
  const html = renderToStaticMarkup(React.createElement(React.Fragment, null, page));

  assert.match(html, /aria-label="HSK 4:[^"]*" aria-pressed="true"/);
  assert.match(html, />HSK 4 · 4 bài học</);
});
