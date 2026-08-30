import groupData from "../content/hsk2-workbook-json/shared/exercise-groups.json" with { type: "json" };
import itemData from "../content/hsk2-workbook-json/shared/exercise-items.json" with { type: "json" };
import mediaData from "../content/hsk2-workbook-json/shared/media-assets.json" with { type: "json" };
import sourcePageData from "../content/hsk2-workbook-json/shared/source-pages.json" with { type: "json" };
import lesson01 from "../content/hsk2-workbook-json/lessons/lesson-01.json" with { type: "json" };
import lesson02 from "../content/hsk2-workbook-json/lessons/lesson-02.json" with { type: "json" };
import lesson03 from "../content/hsk2-workbook-json/lessons/lesson-03.json" with { type: "json" };
import lesson04 from "../content/hsk2-workbook-json/lessons/lesson-04.json" with { type: "json" };
import lesson05 from "../content/hsk2-workbook-json/lessons/lesson-05.json" with { type: "json" };
import lesson06 from "../content/hsk2-workbook-json/lessons/lesson-06.json" with { type: "json" };
import lesson07 from "../content/hsk2-workbook-json/lessons/lesson-07.json" with { type: "json" };
import lesson08 from "../content/hsk2-workbook-json/lessons/lesson-08.json" with { type: "json" };
import lesson09 from "../content/hsk2-workbook-json/lessons/lesson-09.json" with { type: "json" };
import lesson10 from "../content/hsk2-workbook-json/lessons/lesson-10.json" with { type: "json" };
import lesson11 from "../content/hsk2-workbook-json/lessons/lesson-11.json" with { type: "json" };
import lesson12 from "../content/hsk2-workbook-json/lessons/lesson-12.json" with { type: "json" };
import lesson13 from "../content/hsk2-workbook-json/lessons/lesson-13.json" with { type: "json" };
import lesson14 from "../content/hsk2-workbook-json/lessons/lesson-14.json" with { type: "json" };
import lesson15 from "../content/hsk2-workbook-json/lessons/lesson-15.json" with { type: "json" };
import type { HskExercise, HskLessonContent } from "./hsk-lesson-content";

export type HskWorkbookSectionType = "listening" | "reading" | "pronunciation" | "hanzi";

export type HskWorkbookOption = {
  id: string;
  label: string;
  text: string;
  pinyin: string;
};

export type HskWorkbookItem = {
  id: string;
  questionNumber: number;
  exerciseType: string;
  promptStatus: "audio-only-not-supplied" | "printed-and-ocr-transcribed" | string;
  chineseSegments: string[];
  pinyinSegments: string[];
  options: HskWorkbookOption[];
  requiresAudio: boolean;
  requiresVisual: boolean;
  answerAvailable: boolean;
  transcriptionStatus: string;
  sourcePage: number | null;
};

export type HskWorkbookSourceLine = {
  id: string;
  page: number;
  rowIndex: number;
  text: string;
  confidence: number;
  containsChinese: boolean;
};

export type HskWorkbookGroup = {
  id: string;
  section: HskWorkbookSectionType;
  exerciseType: string;
  exerciseLabel: string;
  part: number | null;
  instructionZh: string;
  instructionVi: string;
  items: HskWorkbookItem[];
  optionBank: HskWorkbookOption[];
  requiresAudio: boolean;
  audioAvailable: boolean;
  requiresVisual: boolean;
  visualAvailable: boolean;
  transcriptionStatus: string;
  sourcePages: number[];
  sourceRowCount: number;
  sourceLines: HskWorkbookSourceLine[];
};

export type HskWorkbookSection = {
  id: string;
  type: HskWorkbookSectionType;
  label: string;
  groups: HskWorkbookGroup[];
  questionCount: number;
};

export type HskWorkbookLessonContent = {
  id: string;
  sourceId: string;
  levelId: "hsk-2";
  levelLabel: "HSK 2";
  lessonNumber: number;
  title: string;
  titleZh: string;
  pinyin: string;
  summary: string;
  sections: HskWorkbookSection[];
  totalGroups: number;
  totalQuestions: number;
  sourcePageRange: [number, number];
  contentStatus: "review";
  answerAvailable: boolean;
  previousLessonId: string | null;
  nextLessonId: string | null;
};

type RawOption = {
  id: string;
  label: string;
  textZh: string;
  pinyin: string;
};

type RawItem = {
  id: string;
  questionNumber: number;
  sourcePageRef: string;
  promptStatus: string;
  content: {
    printedChineseSegments: string[];
    derivedPinyin: string[];
    options: RawOption[];
  };
  answer: {
    status: string;
    correctResponse: unknown;
  };
  editorial: {
    transcriptionStatus: string;
  };
  exerciseType: string;
  requiresAudio: boolean;
  requiresVisual: boolean;
};

type RawGroup = {
  id: string;
  lessonRef: string;
  section: HskWorkbookSectionType;
  part?: number;
  exerciseType: string;
  instruction?: {
    zh: string;
    vi: string;
  };
  itemRefs?: string[];
  optionBank?: {
    status: string;
    options: RawOption[];
  } | null;
  requiresAudio?: boolean;
  audioRef?: string | null;
  requiresVisual?: boolean;
  visualAssetStatus?: string;
  transcriptionStatus?: string;
  sourcePageRefs?: string[];
  sourceRowIndexes?: number[];
  sourceRowsByPage?: Array<{ pageRef: string; rowIndexes: number[] }>;
};

type RawLesson = {
  id: string;
  lessonNumber: number;
  status: string;
  title: {
    zh: string;
    pinyin: string;
    vi: string;
  };
  source: {
    printedPages: [number, number];
  };
  sections: Array<{
    id: string;
    type: HskWorkbookSectionType;
    exerciseGroupRefs: string[];
  }>;
};

type RawMediaAsset = {
  id: string;
  availability: string;
};

type RawSourcePage = {
  id: string;
  pdfPage: number;
  rows: Array<{
    rowIndex: number;
    text: string;
    minConfidence: number;
    isNoise: boolean;
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
] as unknown as RawLesson[];

const RAW_GROUPS = (groupData as unknown as { groups: RawGroup[] }).groups;
const RAW_ITEMS = (itemData as unknown as { items: RawItem[] }).items;
const RAW_ASSETS = (mediaData as unknown as { assets: RawMediaAsset[] }).assets;
const RAW_SOURCE_PAGES = (sourcePageData as unknown as { pages: RawSourcePage[] }).pages;

const GROUPS = new Map(RAW_GROUPS.map((group) => [group.id, group]));
const ITEMS = new Map(RAW_ITEMS.map((item) => [item.id, item]));
const ASSETS = new Map(RAW_ASSETS.map((asset) => [asset.id, asset]));
const SOURCE_PAGES = new Map(RAW_SOURCE_PAGES.map((page) => [page.id, page]));

const SECTION_LABELS: Record<HskWorkbookSectionType, string> = {
  listening: "Nghe hiểu",
  reading: "Đọc hiểu",
  pronunciation: "Phát âm",
  hanzi: "Chữ Hán",
};

export const HSK_WORKBOOK_EXERCISE_LABELS: Record<string, string> = {
  "listen-judge-image": "Nghe và phán đoán hình",
  "listen-match-image": "Nghe và ghép hình",
  "listen-multiple-choice": "Nghe và chọn đáp án",
  "read-match-image": "Đọc và ghép hình",
  "fill-word-bank": "Điền từ vào chỗ trống",
  "semantic-true-false": "Đúng hay sai theo nội dung",
  "match-question-answer": "Ghép câu hỏi và trả lời",
  "pronunciation-practice": "Luyện phát âm",
  "radical-and-stroke-practice": "Bộ thủ và thứ tự nét",
};

function requireEntity<T>(entities: Map<string, T>, id: string, owner: string): T {
  const entity = entities.get(id);
  if (!entity) throw new Error(`${owner} tham chiếu dữ liệu không tồn tại: ${id}`);
  return entity;
}

function toOption(option: RawOption): HskWorkbookOption {
  return {
    id: option.id,
    label: option.label,
    text: option.textZh,
    pinyin: option.pinyin,
  };
}

function sourcePageNumber(ref: string | undefined): number | null {
  const match = ref?.match(/([0-9]{3})$/u);
  return match ? Number(match[1]) : null;
}

function toItem(raw: RawItem): HskWorkbookItem {
  return {
    id: raw.id,
    questionNumber: raw.questionNumber,
    exerciseType: raw.exerciseType,
    promptStatus: raw.promptStatus,
    chineseSegments: raw.content.printedChineseSegments,
    pinyinSegments: raw.content.derivedPinyin,
    options: raw.content.options.map(toOption),
    requiresAudio: raw.requiresAudio,
    requiresVisual: raw.requiresVisual,
    answerAvailable: raw.answer.status === "provided" && raw.answer.correctResponse !== null,
    transcriptionStatus: raw.editorial.transcriptionStatus,
    sourcePage: sourcePageNumber(raw.sourcePageRef),
  };
}

function countSourceRows(raw: RawGroup): number {
  const directRows = raw.sourceRowIndexes?.length ?? 0;
  const pageRows = raw.sourceRowsByPage?.reduce((total, page) => total + page.rowIndexes.length, 0) ?? 0;
  return directRows + pageRows;
}

function isSourceHeader(text: string): boolean {
  const normalized = text.replace(/\s+/gu, "").toLowerCase();
  return normalized === "hsk"
    || normalized === "g"
    || normalized.includes("标准教程2练习册")
    || normalized.includes("giaotrinhchuanhsk2sachbaitap")
    || normalized.includes("giaotrinhchuanhsk");
}

function sourceLine(pageRef: string, rowIndex: number): HskWorkbookSourceLine | null {
  const page = SOURCE_PAGES.get(pageRef);
  const row = page?.rows.find((candidate) => candidate.rowIndex === rowIndex);
  if (!page || !row || row.isNoise || isSourceHeader(row.text)) return null;
  return {
    id: `${pageRef}-row-${rowIndex}`,
    page: page.pdfPage,
    rowIndex,
    text: row.text,
    confidence: row.minConfidence,
    containsChinese: /[\u3400-\u9fff]/u.test(row.text),
  };
}

function getSourceLines(raw: RawGroup): HskWorkbookSourceLine[] {
  const lines: HskWorkbookSourceLine[] = [];
  const directPageRef = raw.sourcePageRefs?.[0];
  if (directPageRef) {
    for (const rowIndex of raw.sourceRowIndexes ?? []) {
      const line = sourceLine(directPageRef, rowIndex);
      if (line) lines.push(line);
    }
  }
  for (const pageRows of raw.sourceRowsByPage ?? []) {
    for (const rowIndex of pageRows.rowIndexes) {
      const line = sourceLine(pageRows.pageRef, rowIndex);
      if (line) lines.push(line);
    }
  }
  return lines;
}

function toGroup(raw: RawGroup): HskWorkbookGroup {
  const audioAsset = raw.audioRef ? ASSETS.get(raw.audioRef) : undefined;
  const sourceLines = getSourceLines(raw);
  return {
    id: raw.id,
    section: raw.section,
    exerciseType: raw.exerciseType,
    exerciseLabel: HSK_WORKBOOK_EXERCISE_LABELS[raw.exerciseType] ?? raw.exerciseType,
    part: raw.part ?? null,
    instructionZh: raw.instruction?.zh ?? SECTION_LABELS[raw.section],
    instructionVi: raw.instruction?.vi ?? HSK_WORKBOOK_EXERCISE_LABELS[raw.exerciseType] ?? SECTION_LABELS[raw.section],
    items: (raw.itemRefs ?? []).map((ref) => toItem(requireEntity(ITEMS, ref, raw.id))),
    optionBank: raw.optionBank?.options.map(toOption) ?? [],
    requiresAudio: raw.requiresAudio === true,
    audioAvailable: raw.requiresAudio !== true || audioAsset?.availability === "available",
    requiresVisual: raw.requiresVisual === true,
    visualAvailable: raw.requiresVisual !== true || raw.visualAssetStatus === "available",
    transcriptionStatus: raw.transcriptionStatus ?? raw.optionBank?.status ?? "ocr-needs-editorial-review",
    sourcePages: (raw.sourcePageRefs ?? [])
      .map(sourcePageNumber)
      .filter((page): page is number => page !== null),
    sourceRowCount: countSourceRows(raw),
    sourceLines,
  };
}

function composeLesson(raw: RawLesson, index: number): HskWorkbookLessonContent {
  const sections = raw.sections.map((section) => {
    const groups = section.exerciseGroupRefs.map((ref) => toGroup(requireEntity(GROUPS, ref, raw.id)));
    return {
      id: section.id,
      type: section.type,
      label: SECTION_LABELS[section.type],
      groups,
      questionCount: groups.reduce((total, group) => total + group.items.length, 0),
    };
  });
  return {
    id: raw.id,
    sourceId: raw.id,
    levelId: "hsk-2",
    levelLabel: "HSK 2",
    lessonNumber: raw.lessonNumber,
    title: raw.title.vi,
    titleZh: raw.title.zh,
    pinyin: raw.title.pinyin,
    summary: "Luyện nghe, đọc, phát âm và chữ Hán theo nội dung Sách bài tập Giáo trình chuẩn HSK 2.",
    sections,
    totalGroups: sections.reduce((total, section) => total + section.groups.length, 0),
    totalQuestions: sections.reduce((total, section) => total + section.questionCount, 0),
    sourcePageRange: raw.source.printedPages,
    contentStatus: "review",
    answerAvailable: sections.every((section) => section.groups.every((group) => group.items.every((item) => item.answerAvailable))),
    previousLessonId: RAW_LESSONS[index - 1]?.id ?? null,
    nextLessonId: RAW_LESSONS[index + 1]?.id ?? null,
  };
}

export const HSK_WORKBOOK_LESSONS = RAW_LESSONS.map(composeLesson);

function toLearningExercise(group: HskWorkbookGroup, item: HskWorkbookItem): HskExercise | null {
  if (group.requiresAudio || group.requiresVisual || !item.chineseSegments.length) return null;
  const options = item.options.length ? item.options : group.optionBank;
  return {
    id: item.id,
    type: "meaning",
    instruction: group.instructionVi,
    prompt: item.chineseSegments.join(""),
    pinyin: item.pinyinSegments.join(""),
    note: "Nội dung luyện đọc từ sách bài tập HSK 2.",
    options: options.map((option) => option.text),
    answer: null,
  };
}

function getPronunciationTopics(lesson: HskWorkbookLessonContent): string[] {
  return lesson.sections
    .filter((section) => section.type === "pronunciation")
    .flatMap((section) => section.groups)
    .flatMap((group) => group.sourceLines)
    .filter((line) => line.containsChinese)
    .map((line) => line.text.trim())
    .filter((text) => !/^(三、语音|第[一二三四]|第\d)/u.test(text))
    .filter((text, index, items) => text.length > 1 && items.indexOf(text) === index)
    .slice(0, 8);
}

function getWritingCharacters(lesson: HskWorkbookLessonContent) {
  const characters: string[] = [];
  const taggedCharacter = /[A-H]\s*([\u3400-\u9fff])/gu;
  const sourceLines = lesson.sections
    .filter((section) => section.type === "hanzi")
    .flatMap((section) => section.groups)
    .flatMap((group) => group.sourceLines);

  for (const line of sourceLines) {
    for (const match of line.text.matchAll(taggedCharacter)) {
      const hanzi = match[1];
      if (!characters.includes(hanzi)) characters.push(hanzi);
    }
  }

  return characters.slice(0, 8).map((hanzi, index) => ({
    id: `${lesson.id}-writing-${index + 1}`,
    word: hanzi,
    hanzi,
    pinyin: "—",
    meaning: "Chữ Hán trong phần luyện viết của bài.",
  }));
}

function toLearningLesson(lesson: HskWorkbookLessonContent): HskLessonContent {
  const exercises = lesson.sections
    .filter((section) => section.type === "reading")
    .flatMap((section) => section.groups)
    .flatMap((group) => group.items.map((item) => toLearningExercise(group, item)))
    .filter((item): item is HskExercise => item !== null);
  const pronunciationTopics = getPronunciationTopics(lesson);
  const writingCharacters = getWritingCharacters(lesson);

  return {
    id: lesson.id,
    sourceId: lesson.sourceId,
    levelId: lesson.levelId,
    levelLabel: lesson.levelLabel,
    lessonNumber: lesson.lessonNumber,
    title: lesson.title,
    greeting: lesson.titleZh,
    summary: "Luyện đọc và củng cố mẫu câu theo nội dung Sách bài tập Giáo trình chuẩn HSK 2.",
    minutes: Math.max(15, exercises.length),
    modes: ["exercise", "hanzi"],
    vocabulary: [],
    grammar: [],
    dialogues: [],
    pronunciationTopics,
    exercises,
    writingCharacters,
    contentStatus: lesson.contentStatus,
    languageReviewStatus: "pending",
    audioAvailable: false,
    guidedPlaceholders: ["vocabulary", "dialogue"],
  };
}

export const HSK_WORKBOOK_LEARNING_LESSONS = HSK_WORKBOOK_LESSONS.map(toLearningLesson);

const HSK_WORKBOOK_LESSONS_BY_ID = new Map(
  HSK_WORKBOOK_LESSONS.map((lesson) => [lesson.id, lesson]),
);

const HSK_WORKBOOK_LEARNING_LESSONS_BY_ID = new Map(
  HSK_WORKBOOK_LEARNING_LESSONS.map((lesson) => [lesson.id, lesson]),
);

export function getHskWorkbookLessonContent(
  levelId: string,
  lessonId: string,
): HskWorkbookLessonContent | undefined {
  if (levelId !== "hsk-2") return undefined;
  return HSK_WORKBOOK_LESSONS_BY_ID.get(lessonId);
}

export function getHskWorkbookLearningLessonContent(
  levelId: string,
  lessonId: string,
): HskLessonContent | undefined {
  if (levelId !== "hsk-2") return undefined;
  return HSK_WORKBOOK_LEARNING_LESSONS_BY_ID.get(lessonId);
}
