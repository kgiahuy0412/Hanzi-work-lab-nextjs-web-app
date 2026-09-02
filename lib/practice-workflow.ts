import type { ContentStatus } from "./admin-content-validation.ts";
import type { UserRole } from "./auth-service.ts";
import { canActOnAssignedPracticeReview } from "./practice-review-queue.ts";

export type PracticeStaffRole = Extract<UserRole, "editor" | "reviewer" | "admin">;
export type PracticeWorkflowActor = { id: string; role: PracticeStaffRole };

export type PracticeReadinessItem = {
  id: "industry" | "exercise_count" | "transcript" | "audio" | "audio_review" | "answers";
  label: string;
  detail: string;
  passed: boolean;
};

type ReadinessExercise = {
  listeningText: string | null;
  audioAssetId: string | null;
  audioUrl: string | null;
  audioReviewStatus: string;
  options: unknown;
  correctOption: number;
};

export function isPracticeStaffRole(role: UserRole | string | null | undefined): role is PracticeStaffRole {
  return role === "editor" || role === "reviewer" || role === "admin";
}

export function canAuthorPractice(role: UserRole): role is Extract<UserRole, "editor" | "admin"> {
  return role === "editor" || role === "admin";
}

export function canEditPracticeScenario(role: UserRole, status: ContentStatus): boolean {
  return canAuthorPractice(role) && status === "draft";
}

export function allowedPracticeTransitions(role: UserRole, status: ContentStatus): ContentStatus[] {
  if (role === "editor") return status === "draft" ? ["review"] : [];
  if (role === "reviewer") return status === "review" ? ["draft", "published"] : [];
  if (role !== "admin") return [];
  if (status === "draft") return ["review", "archived"];
  if (status === "review") return ["draft", "published"];
  if (status === "published") return ["draft", "archived"];
  return ["draft"];
}

export function canTransitionPracticeScenario(role: UserRole, from: ContentStatus, to: ContentStatus): boolean {
  return allowedPracticeTransitions(role, from).includes(to);
}

export function canTransitionAssignedPracticeScenario(
  actor: PracticeWorkflowActor,
  reviewerId: string | null,
  from: ContentStatus,
  to: ContentStatus,
): boolean {
  if (!canTransitionPracticeScenario(actor.role, from, to)) return false;
  if (actor.role !== "reviewer" || from !== "review") return true;
  return canActOnAssignedPracticeReview(actor.role, actor.id, reviewerId);
}

export function assessPracticeReadiness(exercises: ReadinessExercise[], options: { industryPublished?: boolean } = {}) {
  const validAnswers = exercises.every((exercise) => {
    const options = Array.isArray(exercise.options) ? exercise.options.filter((option) => typeof option === "string") : [];
    return options.length >= 2 && exercise.correctOption >= 0 && exercise.correctOption < options.length;
  });
  const items: PracticeReadinessItem[] = [
    {
      id: "industry",
      label: "Nhóm ngành đang xuất bản",
      detail: "Ca chỉ có thể xuất bản khi nhóm ngành cha đang hoạt động.",
      passed: options.industryPublished ?? true,
    },
    {
      id: "exercise_count",
      label: "Đủ lượt nghe",
      detail: "Ca cần ít nhất 2 lượt nghe để tạo một phiên có ý nghĩa.",
      passed: exercises.length >= 2,
    },
    {
      id: "transcript",
      label: "Transcript khớp audio",
      detail: "Mỗi lượt phải có bản chép tiếng Trung để reviewer đối chiếu.",
      passed: exercises.length > 0 && exercises.every((exercise) => Boolean(exercise.listeningText?.trim())),
    },
    {
      id: "audio",
      label: "Có audio phát được",
      detail: "Mỗi lượt cần file Cloudinary; URL ngoài chỉ được giữ cho dữ liệu legacy.",
      passed: exercises.length > 0 && exercises.every((exercise) => Boolean(exercise.audioAssetId || exercise.audioUrl?.trim())),
    },
    {
      id: "audio_review",
      label: "Audio đã nghe duyệt",
      detail: "Mỗi lượt phải được reviewer xác nhận phát âm, tốc độ, độ rõ và transcript.",
      passed: exercises.length > 0 && exercises.every((exercise) => exercise.audioReviewStatus === "approved"),
    },
    {
      id: "answers",
      label: "Các nghĩa tiếng Việt hợp lệ",
      detail: "Mỗi lượt cần tối thiểu 2 nghĩa để chọn và chỉ số đáp án đúng nằm trong phạm vi.",
      passed: exercises.length > 0 && validAnswers,
    },
  ];
  return { ready: items.every((item) => item.passed), passed: items.filter((item) => item.passed).length, items };
}
