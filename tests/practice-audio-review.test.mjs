import assert from "node:assert/strict";
import test from "node:test";
import { readCloudinaryCredentials } from "../lib/cloudinary-practice-audio.ts";
import {
  canReviewPracticeAudio,
  parsePracticeAudioReviewIssues,
  parsePracticeAudioReviewStatus,
} from "../lib/practice-audio-review.ts";

test("Cloudinary credentials support the single CLOUDINARY_URL secret", () => {
  assert.deepEqual(readCloudinaryCredentials({
    CLOUDINARY_URL: "cloudinary://api-key:api-secret@hanziwork-media",
  }), {
    cloudName: "hanziwork-media",
    apiKey: "api-key",
    apiSecret: "api-secret",
  });
  assert.equal(readCloudinaryCredentials({ CLOUDINARY_URL: "https://invalid.example" }), null);
});

test("audio review values are allowlisted and deduplicated", () => {
  assert.equal(parsePracticeAudioReviewStatus("approved"), "approved");
  assert.equal(parsePracticeAudioReviewStatus("deleted"), null);
  assert.deepEqual(parsePracticeAudioReviewIssues(["clarity", "clarity", "unknown", "tone"]), ["clarity", "tone"]);
});

test("only the assigned reviewer or an admin can review audio", () => {
  assert.equal(canReviewPracticeAudio({ id: "reviewer-1", role: "reviewer" }, "review", "reviewer-1"), true);
  assert.equal(canReviewPracticeAudio({ id: "reviewer-2", role: "reviewer" }, "review", "reviewer-1"), false);
  assert.equal(canReviewPracticeAudio({ id: "admin-1", role: "admin" }, "review", null), true);
  assert.equal(canReviewPracticeAudio({ id: "reviewer-1", role: "reviewer" }, "published", "reviewer-1"), true);
  assert.equal(canReviewPracticeAudio({ id: "reviewer-2", role: "reviewer" }, "published", "reviewer-1"), false);
  assert.equal(canReviewPracticeAudio({ id: "admin-1", role: "admin" }, "published", null), true);
  assert.equal(canReviewPracticeAudio({ id: "admin-1", role: "admin" }, "draft", null), false);
});
