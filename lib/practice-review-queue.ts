import type { UserRole } from "./auth-service.ts";

export const practiceReviewPriorities = ["normal", "high", "urgent"] as const;

export type PracticeReviewPriority = typeof practiceReviewPriorities[number];

export function parsePracticeReviewPriority(value: string): PracticeReviewPriority | null {
  return practiceReviewPriorities.find((priority) => priority === value) ?? null;
}

export function parsePracticeReviewDueDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const calendarDate = new Date(Date.UTC(year, month - 1, day));
  if (calendarDate.getUTCFullYear() !== year || calendarDate.getUTCMonth() !== month - 1 || calendarDate.getUTCDate() !== day) {
    return null;
  }
  return new Date(Date.UTC(year, month - 1, day, 16, 59, 59, 999));
}

export function formatPracticeReviewDueDateInput(value: Date | null): string {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

export function canSeePracticeReviewTask(role: UserRole, actorId: string, reviewerId: string | null): boolean {
  if (role === "admin" || role === "editor") return true;
  return role === "reviewer" && (reviewerId === null || reviewerId === actorId);
}

export function canClaimPracticeReview(role: UserRole, actorId: string, reviewerId: string | null): boolean {
  return role === "reviewer" && (reviewerId === null || reviewerId === actorId);
}

export function canActOnAssignedPracticeReview(role: UserRole, actorId: string, reviewerId: string | null): boolean {
  return role === "admin" || (role === "reviewer" && reviewerId === actorId);
}

export function isPracticeReviewOverdue(status: string, dueAt: Date | null, now = new Date()): boolean {
  return status === "review" && dueAt !== null && dueAt.getTime() < now.getTime();
}
