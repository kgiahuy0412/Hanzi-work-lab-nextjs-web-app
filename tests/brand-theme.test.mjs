import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import * as brand from "../lib/brand.ts";

test("exposes the official Himi surface colors to the document theme", () => {
  assert.equal(typeof brand.createBrandTheme, "function");

  const theme = brand.createBrandTheme();

  assert.equal(theme["--himi-red"], "#FF4C3B");
  assert.equal(theme["--himi-orange"], "#FF8E2D");
  assert.equal(theme["--himi-black"], "#222222");
  assert.equal(theme["--himi-white"], "#FFFFFF");
});

test("uses white copy on saturated brand surfaces across the website", () => {
  const theme = brand.createBrandTheme();

  assert.equal(theme["--himi-on-red"], "#FFFFFF");
  assert.equal(theme["--himi-on-orange"], "#FFFFFF");
});

test("provides shared semantic colors for every branded page family", () => {
  const theme = brand.createBrandTheme();

  assert.equal(theme["--himi-muted"], "#625B58");
  assert.equal(theme["--himi-line"], "#E8E1DE");
  assert.equal(theme["--himi-red-soft"], "#FFF0EE");
  assert.equal(theme["--himi-orange-soft"], "#FFF4E8");
  assert.ok(brand.contrastRatio(theme["--himi-white"], theme["--himi-muted"]) >= 4.5);
});

test("maps the remaining account and notification chrome to Himi brand tokens", async () => {
  const css = await readFile(new URL("../app/brand-theme.css", import.meta.url), "utf8");

  assert.match(css, /\.account-profile-avatar\s*\{[\s\S]*var\(--himi-red\)[\s\S]*var\(--himi-orange\)/);
  assert.match(css, /\.account-page-title,[\s\S]*\.account-security-row,[\s\S]*color:\s*var\(--himi-black\)/);
  assert.match(css, /\.notifications-header-aside\s*\{[\s\S]*var\(--himi-red-soft\)[\s\S]*var\(--himi-orange-soft\)/);
  assert.match(css, /\.learner-page-header-eyebrow,[\s\S]*color:\s*var\(--himi-red\)/);
});

test("uses the Himi red tone for the learner rail Pro card", async () => {
  const css = await readFile(new URL("../app/brand-theme.css", import.meta.url), "utf8");

  assert.match(css, /\.rail-pro-card\s*\{[\s\S]*?border-color:[^;]*var\(--himi-red\)[\s\S]*?background:[^;]*var\(--himi-red\)/);
  assert.match(css, /\.rail-pro-crown\s*\{[\s\S]*?background:\s*var\(--himi-red\)/);
  assert.match(css, /\.rail-pro-action\s*\{[\s\S]*?background:\s*var\(--himi-red\)/);
});
