import enrichmentData from "../content/hsk5-workbook-1-json/learning-enrichment.json" with { type: "json" };
import curriculumData from "../content/hsk5-workbook-1-json/curriculum.json" with { type: "json" };
import exerciseData from "../content/hsk5-workbook-1-json/exercises.json" with { type: "json" };
import listeningBlockData from "../content/hsk5-workbook-1-json/blocks/listening-blocks.json" with { type: "json" };
import readingBlockData from "../content/hsk5-workbook-1-json/blocks/reading-blocks.json" with { type: "json" };
import writingBlockData from "../content/hsk5-workbook-1-json/blocks/writing-blocks.json" with { type: "json" };
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
  unitId: string;
  titleZh: string;
  exerciseIds: string[];
  exerciseCount: number;
  exerciseCountsBySection: {
    listening: number;
    reading: number;
    writing: number;
  };
};

type RawOption = {
  label: string;
  textOcr: string;
};

type RawExercise = {
  id: string;
  order: number;
  lessonId: string;
  sectionType: "listening" | "reading" | "writing";
  part: number;
  numberInSource: number;
  promptOcr: string;
  optionsOcr: RawOption[];
};

type RawSectionBlock = {
  id: string;
  lessonId: string;
  audioTrackReferences: string[];
  contentOcrLines: string[];
  contentOcr: string;
};

type EnrichedVocabulary = {
  hanzi: string;
  pinyin: string;
  meaningVi: string;
};

type Enrichment = {
  status: string;
  unitTitlesVi: Record<string, string>;
  lessons: Record<string, {
    titleVi: string;
    vocabulary: EnrichedVocabulary[];
  }>;
};

const RAW_LESSONS = (curriculumData as unknown as { lessons: RawLesson[] }).lessons;
const RAW_EXERCISES = (exerciseData as unknown as { exercises: RawExercise[] }).exercises;
const RAW_LISTENING_BLOCKS = (listeningBlockData as unknown as { blocks: RawSectionBlock[] }).blocks;
const RAW_READING_BLOCKS = (readingBlockData as unknown as { blocks: RawSectionBlock[] }).blocks;
const RAW_WRITING_BLOCKS = (writingBlockData as unknown as { blocks: RawSectionBlock[] }).blocks;
const ENRICHMENT = enrichmentData as unknown as Enrichment;
const EXERCISES = new Map(RAW_EXERCISES.map((item) => [item.id, item]));
const LISTENING_BLOCKS = new Map(RAW_LISTENING_BLOCKS.map((item) => [item.lessonId, item]));
const READING_BLOCKS = new Map(RAW_READING_BLOCKS.map((item) => [item.lessonId, item]));
const WRITING_BLOCKS = new Map(RAW_WRITING_BLOCKS.map((item) => [item.lessonId, item]));

const SOURCE_NOISE = /(?:HSK|标准教程5|练习册|第\d+[-—]\d+题|请选出|第一部分|第二部分|第三部分)/u;

function requireEntity<T>(entities: Map<string, T>, id: string, owner: string): T {
  const entity = entities.get(id);
  if (!entity) throw new Error(`${owner} tham chiếu dữ liệu HSK 5 workbook không tồn tại: ${id}`);
  return entity;
}

function lessonExercises(raw: RawLesson): RawExercise[] {
  return raw.exerciseIds
    .map((id) => requireEntity(EXERCISES, id, raw.id))
    .sort((left, right) => left.order - right.order);
}

function sourceExample(word: EnrichedVocabulary, exercises: RawExercise[]): string {
  for (const exercise of exercises) {
    const line = exercise.promptOcr
      .split("\n")
      .map((item) => item.replace(/^\d+[.、]?\s*/u, "").trim())
      .find((item) => item.includes(word.hanzi) && !/^[A-DＡ-Ｄ]/u.test(item));
    if (line) return line;
    const option = exercise.optionsOcr.find((item) => item.textOcr.includes(word.hanzi));
    if (option) return option.textOcr;
  }
  return word.hanzi;
}

function toVocabulary(
  lessonId: string,
  words: EnrichedVocabulary[],
  exercises: RawExercise[],
): HskVocabularyItem[] {
  return words.map((word, index) => {
    const example = sourceExample(word, exercises);
    return {
      id: `${lessonId}-keyword-${String(index + 1).padStart(2, "0")}`,
      hanzi: word.hanzi,
      pinyin: word.pinyin,
      meaning: word.meaningVi,
      wordClass: "Từ khóa viết HSK 5",
      example,
      examplePinyin: word.pinyin,
      translation: example === word.hanzi
        ? word.meaningVi
        : "Cụm từ hoặc câu mẫu xuất hiện trong bài tập workbook.",
    };
  });
}

function cleanReadingPrompt(prompt: string): string {
  return prompt
    .split("\n")
    .filter((line) => !/^[A-DＡ-Ｄ]\s*/u.test(line.trim()))
    .join("")
    .replace(/^\d+[.、]?\s*/u, "")
    .replace(/\s+/gu, "")
    .trim();
}

function buildDialogues(raw: RawLesson, exercises: RawExercise[]): HskDialogue[] {
  const readingExercises = exercises.filter((exercise) => exercise.sectionType === "reading");
  if (readingExercises.length) {
    return readingExercises.map((exercise) => {
      const prompt = cleanReadingPrompt(exercise.promptOcr) || exercise.promptOcr.replace(/\s+/gu, " ").trim();
      const options = exercise.optionsOcr.map((option) => `${option.label}. ${option.textOcr}`).join(" · ");
      return {
        id: `${exercise.id}-reading`,
        title: `Đọc hiểu · Câu ${exercise.numberInSource}`,
        setting: `Phần ${exercise.part} của mục Đọc hiểu trong workbook Bài ${raw.number}.`,
        turns: [{
          speaker: `Câu ${exercise.numberInSource}`,
          hanzi: [prompt, options].filter(Boolean).join("\n"),
          pinyin: "",
          translation: "Câu đọc hiểu tiếng Trung nguyên bản; đáp án không có trong PDF nguồn.",
        }],
      };
    });
  }

  const readingBlock = requireEntity(READING_BLOCKS, raw.id, raw.id);
  const fallbackLines = readingBlock.contentOcrLines
    .filter((line) => line.length >= 24 && !SOURCE_NOISE.test(line))
    .slice(0, 4);
  return [{
    id: `${raw.id}-reading`,
    title: "Bài đọc luyện tập",
    setting: `Các đoạn đọc thuộc phần Đọc hiểu của workbook Bài ${raw.number}.`,
    turns: fallbackLines.map((line, index) => ({
      speaker: `Đoạn ${index + 1}`,
      hanzi: line,
      pinyin: "",
      translation: "Đoạn đọc tiếng Trung nguyên bản; bản dịch tiếng Việt đang được biên tập.",
    })),
  }];
}

function writingPrompt(exercise: RawExercise): string {
  return exercise.promptOcr
    .replace(/^\d+[.、]?\s*/u, "")
    .replace(/\s+/gu, " ")
    .trim();
}

function buildGrammar(raw: RawLesson, exercises: RawExercise[]): HskGrammarPoint[] {
  return exercises
    .filter((exercise) => exercise.sectionType === "writing" && exercise.part === 1)
    .slice(0, 3)
    .map((exercise) => {
      const prompt = writingPrompt(exercise);
      return {
        id: `${exercise.id}-sentence-order`,
        title: `Trật tự câu ${exercise.numberInSource}`,
        formula: prompt.split(/\s+/u).join(" + "),
        explanation: "Sắp xếp các thành phần được cung cấp thành một câu tiếng Trung hoàn chỉnh và tự nhiên.",
        examples: [{
          hanzi: prompt,
          pinyin: "",
          translation: "Các thành phần câu nguyên bản từ phần Viết của workbook.",
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
      instruction: meaningQuestion ? "Chọn nghĩa đúng của từ khóa" : "Chọn pinyin đúng của từ khóa",
      prompt: word.hanzi,
      options: uniqueOptions(vocabulary, index, select),
      answer: select(word),
    };
  });
}

function pronunciationTopics(
  raw: RawLesson,
  vocabulary: HskVocabularyItem[],
  exercises: RawExercise[],
): string[] {
  const listening = requireEntity(LISTENING_BLOCKS, raw.id, raw.id);
  const tracks = listening.audioTrackReferences.length
    ? listening.audioTrackReferences.join(" · ")
    : `Bài ${raw.number}`;
  const listeningQuestions = exercises
    .filter((exercise) => exercise.sectionType === "listening")
    .map((exercise) => `Câu nghe ${exercise.numberInSource}: ${exercise.optionsOcr
      .map((option) => `${option.label}. ${option.textOcr}`)
      .join(" · ")}`);
  return [
    `Nhận diện đáp án nghe theo các track ${tracks}`,
    ...listeningQuestions,
    `Từ khóa viết: ${vocabulary.map((word) => word.pinyin).join(" · ")}`,
  ];
}

function composeLesson(raw: RawLesson): HskLessonContent {
  const enriched = ENRICHMENT.lessons[raw.id];
  if (!enriched) throw new Error(`Bài HSK 5 workbook chưa có dữ liệu học bổ sung: ${raw.id}`);
  const sourceExercises = lessonExercises(raw);
  const vocabulary = toVocabulary(raw.id, enriched.vocabulary, sourceExercises);
  const grammar = buildGrammar(raw, sourceExercises);
  const dialogues = buildDialogues(raw, sourceExercises);
  const exercises = buildExercises(vocabulary);
  const writingBlock = requireEntity(WRITING_BLOCKS, raw.id, raw.id);
  if (!writingBlock.contentOcr.trim()) throw new Error(`Bài HSK 5 workbook thiếu phần viết: ${raw.id}`);

  return {
    id: raw.id,
    sourceId: raw.id,
    levelId: "hsk-5",
    levelLabel: "HSK 5",
    lessonNumber: raw.number,
    title: enriched.titleVi,
    greeting: raw.titleZh,
    summary: `${raw.exerciseCount} câu luyện Nghe – Đọc – Viết từ Sách bài tập HSK 5 - Tập 1, cùng ${vocabulary.length} từ khóa viết trọng tâm.`,
    minutes: 40,
    modes: ["vocabulary", "exercise", "pronunciation", "hanzi"],
    vocabulary,
    grammar,
    dialogues,
    pronunciationTopics: pronunciationTopics(raw, vocabulary, sourceExercises),
    exercises,
    writingCharacters: buildHskWritingCharacters(vocabulary),
    contentStatus: "review",
    languageReviewStatus: "pending",
    audioAvailable: false,
  };
}

export const HSK5_WORKBOOK_1_LESSONS = RAW_LESSONS.map(composeLesson);

const HSK5_WORKBOOK_1_LESSONS_BY_ID = new Map(
  HSK5_WORKBOOK_1_LESSONS.map((lesson) => [lesson.id, lesson]),
);

export function getHsk5Workbook1LessonContent(
  levelId: string,
  lessonId: string,
): HskLessonContent | undefined {
  if (levelId !== "hsk-5") return undefined;
  return HSK5_WORKBOOK_1_LESSONS_BY_ID.get(lessonId);
}

export const HSK5_WORKBOOK_1_UNIT_TITLES_VI = ENRICHMENT.unitTitlesVi;
