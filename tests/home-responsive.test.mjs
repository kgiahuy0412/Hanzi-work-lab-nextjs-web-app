import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("home portal reserves mobile navigation space and keeps phone controls touch friendly", async () => {
  const css = await read("app/home-portal.css");
  const shell = await read("components/learner-app-shell.tsx");
  const responsive = await read("app/responsive.css");
  const brand = await read("app/brand-theme.css");

  assert.match(css, /--home-mobile-nav-clearance:\s*calc\(86px \+ env\(safe-area-inset-bottom\)\)/);
  assert.match(css, /min-height:\s*max\(100dvh, 720px\)/);
  assert.match(css, /\.home-portal-art\s*\{[\s\S]*top:\s*0;[\s\S]*bottom:\s*var\(--home-mobile-nav-clearance\);[\s\S]*height:\s*auto/);
  assert.match(css, /font-size:\s*15px;\s*\n\s*line-height:\s*1\.5/);
  assert.match(css, /\.home-portal-quick-action\s*\{[\s\S]*min-height:\s*100px/);
  assert.match(css, /@media \(max-width: 359px\)[\s\S]*right:\s*max\(8px, env\(safe-area-inset-right\)\)/);
  assert.match(responsive, /\.learner-app-shell \.learn-topbar\s*\{\s*\n\s*display:\s*none/);
  assert.match(responsive, /grid-template-columns:\s*repeat\(6, minmax\(0, 1fr\)\)/);
  assert.match(shell, /<UserRound aria-hidden="true" size=\{20\} \/><span>Tài khoản<\/span>/);
  assert.match(shell, /<span>Luyện tập<\/span>/);
  assert.match(await read("components/review-home-studio.tsx"), /aria-label="Bắt đầu luyện nhanh"[\s\S]*Luyện nói[\s\S]*Nghe phản xạ[\s\S]*Ôn từ/);
  assert.match(css, /\.home-portal-quick-dock\s*\{[\s\S]*grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.home-portal-actions\s*\{\s*\n\s*display:\s*none/);
  assert.match(brand, /\.home-portal-art::before\s*\{[\s\S]*--home-portal-curve-height:[\s\S]*border-radius:\s*50%/);
  assert.match(brand, /top:\s*calc\(260px - var\(--home-portal-curve-height\)\)/);
  assert.match(brand, /@media \(max-width: 720px\)[\s\S]*\.home-portal-art::after[\s\S]*linear-gradient\(180deg/);
  assert.match(brand, /\.home-portal-copy > p\s*\{\s*\n\s*color:\s*color-mix\(in srgb, var\(--himi-black\) 86%, var\(--himi-white\)\);\s*\n\s*font-weight:\s*650/);
});

test("home portal uses the rhythmic Homi headline and Roboto Vietnamese display typeface", async () => {
  const page = await read("components/review-home-studio.tsx");
  const layout = await read("app/layout.tsx");
  const css = await read("app/home-portal.css");

  assert.match(page, /<span>Mỗi ngày một tí,<\/span>/);
  assert.match(page, /<span>tự tin cùng <em>Homi<\/em>\.<\/span>/);
  assert.match(page, /Tình huống thật\. Phản xạ tự nhiên\./);
  assert.match(layout, /Roboto/);
  assert.match(layout, /subsets:\s*\["latin", "vietnamese"\]/);
  assert.match(layout, /weight:\s*"800"/);
  assert.match(css, /font-family:\s*var\(--font-roboto\) !important/);
  assert.match(css, /\.home-portal-copy h1 em[\s\S]*color:\s*#ff4c3b/);
});

test("home portal treats short landscape viewports as phones instead of desktop rail layouts", async () => {
  const css = await read("app/home-portal.css");

  assert.match(css, /@media \(orientation: landscape\) and \(max-height: 500px\) and \(max-width: 960px\)/);
  assert.match(css, /\.learner-app-shell\.is-home-route \.learn-rail\s*\{\s*\n\s*display:\s*none/);
  assert.match(css, /grid-template-columns:\s*repeat\(6, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.home-portal-copy\s*\{\s*\n\s*width:\s*52%;\s*\n\s*padding:\s*max\(22px, env\(safe-area-inset-top\)\)/);
});
