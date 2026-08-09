import { getCurrentUser } from "@/lib/auth-session";
import { isUuid } from "@/lib/admin-content-validation";
import { getPracticeAudioPayload } from "@/lib/practice-audio-repository";

function parseRange(value: string | null, total: number): { start: number; end: number } | null {
  if (!value) return null;
  const match = /^bytes=(\d*)-(\d*)$/u.exec(value.trim());
  if (!match || (!match[1] && !match[2])) return null;
  if (!match[1]) {
    const suffixLength = Number(match[2]);
    if (!Number.isInteger(suffixLength) || suffixLength <= 0) return null;
    return { start: Math.max(0, total - suffixLength), end: total - 1 };
  }
  const start = Number(match[1]);
  const requestedEnd = match[2] ? Number(match[2]) : total - 1;
  if (!Number.isInteger(start) || !Number.isInteger(requestedEnd) || start < 0 || start >= total || requestedEnd < start) return null;
  return { start, end: Math.min(requestedEnd, total - 1) };
}

export async function GET(request: Request, { params }: { params: Promise<{ assetId: string }> }) {
  const [{ assetId }, user] = await Promise.all([params, getCurrentUser()]);
  if (!isUuid(assetId)) return new Response("Not found", { status: 404 });
  const asset = await getPracticeAudioPayload(assetId, user);
  if (!asset) return new Response("Not found", { status: 404 });

  if (asset.cloudinarySecureUrl) {
    return new Response(null, {
      status: 307,
      headers: {
        "Cache-Control": asset.publicCache ? "public, max-age=3600" : "private, no-store",
        Location: asset.cloudinarySecureUrl,
        "X-Content-Type-Options": "nosniff",
      },
    });
  }
  if (!asset.content) return new Response("Not found", { status: 404 });

  const rangeHeader = request.headers.get("range");
  const range = parseRange(rangeHeader, asset.content.byteLength);
  if (rangeHeader && !range) {
    return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${asset.content.byteLength}` } });
  }
  const body = range ? asset.content.subarray(range.start, range.end + 1) : asset.content;
  const responseBytes = new Uint8Array(body.byteLength);
  responseBytes.set(body);
  const headers = new Headers({
    "Accept-Ranges": "bytes",
    "Cache-Control": asset.publicCache ? "public, max-age=86400, immutable" : "private, max-age=3600",
    "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(asset.originalName)}`,
    "Content-Length": String(body.byteLength),
    "Content-Type": asset.mimeType,
    "X-Content-Type-Options": "nosniff",
  });
  if (range) headers.set("Content-Range", `bytes ${range.start}-${range.end}/${asset.content.byteLength}`);
  return new Response(responseBytes.buffer, { status: range ? 206 : 200, headers });
}
