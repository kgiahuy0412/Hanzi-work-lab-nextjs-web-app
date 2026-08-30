import grammarData from "../content/hsk3-textbook-json/shared/grammar-blocks.json" with { type: "json" };
import enrichmentData from "../content/hsk3-textbook-json/shared/learning-enrichment.json" with { type: "json" };
import lexemeData from "../content/hsk3-textbook-json/shared/lexemes.json" with { type: "json" };
import sceneData from "../content/hsk3-textbook-json/shared/text-scenes.json" with { type: "json" };
import lesson01 from "../content/hsk3-textbook-json/lessons/lesson-01.json" with { type: "json" };
import lesson02 from "../content/hsk3-textbook-json/lessons/lesson-02.json" with { type: "json" };
import lesson03 from "../content/hsk3-textbook-json/lessons/lesson-03.json" with { type: "json" };
import lesson04 from "../content/hsk3-textbook-json/lessons/lesson-04.json" with { type: "json" };
import lesson05 from "../content/hsk3-textbook-json/lessons/lesson-05.json" with { type: "json" };
import lesson06 from "../content/hsk3-textbook-json/lessons/lesson-06.json" with { type: "json" };
import lesson07 from "../content/hsk3-textbook-json/lessons/lesson-07.json" with { type: "json" };
import lesson08 from "../content/hsk3-textbook-json/lessons/lesson-08.json" with { type: "json" };
import lesson09 from "../content/hsk3-textbook-json/lessons/lesson-09.json" with { type: "json" };
import lesson10 from "../content/hsk3-textbook-json/lessons/lesson-10.json" with { type: "json" };
import lesson11 from "../content/hsk3-textbook-json/lessons/lesson-11.json" with { type: "json" };
import lesson12 from "../content/hsk3-textbook-json/lessons/lesson-12.json" with { type: "json" };
import lesson13 from "../content/hsk3-textbook-json/lessons/lesson-13.json" with { type: "json" };
import lesson14 from "../content/hsk3-textbook-json/lessons/lesson-14.json" with { type: "json" };
import lesson15 from "../content/hsk3-textbook-json/lessons/lesson-15.json" with { type: "json" };
import lesson16 from "../content/hsk3-textbook-json/lessons/lesson-16.json" with { type: "json" };
import lesson17 from "../content/hsk3-textbook-json/lessons/lesson-17.json" with { type: "json" };
import lesson18 from "../content/hsk3-textbook-json/lessons/lesson-18.json" with { type: "json" };
import lesson19 from "../content/hsk3-textbook-json/lessons/lesson-19.json" with { type: "json" };
import lesson20 from "../content/hsk3-textbook-json/lessons/lesson-20.json" with { type: "json" };
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
  source: { missingPrintedPages?: number[] };
};

type RawLexeme = {
  id: string;
  lessonRef: string;
  hanzi: string;
  pinyin: string;
  partOfSpeechOcrRaw: string | null;
};

type RawScene = {
  id: string;
  lessonRef: string;
  sceneNumber: number;
  title: { zh: string | null; pinyin: string | null; viOcrRaw: string | null };
  lines: Array<{ speaker: string | null; textZh: string }>;
};

type RawGrammarBlock = {
  id: string;
  lessonRef: string;
};

type Enrichment = {
  status: string;
  lexemeMeanings: Record<string, string>;
  sceneTitles: Record<string, { translationVi: string; pinyin: string }>;
  sceneLines: Record<string, Array<{ translationVi: string; pinyin: string }>>;
  grammarBlocks: Record<string, {
    titleZh: string;
    titleVi: string;
    formula: string;
    explanationVi: string;
    examples: Array<{ hanzi: string; pinyin: string; translationVi: string }>;
  }>;
};

const RAW_LESSONS = [
  lesson01,
  lesson02,
  lesson03,
  lesson04,
  lesson05,
  lesson06,
  lesson07,
  lesson08,
  lesson09,
  lesson10,
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
const RAW_SCENES = (sceneData as unknown as { scenes: RawScene[] }).scenes;
const RAW_GRAMMAR = (grammarData as unknown as { blocks: RawGrammarBlock[] }).blocks;
const ENRICHMENT = enrichmentData as unknown as Enrichment;
const LEXEMES = new Map(RAW_LEXEMES.map((item) => [item.id, item]));
const SCENES = new Map(RAW_SCENES.map((item) => [item.id, item]));
const GRAMMAR = new Map(RAW_GRAMMAR.map((item) => [item.id, item]));

const WORD_CLASS_LABELS: Array<[RegExp, string]> = [
  [/dgt|động|dong/iu, "Động từ"],
  [/dt|danh/iu, "Danh từ"],
  [/tt|tính|tinh/iu, "Tính từ"],
  [/ph[oó]|副/iu, "Phó từ"],
  [/tr[oợ]|助/iu, "Trợ từ"],
  [/gi[oớ]i|介/iu, "Giới từ"],
  [/li[eê]n|连/iu, "Liên từ"],
  [/l[uư][oợ]ng|量/iu, "Lượng từ"],
  [/đ[aạ]i|dai|代/iu, "Đại từ"],
  [/s[oố]|so\.?/iu, "Số từ"],
];

const GRAMMAR_TITLES: Record<string, string> = {
  "hsk3-tb-l01-grammar-01": "Bổ ngữ kết quả “好”",
  "hsk3-tb-l02-grammar-01": "Bổ ngữ xu hướng đơn",
  "hsk3-tb-l03-grammar-01": "Phân biệt “还是” và “或者”",
  "hsk3-tb-l04-grammar-01": "Mẫu câu trọng tâm Bài 4",
  "hsk3-tb-l05-grammar-01": "Trợ từ “了” biểu thị sự thay đổi",
  "hsk3-tb-l06-grammar-01": "Bổ ngữ khả năng: Động từ + 得/不 + bổ ngữ",
  "hsk3-tb-l07-grammar-01": "Cách biểu đạt khoảng thời gian",
  "hsk3-tb-l08-grammar-01": "Phân biệt “又” và “再”",
  "hsk3-tb-l09-grammar-01": "Cấu trúc “越 A 越 B”",
  "hsk3-tb-l10-grammar-01": "Câu so sánh với 比",
  "hsk3-tb-l11-grammar-01": "Câu chữ 把 (1)",
  "hsk3-tb-l12-grammar-01": "Phân biệt “才” và “就”",
  "hsk3-tb-l13-grammar-01": "Bổ ngữ xu hướng phức hợp",
  "hsk3-tb-l14-grammar-01": "Câu chữ 把 (3)",
  "hsk3-tb-l15-grammar-01": "Cấu trúc “除了……以外，都/还/也……”",
  "hsk3-tb-l16-grammar-01": "Cấu trúc “如果……（的话），（主语）就……”",
  "hsk3-tb-l17-grammar-01": "Lặp lại động từ hai âm tiết",
  "hsk3-tb-l18-grammar-01": "Cấu trúc “只要……，就……”",
  "hsk3-tb-l19-grammar-01": "Nghĩa mở rộng của bổ ngữ xu hướng",
  "hsk3-tb-l20-grammar-01": "Câu chữ 被",
};

function requireEntity<T>(entities: Map<string, T>, id: string, owner: string): T {
  const entity = entities.get(id);
  if (!entity) throw new Error(`${owner} tham chiếu dữ liệu HSK3 không tồn tại: ${id}`);
  return entity;
}

function sectionRefs(lesson: RawLesson, type: string): string[] {
  return lesson.sections.find((section) => section.type === type)?.contentRefs ?? [];
}

function wordClass(raw: string | null): string {
  if (!raw) return "Từ vựng HSK 3";
  return WORD_CLASS_LABELS.find(([pattern]) => pattern.test(raw))?.[1] ?? "Từ vựng HSK 3";
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

function sceneLine(scene: RawScene, index: number) {
  return ENRICHMENT.sceneLines[scene.id]?.[index];
}

function vocabularyExample(lexeme: RawLexeme, scenes: RawScene[]) {
  for (const scene of scenes) {
    const index = scene.lines.findIndex((line) => matchesLexeme(line.textZh, lexeme.hanzi));
    if (index >= 0) {
      const line = scene.lines[index];
      const enriched = sceneLine(scene, index);
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

function toVocabulary(lexeme: RawLexeme, scenes: RawScene[]): HskVocabularyItem {
  return {
    id: lexeme.id,
    hanzi: lexeme.hanzi,
    pinyin: lexeme.pinyin,
    meaning: ENRICHMENT.lexemeMeanings[lexeme.id] ?? "Nghĩa đang được biên tập.",
    wordClass: wordClass(lexeme.partOfSpeechOcrRaw),
    ...vocabularyExample(lexeme, scenes),
  };
}

function toDialogue(scene: RawScene, lessonNumber: number): HskDialogue {
  const title = ENRICHMENT.sceneTitles[scene.id]?.translationVi || `Hội thoại ${scene.sceneNumber}`;
  return {
    id: scene.id,
    title,
    setting: `Tình huống giao tiếp ${scene.sceneNumber} trong Bài ${lessonNumber}.`,
    turns: scene.lines.map((line, index) => {
      const enriched = sceneLine(scene, index);
      return {
        speaker: line.speaker ?? (index % 2 ? "B" : "A"),
        hanzi: line.textZh,
        pinyin: enriched?.pinyin ?? "",
        translation: enriched?.translationVi ?? "Bản dịch đang được biên tập.",
      };
    }),
  };
}

function toGrammarPoint(block: RawGrammarBlock): HskGrammarPoint {
  const enriched = ENRICHMENT.grammarBlocks[block.id];
  if (!enriched) {
    return {
      id: block.id,
      title: "Ngữ pháp trọng tâm",
      formula: "Mẫu câu trong bài",
      explanation: "Ôn mẫu câu xuất hiện trong các bài khóa của bài học.",
      examples: [],
    };
  }
  return {
    id: block.id,
    title: GRAMMAR_TITLES[block.id] ?? `${enriched.titleVi} · ${enriched.titleZh}`,
    formula: enriched.formula,
    explanation: enriched.explanationVi,
    examples: enriched.examples.map((example) => ({
      hanzi: example.hanzi,
      pinyin: example.pinyin,
      translation: example.translationVi,
    })),
  };
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

function pronunciationTopics(scenes: RawScene[], vocabulary: HskVocabularyItem[]): string[] {
  const topics = scenes.slice(0, 4).map((scene) => {
    const title = ENRICHMENT.sceneTitles[scene.id];
    const pinyin = title?.pinyin || sceneLine(scene, 0)?.pinyin;
    return `Hội thoại ${scene.sceneNumber}: ${pinyin || "luyện đọc theo câu mẫu"}`;
  });
  topics.push(`Từ mới trọng tâm: ${vocabulary.slice(0, 6).map((word) => word.pinyin).join(" · ")}`);
  return topics;
}

function composeLesson(raw: RawLesson): HskLessonContent {
  const rawScenes = sectionRefs(raw, "texts")
    .map((ref) => requireEntity(SCENES, ref, raw.id))
    .filter((scene) => scene.lines.length > 0);
  const vocabulary = sectionRefs(raw, "vocabulary")
    .map((ref) => toVocabulary(requireEntity(LEXEMES, ref, raw.id), rawScenes));
  const dialogues = rawScenes.map((scene) => toDialogue(scene, raw.lessonNumber));
  const grammar = sectionRefs(raw, "grammar")
    .map((ref) => toGrammarPoint(requireEntity(GRAMMAR, ref, raw.id)));
  const exercises = buildExercises(vocabulary);
  const writing = buildHskWritingCharacters(vocabulary);
  const guidedPlaceholders = dialogues.length ? undefined : ["dialogue" as const];

  return {
    id: raw.id,
    sourceId: raw.id,
    levelId: "hsk-3",
    levelLabel: "HSK 3",
    lessonNumber: raw.lessonNumber,
    title: raw.title.vi,
    greeting: raw.title.zh,
    summary: `Học ${vocabulary.length} từ mới, ${dialogues.length || 4} tình huống bài khóa và mẫu ngữ pháp trọng tâm từ Giáo trình chuẩn HSK 3.`,
    minutes: Math.max(25, Math.min(35, 20 + Math.ceil(vocabulary.length / 3))),
    modes: ["vocabulary", "exercise", "pronunciation", "hanzi"],
    vocabulary,
    grammar,
    dialogues,
    pronunciationTopics: pronunciationTopics(rawScenes, vocabulary),
    exercises,
    writingCharacters: writing,
    contentStatus: raw.status,
    languageReviewStatus: "pending",
    audioAvailable: false,
    ...(guidedPlaceholders ? { guidedPlaceholders } : {}),
  };
}

export const HSK3_TEXTBOOK_LESSONS = RAW_LESSONS.map(composeLesson);

const HSK3_LESSONS_BY_ID = new Map(
  HSK3_TEXTBOOK_LESSONS.map((lesson) => [lesson.id, lesson]),
);

export function getHsk3TextbookLessonContent(
  levelId: string,
  lessonId: string,
): HskLessonContent | undefined {
  if (levelId !== "hsk-3") return undefined;
  return HSK3_LESSONS_BY_ID.get(lessonId);
}
