import assert from "node:assert/strict";
import test from "node:test";
import {
  canActOnAssignedPracticeReview,
  canClaimPracticeReview,
  canSeePracticeReviewTask,
  formatPracticeReviewDueDateInput,
  isPracticeReviewOverdue,
  parsePracticeReviewDueDate,
  parsePracticeReviewPriority,
} from "../lib/practice-review-queue.ts";

test("practice review priorities and Bangkok due dates are validated", () => {
  assert.equal(parsePracticeReviewPriority("urgent"), "urgent");
  assert.equal(parsePracticeReviewPriority("low"), null);
  assert.equal(parsePracticeReviewDueDate("2026-08-10")?.toISOString(), "2026-08-10T16:59:59.999Z");
  assert.equal(parsePracticeReviewDueDate("2026-02-30"), null);
  assert.equal(formatPracticeReviewDueDateInput(new Date("2026-08-10T16:59:59.999Z")), "2026-08-10");
});

test("reviewers only see and act on their own assignments or unassigned work", () => {
  assert.equal(canSeePracticeReviewTask("reviewer", "reviewer-1", null), true);
  assert.equal(canSeePracticeReviewTask("reviewer", "reviewer-1", "reviewer-2"), false);
  assert.equal(canSeePracticeReviewTask("admin", "admin-1", "reviewer-2"), true);
  assert.equal(canClaimPracticeReview("reviewer", "reviewer-1", null), true);
  assert.equal(canClaimPracticeReview("reviewer", "reviewer-1", "reviewer-2"), false);
  assert.equal(canActOnAssignedPracticeReview("reviewer", "reviewer-1", "reviewer-1"), true);
  assert.equal(canActOnAssignedPracticeReview("reviewer", "reviewer-1", null), false);
  assert.equal(canActOnAssignedPracticeReview("admin", "admin-1", null), true);
});

test("overdue state only applies while a scenario is waiting for review", () => {
  const now = new Date("2026-08-08T10:00:00.000Z");
  assert.equal(isPracticeReviewOverdue("review", new Date("2026-08-08T09:59:59.000Z"), now), true);
  assert.equal(isPracticeReviewOverdue("published", new Date("2026-08-08T09:59:59.000Z"), now), false);
  assert.equal(isPracticeReviewOverdue("review", null, now), false);
});
