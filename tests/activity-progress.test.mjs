import assert from "node:assert/strict";
import test from "node:test";
import { formatVietnameseWorkDate, vietnamDayRange } from "../lib/date-format.ts";
import { isGameId, xpForGameScore } from "../lib/activity-progress.ts";
import { buildDailySession, defaultDailySessionSource, withDailySessionFlow } from "../lib/daily-session.ts";

test("game progress only accepts supported game ids", () => {
  assert.equal(isGameId("slice"), true);
  assert.equal(isGameId("quiz"), true);
  assert.equal(isGameId("unknown"), false);
  assert.equal(isGameId(123), false);
});

test("game XP has a useful minimum and scales with score", () => {
  assert.equal(xpForGameScore(0), 100);
  assert.equal(xpForGameScore(120), 100);
  assert.equal(xpForGameScore(1_000), 500);
});

test("practice date is generated in the Vietnam timezone", () => {
  const label = formatVietnameseWorkDate(new Date("2026-08-07T01:00:00.000Z"));
  assert.match(label, /07\/08\/2026/);
  assert.match(label.toLocaleLowerCase("vi-VN"), /thứ sáu/);
});

test("daily session uses the Vietnam calendar day boundary", () => {
  const range = vietnamDayRange(new Date("2026-08-06T17:30:00.000Z"));
  assert.equal(range.start.toISOString(), "2026-08-06T17:00:00.000Z");
  assert.equal(range.end.toISOString(), "2026-08-07T17:00:00.000Z");
});

test("daily session stays at ten minutes and advances from real progress", () => {
  const session = buildDailySession({
    ...defaultDailySessionSource,
    reviewedToday: 2,
    lessonCompletedToday: true,
  }, 5);

  assert.equal(session.totalMinutes, 10);
  assert.equal(session.totalSteps, 4);
  assert.equal(session.completedSteps, 1);
  assert.equal(session.reviewTarget, 3);
  assert.equal(session.steps[0].title, "1 từ đang chờ");
  assert.equal(session.steps[1].completed, true);
  assert.match(session.steps[3].href, /game=slice/);
  assert.match(session.steps[3].href, /session=today/);
});

test("daily session keeps the original review target after a learner resumes", () => {
  const session = buildDailySession({
    ...defaultDailySessionSource,
    reviewedToday: 2,
  }, 2);

  assert.equal(session.reviewTarget, 3);
  assert.equal(session.steps[0].completed, false);
  assert.match(session.steps[0].title, /1/);
  assert.equal(withDailySessionFlow("/practice?scenario=demo#listen"), "/practice?scenario=demo&session=today#listen");
});
