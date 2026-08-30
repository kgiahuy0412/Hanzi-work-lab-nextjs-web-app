import enrichmentData from "../content/hsk2-textbook-json/shared/learning-enrichment.json" with { type: "json" };
import grammarData from "../content/hsk2-textbook-json/shared/grammar-points.json" with { type: "json" };
import lexemeData from "../content/hsk2-textbook-json/shared/lexemes.json" with { type: "json" };
import pronunciationData from "../content/hsk2-textbook-json/shared/pronunciation-topics.json" with { type: "json" };
import sceneData from "../content/hsk2-textbook-json/shared/text-scenes.json" with { type: "json" };
import lesson01 from "../content/hsk2-textbook-json/lessons/lesson-01.json" with { type: "json" };
import lesson02 from "../content/hsk2-textbook-json/lessons/lesson-02.json" with { type: "json" };
import lesson03 from "../content/hsk2-textbook-json/lessons/lesson-03.json" with { type: "json" };
import lesson04 from "../content/hsk2-textbook-json/lessons/lesson-04.json" with { type: "json" };
import lesson05 from "../content/hsk2-textbook-json/lessons/lesson-05.json" with { type: "json" };
import lesson06 from "../content/hsk2-textbook-json/lessons/lesson-06.json" with { type: "json" };
import lesson07 from "../content/hsk2-textbook-json/lessons/lesson-07.json" with { type: "json" };
import lesson08 from "../content/hsk2-textbook-json/lessons/lesson-08.json" with { type: "json" };
import lesson09 from "../content/hsk2-textbook-json/lessons/lesson-09.json" with { type: "json" };
import lesson10 from "../content/hsk2-textbook-json/lessons/lesson-10.json" with { type: "json" };
import lesson11 from "../content/hsk2-textbook-json/lessons/lesson-11.json" with { type: "json" };
import lesson12 from "../content/hsk2-textbook-json/lessons/lesson-12.json" with { type: "json" };
import lesson13 from "../content/hsk2-textbook-json/lessons/lesson-13.json" with { type: "json" };
import lesson14 from "../content/hsk2-textbook-json/lessons/lesson-14.json" with { type: "json" };
import lesson15 from "../content/hsk2-textbook-json/lessons/lesson-15.json" with { type: "json" };
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
  meaningVi: string;
  partOfSpeechOcrRaw: string | null;
};

type RawScene = {
  id: string;
  lessonRef: string;
  sceneNumber: number;
  title: { zh: string | null; pinyin: string | null; vi: string | null };
  lines: Array<{ speaker: string | null; textZh: string; pinyin: string }>;
};

type RawGrammarPoint = {
  id: string;
  lessonRef: string;
  titleZh: string;
  titleVi: string;
};

type RawPronunciationTopic = {
  id: string;
  lessonRef: string;
  titleZh: string;
  pinyin: string;
  subtopicsZh: string[];
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
  sceneLines: Record<string, Array<{ pinyin: string; translationVi: string }>>;
  grammarPoints: Record<string, EnrichedGrammar>;
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
] as unknown as RawLesson[];

const RAW_LEXEMES = (lexemeData as unknown as { lexemes: RawLexeme[] }).lexemes;
const RAW_SCENES = (sceneData as unknown as { scenes: RawScene[] }).scenes;
const RAW_GRAMMAR = (grammarData as unknown as { grammarPoints: RawGrammarPoint[] }).grammarPoints;
const RAW_PRONUNCIATION = (
  pronunciationData as unknown as { pronunciationTopics: RawPronunciationTopic[] }
).pronunciationTopics;
const ENRICHMENT = enrichmentData as unknown as Enrichment;
const LEXEMES = new Map(RAW_LEXEMES.map((item) => [item.id, item]));
const SCENES = new Map(RAW_SCENES.map((item) => [item.id, item]));
const GRAMMAR = new Map(RAW_GRAMMAR.map((item) => [item.id, item]));
const PRONUNCIATION = new Map(RAW_PRONUNCIATION.map((item) => [item.id, item]));

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
  if (!entity) throw new Error(`${owner} tham chiếu dữ liệu HSK2 textbook không tồn tại: ${id}`);
  return entity;
}

function sectionRefs(lesson: RawLesson, type: string): string[] {
  return lesson.sections.find((section) => section.type === type)?.contentRefs ?? [];
}

function wordClass(raw: string | null): string {
  if (!raw) return "Từ vựng HSK 2";
  return WORD_CLASS_LABELS.find(([pattern]) => pattern.test(raw))?.[1] ?? "Từ vựng HSK 2";
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
        examplePinyin: enriched?.pinyin || line.pinyin,
        translation: enriched?.translationVi ?? "Bản dịch đang được biên tập.",
      };
    }
  }
  return {
    example: lexeme.hanzi,
    examplePinyin: lexeme.pinyin,
    translation: lexeme.meaningVi,
  };
}

function toVocabulary(lexeme: RawLexeme, scenes: RawScene[]): HskVocabularyItem {
  return {
    id: lexeme.id,
    hanzi: lexeme.hanzi,
    pinyin: lexeme.pinyin,
    meaning: lexeme.meaningVi,
    wordClass: wordClass(lexeme.partOfSpeechOcrRaw),
    ...vocabularyExample(lexeme, scenes),
  };
}

function toDialogue(scene: RawScene, lessonNumber: number): HskDialogue {
  return {
    id: scene.id,
    title: scene.title.vi || scene.title.zh || `Hội thoại ${scene.sceneNumber}`,
    setting: `Tình huống giao tiếp ${scene.sceneNumber} trong Bài ${lessonNumber}.`,
    turns: scene.lines.map((line, index) => {
      const enriched = sceneLine(scene, index);
      return {
        speaker: line.speaker ?? (index % 2 ? "B" : "A"),
        hanzi: line.textZh,
        pinyin: enriched?.pinyin || line.pinyin,
        translation: enriched?.translationVi ?? "Bản dịch đang được biên tập.",
      };
    }),
  };
}

function toGrammarPoint(point: RawGrammarPoint): HskGrammarPoint {
  const enriched = ENRICHMENT.grammarPoints[point.id];
  return {
    id: point.id,
    title: `${point.titleVi} · ${point.titleZh}`,
    formula: enriched?.formula ?? point.titleZh,
    explanation: enriched?.explanationVi
      ?? `${point.titleVi}. Quan sát cách dùng cấu trúc này trong các câu mẫu của bài học.`,
    examples: (enriched?.examples ?? []).map((example) => ({
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

function pronunciationTopics(
  lesson: RawLesson,
  scenes: RawScene[],
  vocabulary: HskVocabularyItem[],
): string[] {
  const topicRefs = sectionRefs(lesson, "pronunciation");
  const sourceTopics = topicRefs.map((ref) => requireEntity(PRONUNCIATION, ref, lesson.id));
  const topics = sourceTopics.flatMap((topic) => [
    `${topic.titleZh}: ${topic.pinyin}`,
    ...topic.subtopicsZh,
  ]);
  for (const scene of scenes) {
    if (topics.length >= 5) break;
    topics.push(`Hội thoại ${scene.sceneNumber}: ${scene.title.pinyin || scene.lines[0]?.pinyin || "luyện đọc"}`);
  }
  topics.push(`Từ mới trọng tâm: ${vocabulary.slice(0, 6).map((word) => word.pinyin).join(" · ")}`);
  return topics.slice(0, 6);
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

  return {
    id: raw.id,
    sourceId: raw.id,
    levelId: "hsk-2",
    levelLabel: "HSK 2",
    lessonNumber: raw.lessonNumber,
    title: raw.title.vi,
    greeting: raw.title.zh,
    summary: `Học ${vocabulary.length} từ mới, ${dialogues.length} tình huống bài khóa và ${grammar.length} điểm ngữ pháp từ Giáo trình chuẩn HSK 2.`,
    minutes: Math.max(25, Math.min(30, 24 + Math.ceil(vocabulary.length / 4))),
    modes: ["vocabulary", "exercise", "pronunciation", "hanzi"],
    vocabulary,
    grammar,
    dialogues,
    pronunciationTopics: pronunciationTopics(raw, rawScenes, vocabulary),
    exercises,
    writingCharacters: buildHskWritingCharacters(vocabulary),
    contentStatus: raw.status,
    languageReviewStatus: "pending",
    audioAvailable: false,
  };
}

export const HSK2_TEXTBOOK_LESSONS = RAW_LESSONS.map(composeLesson);

const HSK2_LESSONS_BY_ID = new Map(
  HSK2_TEXTBOOK_LESSONS.map((lesson) => [lesson.id, lesson]),
);

export function getHsk2TextbookLessonContent(
  levelId: string,
  lessonId: string,
): HskLessonContent | undefined {
  if (levelId !== "hsk-2") return undefined;
  return HSK2_LESSONS_BY_ID.get(lessonId);
}
