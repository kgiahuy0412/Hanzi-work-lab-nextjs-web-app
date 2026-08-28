import assert from "node:assert/strict";
import test from "node:test";
import {
  adminPeriodRange,
  buildAdminTimeSeries,
  escapeAdminCsvCell,
  formatAdminRelativeTime,
  parseAdminPeriod,
} from "../lib/admin-reporting.ts";

test("admin reporting accepts only supported dashboard periods", () => {
  assert.equal(parseAdminPeriod("day"), "day");
  assert.equal(parseAdminPeriod("week"), "week");
  assert.equal(parseAdminPeriod("month"), "month");
  assert.equal(parseAdminPeriod("year"), "month");
});

test("admin revenue series keeps every paid value in the correct bounded period", () => {
  const now = new Date("2026-08-26T12:00:00.000Z");
  const range = adminPeriodRange("day", now);
  const entries = [
    { at: new Date("2026-08-26T10:00:00.000Z"), amount: 79_000 },
    { at: new Date("2026-08-25T13:00:00.000Z"), amount: 329_000 },
    { at: new Date("2026-08-24T12:00:00.000Z"), amount: 999_000 },
  ];
  const series = buildAdminTimeSeries(range, entries, (entry) => entry.at, (entry) => entry.amount);
  assert.equal(series.length, 6);
  assert.equal(series.reduce((sum, point) => sum + point.value, 0), 408_000);
});

test("relative admin activity uses the requested Vietnamese time wording", () => {
  const now = new Date("2026-08-26T12:00:00.000Z");
  assert.equal(formatAdminRelativeTime(new Date("2026-08-26T10:00:00.000Z"), now), "2 giờ trước");
  assert.equal(formatAdminRelativeTime(new Date("2026-08-26T11:55:00.000Z"), now), "5 phút trước");
});

test("Excel-compatible CSV cells preserve commas, quotes and line breaks", () => {
  assert.equal(escapeAdminCsvCell("Nguyễn, An"), '"Nguyễn, An"');
  assert.equal(escapeAdminCsvCell('Gói "VIP"'), '"Gói ""VIP"""');
  assert.equal(escapeAdminCsvCell("Free"), "Free");
});
