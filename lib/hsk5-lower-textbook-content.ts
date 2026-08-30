import annotationData from "../content/hsk5-lower-textbook-json/annotation-blocks.json" with { type: "json" };
import curriculumData from "../content/hsk5-lower-textbook-json/curriculum.json" with { type: "json" };
import lexemeData from "../content/hsk5-lower-textbook-json/lexemes.json" with { type: "json" };
import textData from "../content/hsk5-lower-textbook-json/texts.json" with { type: "json" };
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
  number: number;
  titleZh: string;
  titleVi: string;
  audioTracks: string[];
  textIds: string[];
  lexemeIds: string[];
};

type RawLexeme = {
  id: string;
  lessonNumber: number;
  lessonOrder: number;
  hanzi: string;
  pinyin: string;
  partOfSpeech: string | null;
  meaningVi: string | null;
};

type RawText = {
  id: string;
  lessonId: string;
  lessonNumber: number;
  titleZh: string;
  titleVi: string;
  audioTrack: string;
  bodyZhOcr: string;
};

type RawAnnotation = {
  id: string;
  lessonId: string;
  lessonNumber: number;
  contentOcrLines: string[];
};

const RAW_LESSONS = (curriculumData as unknown as { lessons: RawLesson[] }).lessons;
const RAW_LEXEMES = (lexemeData as unknown as { lexemes: RawLexeme[] }).lexemes;
const RAW_TEXTS = (textData as unknown as { texts: RawText[] }).texts;
const RAW_ANNOTATIONS = (annotationData as unknown as { blocks: RawAnnotation[] }).blocks;
const LEXEMES = new Map(RAW_LEXEMES.map((item) => [item.id, item]));
const TEXTS = new Map(RAW_TEXTS.map((item) => [item.id, item]));
const ANNOTATIONS = new Map(RAW_ANNOTATIONS.map((item) => [item.lessonId, item]));

const WORD_CLASS_LABELS: Array<[RegExp, string]> = [
  [/dgt|động|dong/iu, "Động từ"],
  [/(^|[./])dt([./]|$)|danh/iu, "Danh từ"],
  [/(^|[./])tt([./,]|$)|tính|tinh/iu, "Tính từ"],
  [/pho|phó|副/iu, "Phó từ"],
  [/gioi|giới|介/iu, "Giới từ"],
  [/lien|liên|连/iu, "Liên từ"],
  [/luong|luang|lượng|量/iu, "Lượng từ"],
  [/trợ|tro|助/iu, "Trợ từ"],
  [/đại|dai|代/iu, "Đại từ"],
  [/số|so|数/iu, "Số từ"],
];

const SOURCE_NOISE = /(?:HSK\s*标准教程|标准教程5|www\.|GiaoTrinh|Giao\.Trinh)/iu;
const CHINESE_SENTENCE = /[^！？。!?\n]+[！？。!?]?/gu;

function requireEntity<T>(entities: Map<string, T>, id: string, owner: string): T {
  const entity = entities.get(id);
  if (!entity) throw new Error(`${owner} tham chiếu dữ liệu HSK 5 không tồn tại: ${id}`);
  return entity;
}

function cleanMeaning(raw: string | null): string {
  const value = raw
    ?.replace(/[（(]\s*lic\s*[)）]/giu, "lúc")
    .replace(/\s*,\s*/gu, ", ")
    .replace(/\s*;\s*/gu, "; ")
    .replace(/\s+/gu, " ")
    .trim();
  if (!value) return "Nghĩa tiếng Việt đang được biên tập.";
  return `${value.charAt(0).toLocaleUpperCase("vi-VN")}${value.slice(1)}`;
}

function wordClass(raw: string | null): string {
  if (!raw) return "Từ vựng HSK 5";
  return WORD_CLASS_LABELS.find(([pattern]) => pattern.test(raw))?.[1] ?? "Từ vựng HSK 5";
}

function articleSentences(text: RawText): string[] {
  return (text.bodyZhOcr.match(CHINESE_SENTENCE) ?? [])
    .map((line) => line.replace(SOURCE_NOISE, "").replace(/\s+/gu, "").trim())
    .filter((line) => line.length >= 5 && !SOURCE_NOISE.test(line));
}

function vocabularyExample(lexeme: RawLexeme, text: RawText) {
  const sentence = articleSentences(text).find((line) => line.includes(lexeme.hanzi));
  if (!sentence) {
    return {
      example: lexeme.hanzi,
      examplePinyin: lexeme.pinyin,
      translation: cleanMeaning(lexeme.meaningVi),
    };
  }
  return {
    example: sentence,
    examplePinyin: lexeme.pinyin,
    translation: `Ví dụ lấy từ bài khóa “${text.titleVi}”.`,
  };
}

function toVocabulary(lexeme: RawLexeme, text: RawText): HskVocabularyItem {
  return {
    id: lexeme.id,
    hanzi: lexeme.hanzi,
    pinyin: lexeme.pinyin,
    meaning: cleanMeaning(lexeme.meaningVi),
    wordClass: wordClass(lexeme.partOfSpeech),
    ...vocabularyExample(lexeme, text),
  };
}

function articleParagraphs(text: RawText): string[] {
  const paragraphs = text.bodyZhOcr
    .split(/\n\s*\n/gu)
    .map((paragraph) => paragraph
      .split("\n")
      .filter((line) => !SOURCE_NOISE.test(line))
      .join("")
      .replace(/\s+/gu, "")
      .trim())
    .filter((paragraph) => paragraph.length >= 8);

  return paragraphs.length ? paragraphs : articleSentences(text);
}

function toDialogue(text: RawText): HskDialogue {
  return {
    id: text.id,
    title: `Bài khóa · ${text.titleVi}`,
    setting: `Bài đọc nguyên bản, track ${text.audioTrack} trong Giáo trình chuẩn HSK 5 - Tập 2.`,
    turns: articleParagraphs(text).map((paragraph, index) => ({
      speaker: `Đoạn ${index + 1}`,
      hanzi: paragraph,
      pinyin: "",
      translation: "Đoạn văn tiếng Trung nguyên bản; bản dịch tiếng Việt đang được biên tập.",
    })),
  };
}

function isAnnotationHeading(line: string, nextLine: string | undefined): string | undefined {
  const normalized = line
    .replace(/^Chu\s*thich\s*/iu, "")
    .replace(/^\d+\s*/u, "")
    .trim();
  if (!normalized || normalized.length > 18 || /[，。；：:（）()]/u.test(normalized)) return undefined;
  const quoted = nextLine?.match(/^“([^”]+)”/u)?.[1];
  const compactHeading = normalized.replace(/\s+/gu, "");
  if (quoted) {
    const compactQuoted = quoted.replace(/\s+/gu, "");
    return compactQuoted.includes(compactHeading) || compactHeading.includes(compactQuoted)
      ? quoted
      : undefined;
  }
  return /[\u3400-\u9fff]/u.test(normalized)
    && /^(?:\d+[.．、]?\s*)?(?:表示|用在|可以|是指|相当于)/u.test(nextLine ?? "")
    ? normalized
    : undefined;
}

function grammarForLesson(lessonId: string): HskGrammarPoint[] {
  const annotation = ANNOTATIONS.get(lessonId);
  if (!annotation) return [];
  const lines = annotation.contentOcrLines.map((line) => line.trim()).filter(Boolean);
  const sectionEnd = lines.findIndex((line) => /[（(]二[）)]\s*词语搭配/u.test(line));
  const sourceLines = sectionEnd > 0 ? lines.slice(0, sectionEnd) : lines;
  const headings = sourceLines.flatMap((line, index) => {
    const title = isAnnotationHeading(line, sourceLines[index + 1]);
    return title ? [{ title, index }] : [];
  }).slice(0, 5);

  return headings.map(({ title, index }, pointIndex) => {
    const nextIndex = headings[pointIndex + 1]?.index ?? sourceLines.length;
    const block = sourceLines.slice(index + 1, nextIndex).filter((line) => !SOURCE_NOISE.test(line));
    const explanation = block.find((line) => /意思|表示|用在|结构|相当于/u.test(line)) ?? block[0] ?? title;
    const examples = block
      .filter((line) => /^[（(]\d+[）)]/u.test(line) && /[\u3400-\u9fff]/u.test(line))
      .slice(0, 3)
      .map((line) => ({
        hanzi: line.replace(/^[（(]\d+[）)]\s*/u, ""),
        pinyin: "",
        translation: "Ví dụ gốc trong giáo trình.",
      }));

    return {
      id: `${annotation.id}-point-${pointIndex + 1}`,
      title,
      formula: title,
      explanation: `Giáo trình giải thích: ${explanation}`,
      examples: examples.length ? examples : [{
        hanzi: title,
        pinyin: "",
        translation: "Nội dung chú thích đang được biên tập.",
      }],
    };
  });
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

function pronunciationTopics(raw: RawLesson, vocabulary: HskVocabularyItem[], text: RawText): string[] {
  return [
    `Đọc tên bài: ${text.titleZh}`,
    `Luyện đọc bài khóa theo nhịp của track ${raw.audioTracks[0] ?? text.audioTrack}`,
    `Nghe và nhắc lại từ mới: ${vocabulary.slice(0, 6).map((word) => word.pinyin).join(" · ")}`,
    `Luyện ngắt câu và thanh điệu theo ${articleParagraphs(text).length} đoạn của bài khóa`,
  ];
}

function composeLesson(raw: RawLesson): HskLessonContent {
  const text = requireEntity(TEXTS, raw.textIds[0], raw.id);
  const vocabulary = raw.lexemeIds
    .map((ref) => requireEntity(LEXEMES, ref, raw.id))
    .sort((left, right) => left.lessonOrder - right.lessonOrder)
    .map((lexeme) => toVocabulary(lexeme, text));
  const grammar = grammarForLesson(raw.id);
  const dialogues = [toDialogue(text)];
  const exercises = buildExercises(vocabulary);

  return {
    id: raw.id,
    sourceId: raw.id,
    levelId: "hsk-5",
    levelLabel: "HSK 5",
    lessonNumber: raw.number,
    title: raw.titleVi,
    greeting: raw.titleZh,
    summary: `Học ${vocabulary.length} từ mới, 1 bài khóa và ${grammar.length} điểm chú thích từ Giáo trình chuẩn HSK 5 - Tập 2.`,
    minutes: Math.max(40, Math.min(50, 30 + Math.ceil(vocabulary.length / 2))),
    modes: ["vocabulary", "exercise", "pronunciation", "hanzi"],
    vocabulary,
    grammar,
    dialogues,
    pronunciationTopics: pronunciationTopics(raw, vocabulary, text),
    exercises,
    writingCharacters: buildHskWritingCharacters(vocabulary),
    contentStatus: "review",
    languageReviewStatus: "pending",
    audioAvailable: false,
  };
}

export const HSK5_LOWER_TEXTBOOK_LESSONS = RAW_LESSONS.map(composeLesson);

const HSK5_LOWER_LESSONS_BY_ID = new Map(
  HSK5_LOWER_TEXTBOOK_LESSONS.map((lesson) => [lesson.id, lesson]),
);

export function getHsk5LowerTextbookLessonContent(
  levelId: string,
  lessonId: string,
): HskLessonContent | undefined {
  if (levelId !== "hsk-5") return undefined;
  return HSK5_LOWER_LESSONS_BY_ID.get(lessonId);
}
