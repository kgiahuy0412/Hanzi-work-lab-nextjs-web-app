import enrichmentData from "../content/hsk4-lower-textbook-json/shared/learning-enrichment.json" with { type: "json" };
import lexemeData from "../content/hsk4-lower-textbook-json/shared/lexemes.json" with { type: "json" };
import textData from "../content/hsk4-lower-textbook-json/shared/texts.json" with { type: "json" };
import lesson11 from "../content/hsk4-lower-textbook-json/lessons/lesson-11.json" with { type: "json" };
import lesson12 from "../content/hsk4-lower-textbook-json/lessons/lesson-12.json" with { type: "json" };
import lesson13 from "../content/hsk4-lower-textbook-json/lessons/lesson-13.json" with { type: "json" };
import lesson14 from "../content/hsk4-lower-textbook-json/lessons/lesson-14.json" with { type: "json" };
import lesson15 from "../content/hsk4-lower-textbook-json/lessons/lesson-15.json" with { type: "json" };
import lesson16 from "../content/hsk4-lower-textbook-json/lessons/lesson-16.json" with { type: "json" };
import lesson17 from "../content/hsk4-lower-textbook-json/lessons/lesson-17.json" with { type: "json" };
import lesson18 from "../content/hsk4-lower-textbook-json/lessons/lesson-18.json" with { type: "json" };
import lesson19 from "../content/hsk4-lower-textbook-json/lessons/lesson-19.json" with { type: "json" };
import lesson20 from "../content/hsk4-lower-textbook-json/lessons/lesson-20.json" with { type: "json" };
import {
  buildHskWritingCharacters,
  type HskDialogue,
  type HskExercise,
  type HskGrammarPoint,
  type HskLessonContent,
  type HskVocabularyItem,
} from "./hsk-lesson-content.ts";

type RawLesson = {
  id: string;
  lessonNumber: number;
  status: HskLessonContent["contentStatus"];
  title: { zh: string; pinyin: string; vi: string };
  sections: Array<{ type: string; contentRefs?: string[] }>;
};

type RawLexeme = {
  id: string;
  lessonRef: string;
  hanzi: string;
  pinyin: string;
  sourceTextOcrRaw?: string;
};

type RawText = {
  id: string;
  lessonRef: string;
  textNumber: number;
  textType: "dialogue" | "short-passage";
  title: { zh: string | null; pinyin: string | null };
  lines: Array<{ speaker: string | null; textZh: string }>;
};

type EnrichedGrammar = {
  lessonRef: string;
  titleZh: string;
  titleVi: string;
  formula: string;
  explanationVi: string;
  examples: Array<{ hanzi: string; pinyin: string; translationVi: string }>;
};

type Enrichment = {
  status: string;
  lexemeMeanings: Record<string, string>;
  textTitles: Record<string, { translationVi: string; pinyin: string }>;
  textLines: Record<string, Array<{ translationVi: string; pinyin: string }>>;
  grammarPoints: Record<string, EnrichedGrammar>;
};

const RAW_LESSONS = [
  lesson11,
  lesson12,
  lesson13,
  lesson14,
  lesson15,
  lesson16,
  lesson17,
  lesson18,
  lesson19,
  lesson20,
] as unknown as RawLesson[];

const RAW_LEXEMES = (lexemeData as unknown as { lexemes: RawLexeme[] }).lexemes;
const RAW_TEXTS = (textData as unknown as { texts: RawText[] }).texts;
const ENRICHMENT = enrichmentData as unknown as Enrichment;
const LEXEMES = new Map(RAW_LEXEMES.map((item) => [item.id, item]));
const TEXTS = new Map(RAW_TEXTS.map((item) => [item.id, item]));

const WORD_CLASS_LABELS: Array<[RegExp, string]> = [
  [/dgt|động|dong/iu, "Động từ"],
  [/\bdt\b|danh/iu, "Danh từ"],
  [/\btt\b|tính|tinh/iu, "Tính từ"],
  [/ph[oó]|副/iu, "Phó từ"],
  [/tr[oợ]|助/iu, "Trợ từ"],
  [/gi[oớ]i|介/iu, "Giới từ"],
  [/li[eê]n|连/iu, "Liên từ"],
  [/l[uư][oợ]ng|量/iu, "Lượng từ"],
  [/đ[aạ]i|dai|代/iu, "Đại từ"],
  [/s[oố]|so\.?/iu, "Số từ"],
];

function requireEntity<T>(entities: Map<string, T>, id: string, owner: string): T {
  const entity = entities.get(id);
  if (!entity) throw new Error(`${owner} tham chiếu dữ liệu HSK4 không tồn tại: ${id}`);
  return entity;
}

function sectionRefs(lesson: RawLesson, type: string): string[] {
  return lesson.sections.find((section) => section.type === type)?.contentRefs ?? [];
}

function wordClass(raw: string | undefined): string {
  if (!raw) return "Từ vựng HSK 4";
  return WORD_CLASS_LABELS.find(([pattern]) => pattern.test(raw))?.[1] ?? "Từ vựng HSK 4";
}

function matchesLexeme(text: string, lexeme: string): boolean {
  const parts = lexeme.split(/[…\.]+/u).filter(Boolean);
  let cursor = 0;
  return parts.every((part) => {
    const index = text.indexOf(part, cursor);
    if (index < 0) return false;
    cursor = index + part.length;
    return true;
  });
}

function textLine(text: RawText, index: number) {
  return ENRICHMENT.textLines[text.id]?.[index];
}

function vocabularyExample(lexeme: RawLexeme, texts: RawText[]) {
  for (const text of texts) {
    const index = text.lines.findIndex((line) => matchesLexeme(line.textZh, lexeme.hanzi));
    if (index >= 0) {
      const line = text.lines[index];
      const enriched = textLine(text, index);
      return {
        example: line.textZh,
        examplePinyin: enriched?.pinyin ?? "",
        translation: enriched?.translationVi ?? "",
      };
    }
  }
  return {
    example: lexeme.hanzi,
    examplePinyin: lexeme.pinyin,
    translation: ENRICHMENT.lexemeMeanings[lexeme.id] ?? "Nghĩa đang được biên tập.",
  };
}

function toVocabulary(lexeme: RawLexeme, texts: RawText[]): HskVocabularyItem {
  return {
    id: lexeme.id,
    hanzi: lexeme.hanzi,
    pinyin: lexeme.pinyin,
    meaning: ENRICHMENT.lexemeMeanings[lexeme.id] ?? "Nghĩa đang được biên tập.",
    wordClass: wordClass(lexeme.sourceTextOcrRaw),
    ...vocabularyExample(lexeme, texts),
  };
}

function toDialogue(text: RawText, lessonNumber: number): HskDialogue {
  const title = ENRICHMENT.textTitles[text.id]?.translationVi
    || (text.textType === "short-passage" ? `Bài đọc ${text.textNumber}` : `Hội thoại ${text.textNumber}`);
  return {
    id: text.id,
    title,
    setting: text.textType === "short-passage"
      ? `Đoạn đọc ${text.textNumber} trong Bài ${lessonNumber}.`
      : `Tình huống giao tiếp ${text.textNumber} trong Bài ${lessonNumber}.`,
    turns: text.lines.map((line, index) => {
      const enriched = textLine(text, index);
      return {
        speaker: line.speaker ?? "Bài khóa",
        hanzi: line.textZh,
        pinyin: enriched?.pinyin ?? "",
        translation: enriched?.translationVi ?? "Bản dịch đang được biên tập.",
      };
    }),
  };
}

function grammarForLesson(lessonId: string): HskGrammarPoint[] {
  return Object.entries(ENRICHMENT.grammarPoints)
    .filter(([, point]) => point.lessonRef === lessonId)
    .map(([id, point]) => ({
      id,
      title: `${point.titleZh} · ${point.titleVi}`,
      formula: point.formula,
      explanation: point.explanationVi,
      examples: point.examples.map((example) => ({
        hanzi: example.hanzi,
        pinyin: example.pinyin,
        translation: example.translationVi,
      })),
    }));
}

function uniqueOptions(
  vocabulary: HskVocabularyItem[],
  targetIndex: number,
  select: (word: HskVocabularyItem) => string,
): string[] {
  const target = select(vocabulary[targetIndex]);
  const candidates = [target];
  for (let offset = 1; offset < vocabulary.length && candidates.length < 4; offset += 1) {
    const candidate = select(vocabulary[(targetIndex + offset) % vocabulary.length]);
    if (candidate && !candidates.includes(candidate)) candidates.push(candidate);
  }
  const rotation = targetIndex % candidates.length;
  return [...candidates.slice(rotation), ...candidates.slice(0, rotation)];
}

function buildExercises(vocabulary: HskVocabularyItem[]): HskExercise[] {
  return vocabulary.slice(0, Math.min(4, vocabulary.length)).map((word, index) => {
    const meaningQuestion = index % 2 === 0;
    const select = meaningQuestion
      ? (item: HskVocabularyItem) => item.meaning
      : (item: HskVocabularyItem) => item.pinyin;
    return {
      id: `${word.id}-${meaningQuestion ? "meaning" : "pinyin"}`,
      type: meaningQuestion ? "meaning" : "pinyin",
      instruction: meaningQuestion ? "Chọn nghĩa đúng của từ" : "Chọn pinyin đúng của từ",
      prompt: word.hanzi,
      options: uniqueOptions(vocabulary, index, select),
      answer: select(word),
    };
  });
}

function truncate(value: string, maxLength = 96): string {
  return value.length > maxLength ? `${value.slice(0, maxLength).trim()}…` : value;
}

function pronunciationTopics(texts: RawText[], vocabulary: HskVocabularyItem[]): string[] {
  const topics = texts.slice(0, 5).map((text) => {
    const titlePinyin = ENRICHMENT.textTitles[text.id]?.pinyin;
    const firstLinePinyin = textLine(text, 0)?.pinyin;
    return `Bài khóa ${text.textNumber}: ${truncate(titlePinyin || firstLinePinyin || "luyện đọc theo câu mẫu")}`;
  });
  topics.push(`Từ mới trọng tâm: ${vocabulary.slice(0, 6).map((word) => word.pinyin).join(" · ")}`);
  return topics;
}

function composeLesson(raw: RawLesson): HskLessonContent {
  const rawTexts = sectionRefs(raw, "texts")
    .map((ref) => requireEntity(TEXTS, ref, raw.id))
    .filter((text) => text.lines.length > 0);
  const vocabulary = sectionRefs(raw, "vocabulary")
    .map((ref) => toVocabulary(requireEntity(LEXEMES, ref, raw.id), rawTexts));
  const grammar = grammarForLesson(raw.id);
  const dialogues = rawTexts.map((text) => toDialogue(text, raw.lessonNumber));
  const exercises = buildExercises(vocabulary);
  const writing = buildHskWritingCharacters(vocabulary);

  return {
    id: raw.id,
    sourceId: raw.id,
    levelId: "hsk-4",
    levelLabel: "HSK 4",
    lessonNumber: raw.lessonNumber,
    title: raw.title.vi,
    greeting: raw.title.zh,
    summary: `Học ${vocabulary.length} từ mới, ${dialogues.length} bài khóa và ${grammar.length} điểm ngữ pháp từ Giáo trình chuẩn HSK 4 - Tập 2.`,
    minutes: Math.max(35, Math.min(45, 25 + Math.ceil(vocabulary.length / 3))),
    modes: ["vocabulary", "exercise", "pronunciation", "hanzi"],
    vocabulary,
    grammar,
    dialogues,
    pronunciationTopics: pronunciationTopics(rawTexts, vocabulary),
    exercises,
    writingCharacters: writing,
    contentStatus: raw.status,
    languageReviewStatus: "pending",
    audioAvailable: false,
  };
}

export const HSK4_TEXTBOOK_LESSONS = RAW_LESSONS.map(composeLesson);

const HSK4_LESSONS_BY_ID = new Map(
  HSK4_TEXTBOOK_LESSONS.map((lesson) => [lesson.id, lesson]),
);

export function getHsk4TextbookLessonContent(
  levelId: string,
  lessonId: string,
): HskLessonContent | undefined {
  if (levelId !== "hsk-4") return undefined;
  return HSK4_LESSONS_BY_ID.get(lessonId);
}
