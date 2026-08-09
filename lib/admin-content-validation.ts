import type { DialogueLine, LessonContent, UsageNote } from "./content-types.ts";

export const contentStatuses = ["draft", "review", "published", "archived"] as const;
export type ContentStatus = typeof contentStatuses[number];

export function valueString(formData: FormData, name: string, maxLength = 10_000): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.slice(0, maxLength + 1).trim() : "";
}

export function valueInteger(formData: FormData, name: string, fallback = 0, minimum = 0, maximum = 100_000): number {
  const value = Number(valueString(formData, name, 20));
  return Number.isSafeInteger(value) && value >= minimum && value <= maximum ? value : fallback;
}

export function normalizeSlug(value: string, fallback: string): string {
  const source = value.trim() || fallback.trim();
  return source.normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .replace(/đ/gu, "d")
    .replace(/Đ/gu, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .slice(0, 160);
}

export function parseContentStatus(value: string): ContentStatus {
  return contentStatuses.includes(value as ContentStatus) ? value as ContentStatus : "draft";
}

export function parseBoolean(formData: FormData, name: string): boolean {
  return formData.get(name) === "on" || formData.get(name) === "true";
}

export function parseTags(value: string): string[] {
  return [...new Set(value.split(",").map((tag) => tag.trim()).filter(Boolean))].slice(0, 20);
}

export function parseStringLines(value: string, maximum = 12): string[] | null {
  const lines = value.split(/\r?\n/u).map((line) => line.trim()).filter(Boolean);
  if (lines.length > maximum || lines.some((line) => line.length > 2_000)) return null;
  return lines;
}

export function serializeStringList(value: unknown, separator = "\n"): string {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").join(separator)
    : "";
}

function parseRows<T>(value: string, columns: number, toRow: (parts: string[]) => T): T[] | null {
  if (!value.trim()) return [];
  const lines = value.split(/\r?\n/u).map((line) => line.trim()).filter(Boolean);
  if (lines.length > 40) return null;
  const rows: T[] = [];
  for (const line of lines) {
    const parts = line.split("|").map((part) => part.trim());
    if (parts.length !== columns || parts.some((part) => !part || part.length > 1_500)) return null;
    rows.push(toRow(parts));
  }
  return rows;
}

export function parseLessonContent(dialogueValue: string, notesValue: string): LessonContent | null {
  const dialogue = parseRows<DialogueLine>(dialogueValue, 4, ([speaker, hanzi, pinyin, translation]) => ({ speaker, hanzi, pinyin, translation }));
  const notes = parseRows<UsageNote>(notesValue, 3, ([title, pattern, explanation]) => ({ title, pattern, explanation }));
  return dialogue && notes ? { dialogue, notes } : null;
}

export function serializeDialogue(content: unknown): string {
  const dialogue = validLessonContent(content).dialogue;
  return dialogue.map((line) => `${line.speaker} | ${line.hanzi} | ${line.pinyin} | ${line.translation}`).join("\n");
}

export function serializeNotes(content: unknown): string {
  const notes = validLessonContent(content).notes;
  return notes.map((note) => `${note.title} | ${note.pattern} | ${note.explanation}`).join("\n");
}

export function validLessonContent(content: unknown): LessonContent {
  if (!content || typeof content !== "object") return { dialogue: [], notes: [] };
  const raw = content as { dialogue?: unknown; notes?: unknown };
  const dialogue = Array.isArray(raw.dialogue) ? raw.dialogue.filter((line): line is DialogueLine => {
    if (!line || typeof line !== "object") return false;
    const item = line as Record<string, unknown>;
    return [item.speaker, item.hanzi, item.pinyin, item.translation].every((value) => typeof value === "string");
  }) : [];
  const notes = Array.isArray(raw.notes) ? raw.notes.filter((note): note is UsageNote => {
    if (!note || typeof note !== "object") return false;
    const item = note as Record<string, unknown>;
    return [item.title, item.pattern, item.explanation].every((value) => typeof value === "string");
  }) : [];
  return { dialogue, notes };
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value);
}
