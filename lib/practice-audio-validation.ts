export const MAX_PRACTICE_AUDIO_BYTES = 8 * 1024 * 1024;
export const MAX_PRACTICE_AUDIO_DURATION_MS = 5 * 60 * 1_000;

function ascii(bytes: Uint8Array, start: number, length: number): string {
  return String.fromCharCode(...bytes.subarray(start, start + length));
}

export function detectPracticeAudioMime(bytes: Uint8Array): string | null {
  if (bytes.length < 4) return null;
  if (ascii(bytes, 0, 4) === "RIFF" && bytes.length >= 12 && ascii(bytes, 8, 4) === "WAVE") return "audio/wav";
  if (ascii(bytes, 0, 4) === "OggS") return "audio/ogg";
  if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) return "audio/webm";
  if (bytes.length >= 12 && ascii(bytes, 4, 4) === "ftyp") return "audio/mp4";
  if (ascii(bytes, 0, 3) === "ID3") return "audio/mpeg";
  if (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) {
    // MPEG audio reserves layer bits 00; ADTS AAC uses that reserved value.
    return (bytes[1] & 0x06) === 0 ? "audio/aac" : "audio/mpeg";
  }
  return null;
}

export function safeAudioOriginalName(value: string): string {
  const cleaned = value.replace(/[\u0000-\u001f\u007f]/gu, "").replace(/[\\/]+/gu, "-").trim();
  return (cleaned || "practice-audio").slice(0, 255);
}

export function parseAudioDurationMs(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= MAX_PRACTICE_AUDIO_DURATION_MS ? parsed : null;
}
