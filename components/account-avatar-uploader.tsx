"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LoaderCircle, PenLine } from "lucide-react";
import { AVATAR_ACCEPT, isValidAvatarUploadMetadata } from "@/lib/avatar-validation";

type UploadIntent = {
  uploadUrl: string;
  apiKey: string;
  parameters: Record<string, string>;
  signature: string;
};

type UploadState = "idle" | "signing" | "uploading" | "saving";

function uploadDirectlyToCloudinary(file: File, intent: UploadIntent, onProgress: (percent: number) => void): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.set("file", file);
    formData.set("api_key", intent.apiKey);
    formData.set("signature", intent.signature);
    for (const [key, value] of Object.entries(intent.parameters)) formData.set(key, value);

    const request = new XMLHttpRequest();
    request.open("POST", intent.uploadUrl);
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)));
    };
    request.onerror = () => reject(new Error("Mạng bị gián đoạn khi tải ảnh lên Cloudinary."));
    request.onload = () => {
      let payload: unknown;
      try {
        payload = JSON.parse(request.responseText) as unknown;
      } catch {
        reject(new Error("Cloudinary trả về dữ liệu không hợp lệ."));
        return;
      }
      if (request.status < 200 || request.status >= 300) {
        const message = typeof payload === "object" && payload !== null
          && typeof (payload as { error?: { message?: unknown } }).error?.message === "string"
          ? (payload as { error: { message: string } }).error.message
          : "Không thể tải ảnh lên Cloudinary.";
        reject(new Error(message));
        return;
      }
      onProgress(100);
      resolve(payload);
    };
    request.send(formData);
  });
}

export function AccountAvatarUploader({ avatarUrl, displayName, initials }: {
  avatarUrl: string | null;
  displayName: string;
  initials: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(avatarUrl);
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [hasError, setHasError] = useState(false);

  async function upload(file: File) {
    if (!isValidAvatarUploadMetadata(file.size, file.type)) {
      setHasError(true);
      setMessage("Chọn ảnh JPG, PNG hoặc WebP tối đa 5 MB.");
      return;
    }

    setState("signing");
    setProgress(0);
    setHasError(false);
    setMessage("Đang chuẩn bị tải ảnh…");

    try {
      const signResponse = await fetch("/api/account/avatar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "sign", fileSize: file.size, mimeType: file.type }),
      });
      const signPayload = await signResponse.json() as { intent?: UploadIntent; error?: string };
      if (!signResponse.ok || !signPayload.intent) {
        throw new Error(signPayload.error || "Không thể chuẩn bị upload Cloudinary.");
      }

      setState("uploading");
      setMessage("Đang tải ảnh lên Cloudinary…");
      const cloudinary = await uploadDirectlyToCloudinary(file, signPayload.intent, setProgress);

      setState("saving");
      setMessage("Đang lưu ảnh đại diện…");
      const completeResponse = await fetch("/api/account/avatar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "complete", cloudinary }),
      });
      const completePayload = await completeResponse.json() as { avatarUrl?: string; error?: string };
      if (!completeResponse.ok || !completePayload.avatarUrl) {
        throw new Error(completePayload.error || "Không thể lưu ảnh đại diện.");
      }

      setCurrentAvatarUrl(completePayload.avatarUrl);
      setMessage("Đã cập nhật ảnh đại diện.");
      window.dispatchEvent(new CustomEvent("himi:avatar-updated", {
        detail: { avatarUrl: completePayload.avatarUrl },
      }));
      router.refresh();
    } catch (error) {
      setHasError(true);
      setMessage(error instanceof Error ? error.message : "Không thể cập nhật ảnh đại diện.");
    } finally {
      setState("idle");
      setProgress(0);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const busy = state !== "idle";
  const status = state === "uploading" ? `Đang tải ${progress}%` : message;

  return <div aria-busy={busy} className="account-avatar-uploader">
    <div className={`account-profile-avatar ${currentAvatarUrl ? "has-image" : ""}`.trim()}>
      {currentAvatarUrl
        ? <span className="account-profile-avatar-media">
            <Image
              alt={`Ảnh đại diện của ${displayName}`}
              className="account-profile-avatar-image"
              fill
              onError={() => setCurrentAvatarUrl(null)}
              sizes="(max-width: 420px) 74px, (max-width: 720px) 92px, (max-width: 920px) 132px, 156px"
              src={currentAvatarUrl}
              unoptimized
            />
          </span>
        : <span aria-hidden="true" className="account-profile-avatar-initials">{initials}</span>}
      <button
        aria-label={busy ? status : "Chọn ảnh đại diện mới"}
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        title="Đổi ảnh đại diện"
        type="button"
      >
        {busy ? <LoaderCircle className="spin" size={22} /> : <PenLine size={21} strokeWidth={2.4} />}
      </button>
    </div>
    <input
      accept={AVATAR_ACCEPT}
      hidden
      onChange={(event) => {
        const file = event.target.files?.[0];
        if (file) void upload(file);
      }}
      ref={inputRef}
      type="file"
    />
    {status ? <p className={`account-avatar-status ${hasError ? "is-error" : ""}`.trim()} role={hasError ? "alert" : "status"}>{status}</p> : null}
  </div>;
}
