import annotationData from "../content/hsk6-textbook-1-json/annotation-blocks.json" with { type: "json" };
import curriculumData from "../content/hsk6-textbook-1-json/curriculum.json" with { type: "json" };
import lexemeData from "../content/hsk6-textbook-1-json/lexemes.json" with { type: "json" };
import mediaData from "../content/hsk6-textbook-1-json/media-assets.json" with { type: "json" };
import textData from "../content/hsk6-textbook-1-json/texts.json" with { type: "json" };
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
  bodyZhOcrLines: string[];
};

type RawAnnotation = {
  id: string;
  lessonId: string;
  lessonNumber: number;
  contentOcrLines: string[];
};

type RawMedia = {
  id: string;
  lessonNumber: number;
  trackLabel: string;
  availability: string;
  file: string | null;
};

const RAW_LESSONS = (curriculumData as unknown as { lessons: RawLesson[] }).lessons;
const RAW_LEXEMES = (lexemeData as unknown as { lexemes: RawLexeme[] }).lexemes;
const RAW_TEXTS = (textData as unknown as { texts: RawText[] }).texts;
const RAW_ANNOTATIONS = (annotationData as unknown as { blocks: RawAnnotation[] }).blocks;
const RAW_MEDIA = (mediaData as unknown as { mediaAssets: RawMedia[] }).mediaAssets;
const LEXEMES = new Map(RAW_LEXEMES.map((item) => [item.id, item]));
const TEXTS = new Map(RAW_TEXTS.map((item) => [item.id, item]));
const ANNOTATIONS = new Map(RAW_ANNOTATIONS.map((item) => [item.lessonId, item]));

const WORD_CLASS_LABELS: Record<string, string> = {
  adjective: "Tính từ",
  adverb: "Phó từ",
  conjunction: "Liên từ",
  interjection: "Thán từ",
  "measure-word": "Lượng từ",
  noun: "Danh từ",
  particle: "Trợ từ",
  preposition: "Giới từ",
  verb: "Động từ",
};

const SOURCE_NOISE = /(?:HSK\s*标准教程|标准教程6（上）|标准教程6|www\.|nhantriviet|GiaoTrinhChuanHSK)/giu;
const CHINESE_SENTENCE = /[^！？。!?\n]+[！？。!?]?/gu;

function requireEntity<T>(entities: Map<string, T>, id: string, owner: string): T {
  const entity = entities.get(id);
  if (!entity) throw new Error(`${owner} tham chiếu dữ liệu HSK 6 Tập 1 không tồn tại: ${id}`);
  return entity;
}

function cleanMeaning(raw: string | null): string {
  const value = raw
    ?.replace(/\s*,\s*/gu, ", ")
    .replace(/\s*;\s*/gu, "; ")
    .replace(/\s+/gu, " ")
    .trim();
  if (!value) return "Nghĩa tiếng Việt đang được biên tập.";
  return `${value.charAt(0).toLocaleUpperCase("vi-VN")}${value.slice(1)}`;
}

function wordClass(raw: string | null): string {
  if (!raw) return "Từ vựng HSK 6";
  return raw
    .split("|")
    .map((value) => WORD_CLASS_LABELS[value] ?? "Từ vựng HSK 6")
    .join(" / ");
}

function cleanSourceLine(line: string): string {
  return line
    .replace(SOURCE_NOISE, "")
    .replace(/^\*?\d+[.．]\s*/u, "")
    .trim();
}

function articleSentences(text: RawText): string[] {
  const compact = text.bodyZhOcrLines
    .map(cleanSourceLine)
    .filter((line) => line && !/^(?:HSK|标准教程6（上）)$/u.test(line))
    .join("")
    .replace(/\s+/gu, "");

  return (compact.match(CHINESE_SENTENCE) ?? [])
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 5 && /[\u3400-\u9fff]/u.test(sentence));
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
  const sentences = articleSentences(text);
  if (!sentences.length) return [text.titleZh];
  const chunkSize = Math.max(1, Math.ceil(sentences.length / 5));
  const paragraphs: string[] = [];
  for (let index = 0; index < sentences.length; index += chunkSize) {
    paragraphs.push(sentences.slice(index, index + chunkSize).join(""));
  }
  return paragraphs;
}

function toDialogue(text: RawText): HskDialogue {
  return {
    id: text.id,
    title: `Bài khóa · ${text.titleVi}`,
    setting: `Bài đọc nguyên bản, track ${text.audioTrack} trong Giáo trình chuẩn HSK 6 - Tập 1.`,
    turns: articleParagraphs(text).map((paragraph, index) => ({
      speaker: `Đoạn ${index + 1}`,
      hanzi: paragraph,
      pinyin: "",
      translation: "Đoạn văn tiếng Trung nguyên bản; bản dịch tiếng Việt đang được biên tập.",
    })),
  };
}

function cleanGrammarTitle(raw: string): string {
  return raw
    .replace(/^Chu\s*thich\s*/iu, "")
    .replace(/^\d+\s*/u, "")
    .replace(/^[“”"']|[“”"']$/gu, "")
    .trim();
}

function grammarTitle(line: string, nextLine: string | undefined): string | undefined {
  const title = cleanGrammarTitle(line);
  if (/^\d*$/u.test(title)) return nextLine?.match(/^“([^”]{1,28})”/u)?.[1];
  if (
    !title
    || title.length > 28
    || /^(?:注释|HSK|标准教程|[（(]?二[）)]?\s*词语|孩子给|父母之爱|一盒月饼)/u.test(title)
    || /[，。；：:]/u.test(title)
  ) return undefined;

  const quoted = nextLine?.match(/^“([^”]{1,28})”/u)?.[1];
  if (quoted) {
    const compactTitle = title.replace(/[\s·.…]/gu, "");
    const compactQuoted = quoted.replace(/[\s·.…]/gu, "");
    if (compactTitle.includes(compactQuoted) || compactQuoted.includes(compactTitle)) return quoted;
    if (/^\d/u.test(line)) return title;
  }
  return /^(?:①|指|汉语中|“)/u.test(nextLine ?? "") ? title : undefined;
}

function grammarHeadings(lines: string[]): Array<{ title: string; index: number }> {
  const headings: Array<{ title: string; index: number }> = [];
  for (let index = 0; index < lines.length && headings.length < 3; index += 1) {
    const title = grammarTitle(lines[index], lines[index + 1]);
    if (title && !headings.some((heading) => heading.title === title)) {
      headings.push({ title, index });
      continue;
    }
    const quotedStructure = lines[index].match(/^“([^”]{1,28})”[^”]*(?:结构|相当于|意思)/u)?.[1];
    if (quotedStructure && !headings.some((heading) => heading.title === quotedStructure)) {
      headings.push({ title: quotedStructure, index });
    }
  }
  return headings;
}

function grammarForLesson(lessonId: string): HskGrammarPoint[] {
  const annotation = ANNOTATIONS.get(lessonId);
  if (!annotation) return [];
  const lines = annotation.contentOcrLines.map((line) => line.trim()).filter(Boolean);
  const sectionEnd = lines.findIndex((line) => /[（(]?二[）)]?\s*词语辨析/u.test(line));
  const sourceLines = sectionEnd > 0 ? lines.slice(0, sectionEnd) : lines;
  const headings = grammarHeadings(sourceLines);

  return headings.map(({ title, index }, pointIndex) => {
    const nextIndex = headings[pointIndex + 1]?.index ?? sourceLines.length;
    const block = sourceLines.slice(index + 1, nextIndex)
      .map(cleanSourceLine)
      .filter((line) => line && !/^(?:HSK|标准教程6（上）)$/u.test(line));
    const explanation = block.find((line) => /意思|表示|用在|结构|相当于|用于|汉语中/u.test(line))
      ?? block[0]
      ?? title;
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
    `Nghe và nhắc lại từ mới: ${vocabulary.slice(0, 8).map((word) => word.pinyin).join(" · ")}`,
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
  const media = RAW_MEDIA.filter((asset) => asset.lessonNumber === raw.number);

  return {
    id: raw.id,
    sourceId: raw.id,
    levelId: "hsk-6",
    levelLabel: "HSK 6",
    lessonNumber: raw.number,
    title: raw.titleVi,
    greeting: raw.titleZh,
    summary: `Học ${vocabulary.length} từ mới, 1 bài khóa và ${grammar.length} điểm ngôn ngữ từ Giáo trình chuẩn HSK 6 - Tập 1.`,
    minutes: Math.max(45, Math.min(55, 35 + Math.ceil(vocabulary.length / 3))),
    modes: ["vocabulary", "exercise", "pronunciation", "hanzi"],
    vocabulary,
    grammar,
    dialogues,
    pronunciationTopics: pronunciationTopics(raw, vocabulary, text),
    exercises,
    writingCharacters: buildHskWritingCharacters(vocabulary),
    contentStatus: "review",
    languageReviewStatus: "pending",
    audioAvailable: media.length > 0 && media.every((asset) => (
      asset.availability === "available" && Boolean(asset.file)
    )),
  };
}

export const HSK6_VOLUME1_TEXTBOOK_LESSONS = RAW_LESSONS.map(composeLesson);

const HSK6_VOLUME1_LESSONS_BY_ID = new Map(
  HSK6_VOLUME1_TEXTBOOK_LESSONS.map((lesson) => [lesson.id, lesson]),
);

export function getHsk6Volume1TextbookLessonContent(
  levelId: string,
  lessonId: string,
): HskLessonContent | undefined {
  if (levelId !== "hsk-6") return undefined;
  return HSK6_VOLUME1_LESSONS_BY_ID.get(lessonId);
}
