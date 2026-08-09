"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Cloud, Headphones, LoaderCircle, RotateCcw, Trash2, Upload, Volume2 } from "lucide-react";
import {
  practiceAudioReviewIssueLabels,
  practiceAudioReviewStatusLabels,
  type PracticeAudioReviewIssue,
  type PracticeAudioReviewStatus,
} from "@/lib/practice-audio-review";

export type PracticeAudioAssetView = {
  id: string;
  url: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  durationMs: number | null;
  storageProvider: string;
  reviewStatus: PracticeAudioReviewStatus;
  reviewIssues: PracticeAudioReviewIssue[];
  reviewNotes: string | null;
  reviewedAt: string | null;
};

type UploadIntent = {
  uploadUrl: string;
  apiKey: string;
  parameters: Record<string, string>;
  signature: string;
};

type UploadState = "idle" | "hashing" | "uploading" | "saving" | "removing";

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(durationMs: number | null): string {
  if (!durationMs) return "Chưa đo thời lượng";
  const seconds = Math.max(1, Math.round(durationMs / 1_000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

async function sha256(file: File): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

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
    request.onerror = () => reject(new Error("Mạng bị gián đoạn khi tải audio lên Cloudinary."));
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
          : "Không thể tải audio lên Cloudinary.";
        reject(new Error(message));
        return;
      }
      onProgress(100);
      resolve(payload);
    };
    request.send(formData);
  });
}

export function PracticeAudioUploader({ exerciseId, initialAsset, cloudinaryConfigured = true }: {
  exerciseId?: string;
  initialAsset: PracticeAudioAssetView | null;
  cloudinaryConfigured?: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [asset, setAsset] = useState(initialAsset);
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");

  async function upload(file: File) {
    if (!exerciseId) return;
    if (file.size <= 0 || file.size > 8 * 1024 * 1024) {
      setMessage("Audio phải nhỏ hơn hoặc bằng 8 MB.");
      return;
    }
    setState("hashing");
    setProgress(0);
    setMessage("Đang kiểm tra file trước khi tải…");
    try {
      const checksumSha256 = await sha256(file);
      const signResponse = await fetch("/api/admin/practice-audio", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "sign", exerciseId, fileSize: file.size, checksumSha256 }),
      });
      const signPayload = await signResponse.json() as { intent?: UploadIntent; error?: string };
      if (!signResponse.ok || !signPayload.intent) throw new Error(signPayload.error || "Không thể chuẩn bị upload Cloudinary.");

      setState("uploading");
      setMessage("Đang tải trực tiếp lên Cloudinary…");
      const cloudinary = await uploadDirectlyToCloudinary(file, signPayload.intent, setProgress);
      setState("saving");
      setMessage("Đang lưu metadata và đưa audio vào hàng chờ duyệt…");
      const completeResponse = await fetch("/api/admin/practice-audio", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "complete", exerciseId, originalName: file.name, checksumSha256, cloudinary }),
      });
      const completePayload = await completeResponse.json() as { asset?: PracticeAudioAssetView; error?: string };
      if (!completeResponse.ok || !completePayload.asset) throw new Error(completePayload.error || "Không thể gắn audio vào lượt nghe.");
      setAsset(completePayload.asset);
      setMessage("Đã tải lên Cloudinary · audio đang chờ reviewer nghe duyệt.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể tải audio.");
    } finally {
      setState("idle");
      setProgress(0);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove() {
    if (!exerciseId || !asset || !window.confirm("Gỡ audio khỏi lượt nghe này? Bản Cloudinary chỉ bị xóa khi không còn phiên bản nào tham chiếu.")) return;
    setState("removing");
    setMessage("Đang gỡ audio…");
    try {
      const response = await fetch("/api/admin/practice-audio", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ exerciseId }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Không thể gỡ audio.");
      setAsset(null);
      setMessage("Đã gỡ audio khỏi lượt nghe.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể gỡ audio.");
    } finally {
      setState("idle");
    }
  }

  return <div className="practice-audio-uploader">
    <input name="audioAssetId" type="hidden" value={asset?.id ?? ""} />
    <div className="practice-audio-uploader-heading">
      <span><Headphones size={18} /> Audio thật</span>
      <small>MP3, WAV, M4A, AAC, OGG hoặc WebM · tối đa 8 MB</small>
    </div>
    {exerciseId ? <>
      <input
        accept="audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/aac,audio/ogg,audio/webm,.mp3,.wav,.m4a,.aac,.ogg,.webm"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
        ref={inputRef}
        type="file"
      />
      {asset ? <div className="practice-audio-asset">
        <span className="practice-audio-asset-icon"><Volume2 size={19} /></span>
        <span className="practice-audio-asset-copy">
          <strong>{asset.originalName}</strong>
          <small>{formatDuration(asset.durationMs)} · {formatBytes(asset.sizeBytes)} · {asset.mimeType}</small>
          <span className={`practice-audio-review-badge is-${asset.reviewStatus}`}>
            {asset.reviewStatus === "approved" ? <CheckCircle2 size={13} /> : asset.reviewStatus === "re_record" ? <RotateCcw size={13} /> : <Headphones size={13} />}
            {practiceAudioReviewStatusLabels[asset.reviewStatus]}
          </span>
        </span>
        <audio controls preload="metadata" src={asset.url}>Trình duyệt không hỗ trợ phát audio.</audio>
        <div className="practice-audio-asset-actions">
          <span className="practice-audio-cloudinary"><Cloud size={14} /> {asset.storageProvider === "cloudinary" ? "Cloudinary CDN" : "Kho cũ"}</span>
          <button disabled={state !== "idle" || !cloudinaryConfigured} onClick={() => inputRef.current?.click()} type="button"><Upload size={15} /> Thay file</button>
          <button className="danger" disabled={state !== "idle"} onClick={() => void remove()} type="button"><Trash2 size={15} /> Gỡ</button>
        </div>
        {!cloudinaryConfigured ? <small className="practice-audio-cloudinary-note">Thêm CLOUDINARY_URL vào .env.local để chuyển hoặc thay audio qua CDN.</small> : null}
        {asset.reviewStatus === "re_record" ? <div className="practice-audio-review-feedback">
          <strong>Reviewer yêu cầu thu lại</strong>
          {asset.reviewIssues.length ? <p>{asset.reviewIssues.map((issue) => practiceAudioReviewIssueLabels[issue]).join(" · ")}</p> : null}
          {asset.reviewNotes ? <small>{asset.reviewNotes}</small> : null}
        </div> : null}
      </div> : <button className="practice-audio-upload-button" disabled={state !== "idle" || !cloudinaryConfigured} onClick={() => inputRef.current?.click()} type="button">
        {state !== "idle" ? <LoaderCircle className="spin" size={18} /> : <Upload size={18} />}
        <span><strong>{!cloudinaryConfigured ? "Cần cấu hình Cloudinary" : state === "idle" ? "Chọn audio cho lượt nghe" : state === "hashing" ? "Đang kiểm tra file…" : state === "uploading" ? `Đang tải lên Cloudinary ${progress}%` : "Đang hoàn tất…"}</strong><small>{cloudinaryConfigured ? "File đi thẳng lên CDN; database chỉ lưu metadata" : "Thêm CLOUDINARY_URL vào .env.local để bật upload"}</small></span>
      </button>}
      {state === "uploading" ? <div className="practice-audio-upload-progress" aria-label={`Đã tải ${progress}%`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{ width: `${progress}%` }} /></div> : null}
    </> : <p className="practice-audio-create-note">Tạo lượt nghe trước, sau đó mở lại ca để tải audio lên Cloudinary.</p>}
    {message ? <p className="practice-audio-upload-status" role="status">{state !== "idle" ? <LoaderCircle className="spin" size={14} /> : null}{message}</p> : null}
  </div>;
}
