import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-session";
import {
  attachPracticeExerciseAudio,
  getPracticeExerciseAudioUploadPermission,
  removePracticeExerciseAudio,
} from "@/lib/admin-practice-service";
import { isUuid } from "@/lib/admin-content-validation";
import {
  createPracticeAudioUploadIntent,
  deleteCloudinaryPracticeAudio,
  isCloudinaryPracticeAudioConfigured,
  verifyPracticeAudioUploadResponse,
} from "@/lib/cloudinary-practice-audio";
import { MAX_PRACTICE_AUDIO_BYTES, safeAudioOriginalName } from "@/lib/practice-audio-validation";
import { isSameOriginRequest } from "@/lib/request-security";
import { canAuthorPractice, isPracticeStaffRole } from "@/lib/practice-workflow";

function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

function recordOf(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

async function currentAuthor() {
  const user = await getCurrentUser();
  return user && isPracticeStaffRole(user.role) && canAuthorPractice(user.role) ? { id: user.id, role: user.role } : null;
}

function uploadError(error: "not_found" | "workflow_forbidden") {
  return NextResponse.json({
    error: error === "workflow_forbidden"
      ? "Ca đang chờ duyệt hoặc đã xuất bản nên không thể thay audio."
      : "Không tìm thấy lượt nghe.",
  }, { status: error === "workflow_forbidden" ? 409 : 404 });
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return forbidden();
  const author = await currentAuthor();
  if (!author) return forbidden();

  let body: Record<string, unknown> | null;
  try {
    body = recordOf(await request.json());
  } catch {
    body = null;
  }
  if (!body) return NextResponse.json({ error: "Dữ liệu upload không hợp lệ." }, { status: 400 });
  const action = typeof body.action === "string" ? body.action : "";
  const exerciseId = typeof body.exerciseId === "string" ? body.exerciseId : "";
  if (!isUuid(exerciseId)) return NextResponse.json({ error: "Lượt nghe không hợp lệ." }, { status: 400 });

  if (action === "sign") {
    if (!isCloudinaryPracticeAudioConfigured()) {
      return NextResponse.json({ error: "Cloudinary chưa được cấu hình trên server." }, { status: 503 });
    }
    const fileSize = typeof body.fileSize === "number" ? body.fileSize : Number(body.fileSize);
    const checksumSha256 = typeof body.checksumSha256 === "string" ? body.checksumSha256 : "";
    if (!Number.isInteger(fileSize) || fileSize <= 0 || fileSize > MAX_PRACTICE_AUDIO_BYTES || !/^[a-f0-9]{64}$/u.test(checksumSha256)) {
      return NextResponse.json({ error: "Audio phải hợp lệ và nhỏ hơn hoặc bằng 8 MB." }, { status: 413 });
    }
    const permission = await getPracticeExerciseAudioUploadPermission(exerciseId, author);
    if (!permission.ok) return uploadError(permission.error);
    return NextResponse.json({ intent: createPracticeAudioUploadIntent(exerciseId) });
  }

  if (action === "complete") {
    const checksumSha256 = typeof body.checksumSha256 === "string" ? body.checksumSha256 : "";
    const originalName = typeof body.originalName === "string" ? safeAudioOriginalName(body.originalName) : "practice-audio";
    if (!/^[a-f0-9]{64}$/u.test(checksumSha256)) {
      return NextResponse.json({ error: "Checksum audio không hợp lệ." }, { status: 400 });
    }
    const cloudinaryAudio = verifyPracticeAudioUploadResponse(body.cloudinary, exerciseId);
    if (!cloudinaryAudio) {
      return NextResponse.json({ error: "Không xác minh được phản hồi upload từ Cloudinary." }, { status: 400 });
    }
    const result = await attachPracticeExerciseAudio({
      exerciseId,
      originalName,
      checksumSha256,
      cloudinary: cloudinaryAudio,
    }, author);
    if (!result.ok) {
      await deleteCloudinaryPracticeAudio(cloudinaryAudio.publicId).catch(() => undefined);
      return uploadError(result.error);
    }
    return NextResponse.json({ asset: result.asset }, { status: 201 });
  }

  return NextResponse.json({ error: "Thao tác upload không hợp lệ." }, { status: 400 });
}

export async function DELETE(request: Request) {
  if (!isSameOriginRequest(request)) return forbidden();
  const author = await currentAuthor();
  if (!author) return forbidden();
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
  }
  const exerciseId = recordOf(body)?.exerciseId;
  if (typeof exerciseId !== "string" || !isUuid(exerciseId)) {
    return NextResponse.json({ error: "Lượt nghe không hợp lệ." }, { status: 400 });
  }
  const result = await removePracticeExerciseAudio(exerciseId, author);
  if (!result.ok) return uploadError(result.error);
  return NextResponse.json({ removed: true });
}

