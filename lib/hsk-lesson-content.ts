import assessmentData from "../content/hsk1-textbook-json/shared/assessment-items.json" with { type: "json" };
import dialogueData from "../content/hsk1-textbook-json/shared/dialogues.json" with { type: "json" };
import grammarData from "../content/hsk1-textbook-json/shared/grammar-points.json" with { type: "json" };
import lexemeData from "../content/hsk1-textbook-json/shared/lexemes.json" with { type: "json" };
import pronunciationData from "../content/hsk1-textbook-json/shared/pronunciation-topics.json" with { type: "json" };
import lesson01 from "../content/hsk1-textbook-json/lessons/lesson-01.json" with { type: "json" };
import lesson02 from "../content/hsk1-textbook-json/lessons/lesson-02.json" with { type: "json" };
import lesson03 from "../content/hsk1-textbook-json/lessons/lesson-03.json" with { type: "json" };
import lesson04 from "../content/hsk1-textbook-json/lessons/lesson-04.json" with { type: "json" };
import lesson05 from "../content/hsk1-textbook-json/lessons/lesson-05.json" with { type: "json" };
import lesson06 from "../content/hsk1-textbook-json/lessons/lesson-06.json" with { type: "json" };
import lesson07 from "../content/hsk1-textbook-json/lessons/lesson-07.json" with { type: "json" };
import lesson08 from "../content/hsk1-textbook-json/lessons/lesson-08.json" with { type: "json" };
import lesson09 from "../content/hsk1-textbook-json/lessons/lesson-09.json" with { type: "json" };
import lesson10 from "../content/hsk1-textbook-json/lessons/lesson-10.json" with { type: "json" };
import lesson11 from "../content/hsk1-textbook-json/lessons/lesson-11.json" with { type: "json" };
import lesson12 from "../content/hsk1-textbook-json/lessons/lesson-12.json" with { type: "json" };
import lesson13 from "../content/hsk1-textbook-json/lessons/lesson-13.json" with { type: "json" };
import lesson14 from "../content/hsk1-textbook-json/lessons/lesson-14.json" with { type: "json" };
import lesson15 from "../content/hsk1-textbook-json/lessons/lesson-15.json" with { type: "json" };

export type HskLessonMode = "vocabulary" | "exercise" | "pronunciation" | "hanzi";

export type HskVocabularyItem = {
  id: string;
  hanzi: string;
  pinyin: string;
  meaning: string;
  wordClass: string;
  example: string;
  examplePinyin: string;
  translation: string;
  radicals?: Array<{
    glyph: string;
    name: string;
    strokes: number;
    note: string;
  }>;
};

export type HskGrammarPoint = {
  id: string;
  title: string;
  formula: string;
  explanation: string;
  examples: Array<{
    hanzi: string;
    pinyin: string;
    translation: string;
  }>;
};

export type HskDialogueTurn = {
  speaker: string;
  hanzi: string;
  pinyin: string;
  translation: string;
};

export type HskDialogue = {
  id: string;
  title: string;
  setting: string;
  turns: HskDialogueTurn[];
};

export type HskExercise = {
  id: string;
  type: "meaning" | "listening" | "pinyin";
  instruction: string;
  prompt: string;
  pinyin?: string;
  note?: string;
  speakText?: string;
  options: string[];
  answer: string | null;
};

export type HskWritingCharacter = {
  id: string;
  word: string;
  hanzi: string;
  pinyin: string;
  meaning: string;
};

const HANZI_GLYPH_PATTERN = /[\u3400-\u9fff]/u;

export function buildHskWritingCharacters(
  vocabulary: HskVocabularyItem[],
): HskWritingCharacter[] {
  const usedGlyphs = new Set<string>();

  return vocabulary.map((word) => {
    const glyphs = Array.from(word.hanzi).filter((glyph) => HANZI_GLYPH_PATTERN.test(glyph));
    if (!glyphs.length) {
      throw new Error(`Từ vựng ${word.id} không có chữ Hán để tạo bài luyện viết`);
    }

    const unusedIndex = glyphs.findIndex((glyph) => !usedGlyphs.has(glyph));
    const glyphIndex = unusedIndex >= 0 ? unusedIndex : 0;
    const hanzi = glyphs[glyphIndex];
    const syllables = word.pinyin.split(/\s+/u).filter(Boolean);
    usedGlyphs.add(hanzi);

    return {
      id: word.id,
      word: word.hanzi,
      hanzi,
      pinyin: syllables[glyphIndex] ?? word.pinyin,
      meaning: word.meaning,
    };
  });
}

export type HskLessonContent = {
  id: string;
  sourceId: string;
  levelId: string;
  levelLabel: string;
  lessonNumber: number;
  title: string;
  greeting: string;
  summary: string;
  minutes: number;
  modes: HskLessonMode[];
  vocabulary: HskVocabularyItem[];
  grammar: HskGrammarPoint[];
  dialogues: HskDialogue[];
  pronunciationTopics: string[];
  exercises: HskExercise[];
  writingCharacters: HskWritingCharacter[];
  contentStatus: "draft" | "review" | "published" | "archived";
  languageReviewStatus: "pending" | "approved" | "changes-requested";
  audioAvailable: boolean;
  guidedPlaceholders?: Array<"vocabulary" | "dialogue" | "pronunciation" | "writing">;
};

type RawLessonSection = {
  type: string;
  itemRefs?: string[];
};

type RawLesson = {
  id: string;
  slug: string;
  status: HskLessonContent["contentStatus"];
  metadata: {
    levelId: string;
    lessonNumber: number;
    titleVi: string;
    heroHanzi: string;
    summaryVi: string;
    estimatedMinutes: number;
  };
  sections: RawLessonSection[];
  editorial: {
    languageReviewStatus: HskLessonContent["languageReviewStatus"];
  };
};

type RawLexeme = {
  id: string;
  simplified: string;
  pinyin: string;
  wordClass: string;
  senses: Array<{ meaningVi: string }>;
};

type RawDialogue = {
  id: string;
  titleVi: string;
  settingVi: string;
  speakers: Array<{ id: string; displayName: string }>;
  turns: Array<{
    speakerId: string;
    hanzi: string;
    pinyin: string;
    translationVi: string;
  }>;
};

type RawGrammarPoint = {
  id: string;
  titleVi: string;
  formula: string;
  explanationVi: string;
  exampleDialogueRefs: string[];
};

type RawAssessment = {
  id: string;
  type: "multiple-choice" | "select-pinyin";
  instructionVi: string;
  prompt: { ref: string };
  options: Array<{ id: string; text: string }>;
  correctResponse: { optionId: string };
};

type RawPronunciation = {
  id: string;
  topicsVi: string[];
  audioStatus: string;
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

const LEXEMES = new Map(
  (lexemeData.items as RawLexeme[]).map((item) => [`lexeme:${item.id}`, item]),
);
const DIALOGUES = new Map(
  (dialogueData.items as RawDialogue[]).map((item) => [`dialogue:${item.id}`, item]),
);
const GRAMMAR_POINTS = new Map(
  (grammarData.items as RawGrammarPoint[]).map((item) => [`grammar-point:${item.id}`, item]),
);
const ASSESSMENTS = new Map(
  (assessmentData.items as RawAssessment[]).map((item) => [`assessment-item:${item.id}`, item]),
);
const PRONUNCIATION_TOPICS = new Map(
  (pronunciationData.items as RawPronunciation[]).map((item) => [`pronunciation-topic:${item.id}`, item]),
);

const WORD_CLASS_LABELS: Record<string, string> = {
  adjective: "Tính từ",
  adverb: "Phó từ",
  conjunction: "Liên từ",
  interjection: "Thán từ",
  "measure-word": "Lượng từ",
  "modal-verb": "Động từ năng nguyện",
  noun: "Danh từ",
  particle: "Trợ từ",
  pattern: "Mẫu câu",
  phrase: "Cụm từ",
  preposition: "Giới từ",
  pronoun: "Đại từ",
  "proper-noun": "Danh từ riêng",
  quantity: "Cụm số lượng",
  verb: "Động từ",
  "verb-noun": "Động từ / danh từ",
};

const DERIVED_EXAMPLES: Record<string, Pick<HskVocabularyItem, "example" | "examplePinyin" | "translation">> = {
  "lex-hsk1-l13-03": {
    example: "我学习汉语。",
    examplePinyin: "wǒ xuéxí hànyǔ。",
    translation: "Tôi học tiếng Trung.",
  },
};

function requireEntity<T>(map: Map<string, T>, ref: string, context: string): T {
  const entity = map.get(ref);
  if (!entity) throw new Error(`Không tìm thấy ${ref} khi dựng ${context}`);
  return entity;
}

function getSectionRefs(lesson: RawLesson, type: string): string[] {
  return lesson.sections.find((section) => section.type === type)?.itemRefs ?? [];
}

function matchesLexemePattern(hanzi: string, lexeme: string): boolean {
  const parts = lexeme.split(/[…\.]+/u).filter(Boolean);
  let cursor = 0;
  return parts.every((part) => {
    const index = hanzi.indexOf(part, cursor);
    if (index < 0) return false;
    cursor = index + part.length;
    return true;
  });
}

function findVocabularyExample(
  lexeme: RawLexeme,
  dialogues: RawDialogue[],
): Pick<HskVocabularyItem, "example" | "examplePinyin" | "translation"> {
  const turn = dialogues
    .flatMap((dialogue) => dialogue.turns)
    .find((candidate) => matchesLexemePattern(candidate.hanzi, lexeme.simplified));
  if (turn) {
    return {
      example: turn.hanzi,
      examplePinyin: turn.pinyin,
      translation: turn.translationVi,
    };
  }
  return DERIVED_EXAMPLES[lexeme.id] ?? {
    example: lexeme.simplified,
    examplePinyin: lexeme.pinyin,
    translation: lexeme.senses[0]?.meaningVi ?? "",
  };
}

function toDialogue(raw: RawDialogue): HskDialogue {
  const speakers = new Map(raw.speakers.map((speaker) => [speaker.id, speaker.displayName]));
  return {
    id: raw.id,
    title: raw.titleVi,
    setting: raw.settingVi,
    turns: raw.turns.map((turn) => ({
      speaker: speakers.get(turn.speakerId) ?? turn.speakerId,
      hanzi: turn.hanzi,
      pinyin: turn.pinyin,
      translation: turn.translationVi,
    })),
  };
}

function toGrammarPoint(raw: RawGrammarPoint): HskGrammarPoint {
  const examples = raw.exampleDialogueRefs
    .flatMap((ref) => requireEntity(DIALOGUES, ref, raw.id).turns)
    .map((turn) => ({
      hanzi: turn.hanzi,
      pinyin: turn.pinyin,
      translation: turn.translationVi,
    }))
    .filter((example, index, items) => items.findIndex((item) => item.hanzi === example.hanzi) === index)
    .slice(0, 2);
  return {
    id: raw.id,
    title: raw.titleVi,
    formula: raw.formula,
    explanation: raw.explanationVi,
    examples,
  };
}

function toExercise(raw: RawAssessment): HskExercise {
  const lexeme = requireEntity(LEXEMES, raw.prompt.ref, raw.id);
  const correct = raw.options.find((option) => option.id === raw.correctResponse.optionId);
  if (!correct) throw new Error(`Đáp án của ${raw.id} không tồn tại trong danh sách lựa chọn`);
  return {
    id: raw.id,
    type: raw.type === "select-pinyin" ? "pinyin" : "meaning",
    instruction: raw.instructionVi,
    prompt: lexeme.simplified,
    options: raw.options.map((option) => option.text),
    answer: correct.text,
  };
}

function composeLesson(raw: RawLesson): HskLessonContent {
  const dialogues = getSectionRefs(raw, "dialogue").map((ref) =>
    requireEntity(DIALOGUES, ref, raw.id),
  );
  const pronunciation = getSectionRefs(raw, "pronunciation").map((ref) =>
    requireEntity(PRONUNCIATION_TOPICS, ref, raw.id),
  );
  const vocabulary = getSectionRefs(raw, "vocabulary").map((ref) => {
    const lexeme = requireEntity(LEXEMES, ref, raw.id);
    return {
      id: lexeme.id,
      hanzi: lexeme.simplified,
      pinyin: lexeme.pinyin,
      meaning: lexeme.senses[0]?.meaningVi ?? "",
      wordClass: WORD_CLASS_LABELS[lexeme.wordClass] ?? lexeme.wordClass,
      ...findVocabularyExample(lexeme, dialogues),
    };
  });
  return {
    id: raw.slug,
    sourceId: raw.id,
    levelId: raw.metadata.levelId,
    levelLabel: raw.metadata.levelId.toUpperCase().replace("-", " "),
    lessonNumber: raw.metadata.lessonNumber,
    title: raw.metadata.titleVi,
    greeting: raw.metadata.heroHanzi,
    summary: raw.metadata.summaryVi,
    minutes: raw.metadata.estimatedMinutes,
    modes: ["vocabulary", "exercise", "pronunciation", "hanzi"],
    vocabulary,
    grammar: getSectionRefs(raw, "grammar").map((ref) =>
      toGrammarPoint(requireEntity(GRAMMAR_POINTS, ref, raw.id)),
    ),
    dialogues: dialogues.map(toDialogue),
    pronunciationTopics: pronunciation.flatMap((item) => item.topicsVi),
    exercises: getSectionRefs(raw, "practice").map((ref) =>
      toExercise(requireEntity(ASSESSMENTS, ref, raw.id)),
    ),
    writingCharacters: buildHskWritingCharacters(vocabulary),
    contentStatus: raw.status,
    languageReviewStatus: raw.editorial.languageReviewStatus,
    audioAvailable: pronunciation.every((item) => item.audioStatus === "available"),
  };
}

export const HSK_LESSONS = RAW_LESSONS.map(composeLesson);

const HSK_LESSONS_BY_ID = new Map(
  HSK_LESSONS.flatMap((lesson) => [
    [lesson.id, lesson] as const,
    [lesson.sourceId, lesson] as const,
  ]),
);

const LEGACY_LESSON_ALIASES = new Map([
  ["hsk-1-lam-quen-lan-dau", "hsk1-bai-01-chao-anh"],
]);

export function getHskLessonContent(levelId: string, lessonId: string): HskLessonContent | undefined {
  if (levelId !== "hsk-1") return undefined;
  const canonicalId = LEGACY_LESSON_ALIASES.get(lessonId) ?? lessonId;
  return HSK_LESSONS_BY_ID.get(canonicalId);
}

export function normalizeHskLevelParam(level: string): string {
  return level.startsWith("hsk-") ? level : `hsk-${level}`;
}

export function getHskLessonHref(levelId: string, lessonId: string): string {
  return `/hsk/${levelId.replace(/^hsk-/, "")}/${lessonId}`;
}
