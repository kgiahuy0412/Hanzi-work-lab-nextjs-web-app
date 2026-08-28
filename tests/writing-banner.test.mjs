import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

test("writing catalog uses the shared animated Himi banner", async (t) => {
  const server = await createServer({
    appType: "custom",
    configFile: false,
    resolve: { alias: { "@": process.cwd() } },
    root: process.cwd(),
    server: { middlewareMode: true },
  });
  t.after(() => server.close());

  const { default: WritingPage } = await server.ssrLoadModule("/app/writing/page.tsx");
  const html = renderToStaticMarkup(React.createElement(WritingPage));

  assert.match(html, /class="himi-section-banner is-immersive is-writing/);
  assert.match(html, /class="himi-section-banner-mascot himi-immersive-banner-mascot himi-writing-banner-mascot"/);
  assert.doesNotMatch(html, /writing-catalog-hero-mark/);
});
