import type { ContentStatus } from "./admin-content-validation.ts";
import type { PracticeWorkflowActor } from "./practice-workflow.ts";
import { canActOnAssignedPracticeReview } from "./practice-review-queue.ts";

export const practiceAudioReviewStatuses = ["pending", "approved", "re_record"] as const;
export type PracticeAudioReviewStatus = (typeof practiceAudioReviewStatuses)[number];

export const practiceAudioReviewIssues = [
  "pronunciation",
  "speed",
  "clarity",
  "background_noise",
  "transcript_mismatch",
  "tone",
] as const;
export type PracticeAudioReviewIssue = (typeof practiceAudioReviewIssues)[number];

export const practiceAudioReviewStatusLabels: Record<PracticeAudioReviewStatus, string> = {
  pending: "Chờ nghe duyệt",
  approved: "Đã duyệt",
  re_record: "Cần thu lại",
};

export const practiceAudioReviewIssueLabels: Record<PracticeAudioReviewIssue, string> = {
  pronunciation: "Phát âm chưa chuẩn",
  speed: "Tốc độ chưa phù hợp",
  clarity: "Giọng chưa rõ",
  background_noise: "Có tạp âm",
  transcript_mismatch: "Không khớp transcript",
  tone: "Ngữ điệu chưa tự nhiên",
};

export function parsePracticeAudioReviewStatus(value: string): PracticeAudioReviewStatus | null {
  return practiceAudioReviewStatuses.find((status) => status === value) ?? null;
}

export function parsePracticeAudioReviewIssues(values: string[]): PracticeAudioReviewIssue[] {
  return Array.from(new Set(values.filter((value): value is PracticeAudioReviewIssue => (
    practiceAudioReviewIssues.includes(value as PracticeAudioReviewIssue)
  ))));
}

export function canReviewPracticeAudio(
  actor: PracticeWorkflowActor,
  scenarioStatus: ContentStatus,
  reviewerId: string | null,
): boolean {
  if (scenarioStatus !== "review" && scenarioStatus !== "published") return false;
  if (actor.role === "admin") return true;
  return actor.role === "reviewer" && canActOnAssignedPracticeReview(actor.role, actor.id, reviewerId);
}
