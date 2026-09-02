import assert from "node:assert/strict";
import test from "node:test";
import {
  allowedPracticeTransitions,
  assessPracticeReadiness,
  canEditPracticeScenario,
  canTransitionAssignedPracticeScenario,
  isPracticeStaffRole,
} from "../lib/practice-workflow.ts";

test("practice staff roles have a separated editorial workflow", () => {
  assert.equal(isPracticeStaffRole("learner"), false);
  assert.equal(isPracticeStaffRole("editor"), true);
  assert.equal(canEditPracticeScenario("editor", "draft"), true);
  assert.equal(canEditPracticeScenario("editor", "review"), false);
  assert.deepEqual(allowedPracticeTransitions("editor", "draft"), ["review"]);
  assert.deepEqual(allowedPracticeTransitions("reviewer", "review"), ["draft", "published"]);
  assert.deepEqual(allowedPracticeTransitions("reviewer", "draft"), []);
  assert.deepEqual(allowedPracticeTransitions("admin", "published"), ["draft", "archived"]);
  assert.equal(canTransitionAssignedPracticeScenario({ id: "reviewer-1", role: "reviewer" }, null, "review", "published"), false);
  assert.equal(canTransitionAssignedPracticeScenario({ id: "reviewer-1", role: "reviewer" }, "reviewer-1", "review", "published"), true);
  assert.equal(canTransitionAssignedPracticeScenario({ id: "admin-1", role: "admin" }, null, "review", "published"), true);
});

test("practice publishing requires audio, transcripts and valid meaning answers", () => {
  const complete = [
    { listeningText: "请确认时间。", audioAssetId: "audio-1", audioUrl: null, audioReviewStatus: "approved", options: ["A", "B"], correctOption: 0, isStatementCorrect: true },
    { listeningText: "不用检查。", audioAssetId: "audio-2", audioUrl: null, audioReviewStatus: "approved", options: ["A", "B"], correctOption: 1, isStatementCorrect: false },
  ];
  assert.equal(assessPracticeReadiness(complete).ready, true);
  assert.equal(assessPracticeReadiness(complete.map((item) => ({ ...item, audioAssetId: null }))).ready, false);
  assert.equal(assessPracticeReadiness(complete.map((item) => ({ ...item, audioReviewStatus: "pending" }))).ready, false);
  assert.equal(assessPracticeReadiness(complete.map((item) => ({ ...item, isStatementCorrect: true }))).ready, true);
});
