import articleData from "../content/hsk6-volume2-textbook-json/shared/articles.json" with { type: "json" };
import curriculumData from "../content/hsk6-volume2-textbook-json/curriculum.json" with { type: "json" };
import languagePointData from "../content/hsk6-volume2-textbook-json/shared/language-points.json" with { type: "json" };
import lexemeData from "../content/hsk6-volume2-textbook-json/shared/lexemes.json" with { type: "json" };
import mediaData from "../content/hsk6-volume2-textbook-json/shared/media-assets.json" with { type: "json" };
import sectionBlockData from "../content/hsk6-volume2-textbook-json/shared/section-blocks.json" with { type: "json" };
import {
  buildHskWritingCharacters,
  type HskDialogue,
  type HskExercise,
  type HskGrammarPoint,
  type HskLessonContent,
  type HskVocabularyItem,
} from "./hsk-lesson-content.ts";

type RawLesson = {
  lessonRef: string;
  number: number;
  titleZh: string;
  titleVi: string;
};

type RawLexeme = {
  id: string;
  lessonRef: string;
  sourceNumber: number;
  hanzi: string;
  pinyin: string;
  partOfSpeechRaw: string | null;
  meaningViRaw: string | null;
};

type RawArticleParagraph = {
  textZh: string;
  pinyinGenerated: string;
};

type RawArticle = {
  id: string;
  lessonRef: string;
  titleZh: string;
  titlePinyin: string;
  textZh: string;
  paragraphs: RawArticleParagraph[];
};

type LanguagePointCategory = "integrated-note" | "word-distinction" | "discourse-rhetoric" | "extension";

type RawLanguagePoint = {
  id: string;
  lessonRef: string;
  category: LanguagePointCategory;
  titleZh: string;
  pinyinGenerated: string;
};

type RawSectionBlock = {
  id: string;
  lessonRef: string;
  type: string;
  textRaw: string;
};

type RawMedia = {
  id: string;
  lessonRef: string;
  trackCode: string;
  availability: string;
};

const RAW_LESSONS = (curriculumData as unknown as { lessons: RawLesson[] }).lessons;
const RAW_LEXEMES = lexemeData as unknown as RawLexeme[];
const RAW_ARTICLES = articleData as unknown as RawArticle[];
const RAW_LANGUAGE_POINTS = languagePointData as unknown as RawLanguagePoint[];
const RAW_SECTION_BLOCKS = sectionBlockData as unknown as RawSectionBlock[];
const RAW_MEDIA = mediaData as unknown as RawMedia[];
const ARTICLES = new Map(RAW_ARTICLES.map((item) => [item.lessonRef, item]));

const WORD_CLASS_LABELS: Array<[RegExp, string]> = [
  [/dgt|động|dong/iu, "Động từ"],
  [/(^|[./])dt([./]|$)|danh/iu, "Danh từ"],
  [/(^|[./])tt([./,]|$)|tính|tinh/iu, "Tính từ"],
  [/pho|phó|副/iu, "Phó từ"],
  [/gioi|giới|介/iu, "Giới từ"],
  [/lien|liên|连/iu, "Liên từ"],
  [/luong|lượng|量/iu, "Lượng từ"],
  [/tro|trợ|助/iu, "Trợ từ"],
  [/dai|đại|代/iu, "Đại từ"],
  [/so|số|数/iu, "Số từ"],
];

const CATEGORY_LABELS: Record<LanguagePointCategory, string> = {
  "integrated-note": "Chú thích tổng hợp",
  "word-distinction": "Phân biệt từ",
  "discourse-rhetoric": "Liên kết văn bản",
  extension: "Mở rộng từ vựng",
};

const CATEGORY_BLOCK_TYPES: Record<LanguagePointCategory, string> = {
  "integrated-note": "integrated-notes",
  "word-distinction": "word-distinction",
  "discourse-rhetoric": "discourse-rhetoric",
  extension: "extension",
};

function requireArticle(lessonId: string): RawArticle {
  const article = ARTICLES.get(lessonId);
  if (!article) throw new Error(`Bài HSK 6 thiếu bài khóa: ${lessonId}`);
  return article;
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
  return WORD_CLASS_LABELS.find(([pattern]) => pattern.test(raw))?.[1] ?? "Từ vựng HSK 6";
}

function articleSentence(article: RawArticle, hanzi: string): string | undefined {
  return article.textZh
    .split(/(?<=[。！？!?])/u)
    .map((sentence) => sentence.replace(/\s+/gu, "").trim())
    .find((sentence) => sentence.includes(hanzi) && sentence.length >= hanzi.length + 2);
}

function toVocabulary(lexeme: RawLexeme, article: RawArticle): HskVocabularyItem {
  const example = articleSentence(article, lexeme.hanzi);
  return {
    id: lexeme.id,
    hanzi: lexeme.hanzi,
    pinyin: lexeme.pinyin,
    meaning: cleanMeaning(lexeme.meaningViRaw),
    wordClass: wordClass(lexeme.partOfSpeechRaw),
    example: example ?? lexeme.hanzi,
    examplePinyin: lexeme.pinyin,
    translation: example
      ? `Ví dụ trích từ bài khóa “${article.titleZh}”.`
      : cleanMeaning(lexeme.meaningViRaw),
  };
}

function toDialogue(article: RawArticle, lesson: RawLesson): HskDialogue {
  return {
    id: article.id,
    title: `Bài khóa · ${lesson.titleVi}`,
    setting: `Bài đọc nguyên bản trong Giáo trình chuẩn HSK 6 - Tập 2, Bài ${lesson.number}.`,
    turns: article.paragraphs.map((paragraph, index) => ({
      speaker: `Đoạn ${index + 1}`,
      hanzi: paragraph.textZh,
      pinyin: paragraph.pinyinGenerated,
      translation: "Đoạn văn tiếng Trung nguyên bản; bản dịch tiếng Việt đang được biên tập.",
    })),
  };
}

function normalizedHeading(value: string): string {
  return value
    .replace(/^\d+\s*/u, "")
    .replace(/[—一－\s（）()：:]/gu, "")
    .trim();
}

function blockForPoint(point: RawLanguagePoint): RawSectionBlock | undefined {
  const blockType = CATEGORY_BLOCK_TYPES[point.category];
  return RAW_SECTION_BLOCKS.find((block) => block.lessonRef === point.lessonRef && block.type === blockType);
}

function pointSourceLines(point: RawLanguagePoint): string[] {
  const block = blockForPoint(point);
  if (!block) return [];
  const lines = block.textRaw.split("\n").map((line) => line.trim()).filter(Boolean);
  const target = normalizedHeading(point.titleZh);
  const start = lines.findIndex((line) => {
    const normalized = normalizedHeading(line);
    return normalized === target || normalized.includes(target) || target.includes(normalized);
  });
  if (start < 0) return lines;

  const siblingTitles = RAW_LANGUAGE_POINTS
    .filter((candidate) => candidate.lessonRef === point.lessonRef
      && candidate.category === point.category
      && candidate.id !== point.id)
    .map((candidate) => normalizedHeading(candidate.titleZh));
  const relativeEnd = lines.slice(start + 1).findIndex((line) => {
    const normalized = normalizedHeading(line);
    return siblingTitles.some((title) => normalized === title || normalized.includes(title));
  });
  return lines.slice(start + 1, relativeEnd < 0 ? undefined : start + 1 + relativeEnd);
}

function grammarForLesson(lessonId: string, article: RawArticle): HskGrammarPoint[] {
  return RAW_LANGUAGE_POINTS
    .filter((point) => point.lessonRef === lessonId)
    .map((point) => {
      const sourceLines = pointSourceLines(point);
      const explanation = sourceLines.find((line) => /表示|意思|用于|用来|指|相当于|都是/u.test(line))
        ?? sourceLines.find((line) => /[\u3400-\u9fff]/u.test(line))
        ?? `${point.titleZh} là điểm ngôn ngữ trọng tâm của bài.`;
      const examples = sourceLines
        .filter((line) => /^[（(]\d+[）)]/u.test(line) && /[\u3400-\u9fff]/u.test(line))
        .slice(0, 3)
        .map((line) => ({
          hanzi: line.replace(/^[（(]\d+[）)]\s*/u, ""),
          pinyin: "",
          translation: "Ví dụ gốc trong giáo trình.",
        }));
      const fallbackExample = articleSentence(article, point.titleZh.split(/[—一－]/u)[0]);
      return {
        id: point.id,
        title: `${point.titleZh} · ${CATEGORY_LABELS[point.category]}`,
        formula: point.pinyinGenerated,
        explanation: `Giáo trình giải thích: ${explanation}`,
        examples: examples.length ? examples : [{
          hanzi: fallbackExample ?? point.titleZh,
          pinyin: "",
          translation: "Nội dung gốc đang được biên tập tiếng Việt.",
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
  return vocabulary.slice(0, 4).map((word, index) => {
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

function truncate(value: string, maxLength = 110): string {
  return value.length > maxLength ? `${value.slice(0, maxLength).trim()}…` : value;
}

function pronunciationTopics(article: RawArticle, vocabulary: HskVocabularyItem[]): string[] {
  const paragraphTopics = article.paragraphs.slice(0, 5).map((paragraph, index) => (
    `Đoạn ${index + 1}: ${truncate(paragraph.pinyinGenerated)}`
  ));
  return [
    ...paragraphTopics,
    `Từ mới trọng tâm: ${vocabulary.slice(0, 8).map((word) => word.pinyin).join(" · ")}`,
  ];
}

function composeLesson(raw: RawLesson): HskLessonContent {
  const article = requireArticle(raw.lessonRef);
  const vocabulary = RAW_LEXEMES
    .filter((lexeme) => lexeme.lessonRef === raw.lessonRef)
    .sort((left, right) => left.sourceNumber - right.sourceNumber)
    .map((lexeme) => toVocabulary(lexeme, article));
  const grammar = grammarForLesson(raw.lessonRef, article);
  const dialogues = [toDialogue(article, raw)];
  const exercises = buildExercises(vocabulary);
  const media = RAW_MEDIA.filter((asset) => asset.lessonRef === raw.lessonRef);

  return {
    id: raw.lessonRef,
    sourceId: raw.lessonRef,
    levelId: "hsk-6",
    levelLabel: "HSK 6",
    lessonNumber: raw.number,
    title: raw.titleVi,
    greeting: raw.titleZh,
    summary: `Học ${vocabulary.length} từ mới, 1 bài khóa và ${grammar.length} điểm ngôn ngữ từ Giáo trình chuẩn HSK 6 - Tập 2.`,
    minutes: Math.max(50, Math.min(60, 40 + Math.ceil(vocabulary.length / 4))),
    modes: ["vocabulary", "exercise", "pronunciation", "hanzi"],
    vocabulary,
    grammar,
    dialogues,
    pronunciationTopics: pronunciationTopics(article, vocabulary),
    exercises,
    writingCharacters: buildHskWritingCharacters(vocabulary),
    contentStatus: "review",
    languageReviewStatus: "pending",
    audioAvailable: media.length > 0 && media.every((asset) => asset.availability === "available"),
  };
}

export const HSK6_VOLUME2_TEXTBOOK_LESSONS = RAW_LESSONS.map(composeLesson);

const HSK6_VOLUME2_LESSONS_BY_ID = new Map(
  HSK6_VOLUME2_TEXTBOOK_LESSONS.map((lesson) => [lesson.id, lesson]),
);

export function getHsk6Volume2TextbookLessonContent(
  levelId: string,
  lessonId: string,
): HskLessonContent | undefined {
  if (levelId !== "hsk-6") return undefined;
  return HSK6_VOLUME2_LESSONS_BY_ID.get(lessonId);
}
