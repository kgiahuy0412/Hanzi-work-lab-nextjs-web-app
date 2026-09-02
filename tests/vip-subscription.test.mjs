import assert from "node:assert/strict";
import test from "node:test";
import { calculateVipEndsAt, calculateVipPlanEndsAt, vipDaysRemaining } from "../lib/vip-subscription.ts";
import { LIFETIME_VIP_PLAN_CODE, vipPlanAccessLabel, vipPlanDurationLabel } from "../lib/vip-plan.ts";

const day = 24 * 60 * 60 * 1_000;

test("a new VIP entitlement starts from the grant time", () => {
  const now = new Date("2026-08-10T00:00:00.000Z");
  assert.equal(calculateVipEndsAt(now, null, 30).toISOString(), "2026-09-09T00:00:00.000Z");
});

test("an active VIP entitlement extends from its existing end date", () => {
  const now = new Date("2026-08-10T00:00:00.000Z");
  const currentEnd = new Date("2026-09-09T00:00:00.000Z");
  assert.equal(calculateVipEndsAt(now, currentEnd, 180).getTime(), currentEnd.getTime() + 180 * day);
});

test("an expired entitlement restarts from now and reports bounded remaining days", () => {
  const now = new Date("2026-08-10T00:00:00.000Z");
  const expired = new Date("2026-08-01T00:00:00.000Z");
  const end = calculateVipEndsAt(now, expired, 30);
  assert.equal(vipDaysRemaining(end, now), 30);
  assert.equal(vipDaysRemaining(expired, now), 0);
  assert.equal(vipDaysRemaining(null, now), null);
});

test("invalid VIP durations are rejected", () => {
  const now = new Date("2026-08-10T00:00:00.000Z");
  assert.throws(() => calculateVipEndsAt(now, null, 0), RangeError);
  assert.throws(() => calculateVipEndsAt(now, null, 3_651), RangeError);
});

test("a lifetime VIP plan has no end date and uses a permanent access label", () => {
  const now = new Date("2026-08-10T00:00:00.000Z");
  assert.equal(calculateVipPlanEndsAt(now, null, LIFETIME_VIP_PLAN_CODE, 3_650), null);
  assert.equal(vipPlanDurationLabel(LIFETIME_VIP_PLAN_CODE, 3_650), "Vĩnh viễn");
  assert.equal(vipPlanAccessLabel(LIFETIME_VIP_PLAN_CODE, 3_650), "Quyền truy cập vĩnh viễn");
});

test("a fixed-term plan still receives its calculated end date", () => {
  const now = new Date("2026-08-10T00:00:00.000Z");
  assert.equal(calculateVipPlanEndsAt(now, null, "VIP_1M", 30)?.toISOString(), "2026-09-09T00:00:00.000Z");
});
