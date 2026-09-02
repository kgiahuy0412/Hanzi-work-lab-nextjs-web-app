import { NextResponse } from "next/server";
import { updateUserAvatar } from "@/lib/account-profile-service";
import { recordAuthEvent } from "@/lib/auth-audit";
import { getCurrentUser } from "@/lib/auth-session";
import { isValidAvatarUploadMetadata } from "@/lib/avatar-validation";
import {
  createAvatarUploadIntent,
  deleteCloudinaryAvatar,
  isCloudinaryAvatarConfigured,
  verifyAvatarUploadResponse,
} from "@/lib/cloudinary-avatar";
import { isSameOriginRequest } from "@/lib/request-security";

function recordOf(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Bạn cần đăng nhập để đổi ảnh đại diện." }, { status: 401 });

  let body: Record<string, unknown> | null;
  try {
    body = recordOf(await request.json());
  } catch {
    body = null;
  }
  if (!body) return NextResponse.json({ error: "Dữ liệu upload không hợp lệ." }, { status: 400 });

  const action = typeof body.action === "string" ? body.action : "";
  if (action === "sign") {
    if (!isCloudinaryAvatarConfigured()) {
      return NextResponse.json({ error: "Cloudinary chưa được cấu hình trên server." }, { status: 503 });
    }
    const fileSize = typeof body.fileSize === "number" ? body.fileSize : Number(body.fileSize);
    const mimeType = typeof body.mimeType === "string" ? body.mimeType : "";
    if (!isValidAvatarUploadMetadata(fileSize, mimeType)) {
      return NextResponse.json({ error: "Chọn ảnh JPG, PNG hoặc WebP có dung lượng tối đa 5 MB." }, { status: 413 });
    }
    return NextResponse.json({ intent: createAvatarUploadIntent(user.id) });
  }

  if (action === "complete") {
    const avatar = verifyAvatarUploadResponse(body.cloudinary, user.id);
    if (!avatar) {
      return NextResponse.json({ error: "Không xác minh được ảnh đã tải lên Cloudinary." }, { status: 400 });
    }

    let updated: Awaited<ReturnType<typeof updateUserAvatar>>;
    try {
      updated = await updateUserAvatar(user.id, { publicId: avatar.publicId, secureUrl: avatar.secureUrl });
    } catch {
      await deleteCloudinaryAvatar(avatar.publicId).catch(() => undefined);
      return NextResponse.json({ error: "Không thể lưu ảnh đại diện vào tài khoản." }, { status: 500 });
    }

    if (!updated) {
      await deleteCloudinaryAvatar(avatar.publicId).catch(() => undefined);
      return NextResponse.json({ error: "Không tìm thấy tài khoản đang hoạt động." }, { status: 404 });
    }

    await Promise.all([
      recordAuthEvent({ action: "auth.avatar.updated", request, userId: user.id }),
      updated.previousPublicId && updated.previousPublicId !== avatar.publicId
        ? deleteCloudinaryAvatar(updated.previousPublicId).catch(() => undefined)
        : Promise.resolve(),
    ]);

    return NextResponse.json({ avatarUrl: updated.avatarUrl });
  }

  return NextResponse.json({ error: "Thao tác upload không hợp lệ." }, { status: 400 });
}

