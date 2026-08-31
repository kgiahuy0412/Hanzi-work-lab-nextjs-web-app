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
import hsk2CurriculumData from "../content/hsk2-textbook-json/curriculum.json" with { type: "json" };
import hsk2GrammarData from "../content/hsk2-textbook-json/shared/grammar-points.json" with { type: "json" };
import hsk2LexemeData from "../content/hsk2-textbook-json/shared/lexemes.json" with { type: "json" };
import hsk2SceneData from "../content/hsk2-textbook-json/shared/text-scenes.json" with { type: "json" };
import hsk3CurriculumData from "../content/hsk3-textbook-json/curriculum.json" with { type: "json" };
import hsk3GrammarData from "../content/hsk3-textbook-json/shared/grammar-blocks.json" with { type: "json" };
import hsk3LexemeData from "../content/hsk3-textbook-json/shared/lexemes.json" with { type: "json" };
import hsk3SceneData from "../content/hsk3-textbook-json/shared/text-scenes.json" with { type: "json" };
import hsk4LowerCurriculumData from "../content/hsk4-lower-textbook-json/curriculum.json" with { type: "json" };
import hsk4LowerLexemeData from "../content/hsk4-lower-textbook-json/shared/lexemes.json" with { type: "json" };
import hsk4LowerTextData from "../content/hsk4-lower-textbook-json/shared/texts.json" with { type: "json" };
import hsk4UpperCurriculumData from "../content/hsk4-upper-textbook-json/curriculum.json" with { type: "json" };
import hsk4UpperLexemeData from "../content/hsk4-upper-textbook-json/shared/lexemes.json" with { type: "json" };
import hsk4UpperTextData from "../content/hsk4-upper-textbook-json/shared/texts.json" with { type: "json" };
import hsk5LowerCurriculumData from "../content/hsk5-lower-textbook-json/curriculum.json" with { type: "json" };
import hsk5Workbook1CurriculumData from "../content/hsk5-workbook-1-json/curriculum.json" with { type: "json" };
import hsk6Volume1CurriculumData from "../content/hsk6-textbook-1-json/curriculum.json" with { type: "json" };
import hsk6Volume2CurriculumData from "../content/hsk6-volume2-textbook-json/curriculum.json" with { type: "json" };
import { HSK5_LOWER_TEXTBOOK_LESSONS } from "./hsk5-lower-textbook-content.ts";
import {
  HSK5_WORKBOOK_1_LESSONS,
  HSK5_WORKBOOK_1_UNIT_TITLES_VI,
} from "./hsk5-workbook-1-content.ts";
import { HSK6_VOLUME1_TEXTBOOK_LESSONS } from "./hsk6-volume1-textbook-content.ts";
import { HSK6_VOLUME2_TEXTBOOK_LESSONS } from "./hsk6-volume2-textbook-content.ts";

export type HskTopicIcon = "message" | "people" | "clock" | "food" | "travel" | "work" | "book" | "globe";

export type HskCurriculumLesson = {
  id: string;
  lessonNumber: number;
  title: string;
  kind?: "textbook" | "workbook";
  vocabulary: number;
  grammar: number;
  dialogues: number;
  writing: number;
  listening?: number;
  reading?: number;
  exercises?: number;
  scoredExercises?: boolean;
  minutes: number;
  guidedSteps: number;
  available: boolean;
};

export type HskCurriculumTopic = {
  id: string;
  title: string;
  icon: HskTopicIcon;
  lessons: HskCurriculumLesson[];
};

export type HskCurriculumLevel = {
  id: string;
  label: string;
  symbol: string;
  description: string;
  topics: HskCurriculumTopic[];
};

function toSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function makeLessons(
  levelId: string,
  titles: string[],
  baseVocabulary: number,
): HskCurriculumLesson[] {
  return titles.map((title, index) => ({
    id: `${levelId}-${toSlug(title)}`,
    lessonNumber: index + 1,
    title,
    vocabulary: baseVocabulary + (index % 3),
    grammar: 2 + (index % 2),
    dialogues: 1 + (index % 2),
    writing: baseVocabulary + (index % 3),
    minutes: 12 + (index % 3),
    guidedSteps: 0,
    available: false,
  }));
}

function makeTopic(
  levelId: string,
  id: string,
  title: string,
  icon: HskTopicIcon,
  lessonTitles: string[],
  baseVocabulary: number,
): HskCurriculumTopic {
  return {
    id,
    title,
    icon,
    lessons: makeLessons(levelId, lessonTitles, baseVocabulary),
  };
}

type RawTextbookLesson = {
  slug: string;
  metadata: {
    lessonNumber: number;
    titleVi: string;
    estimatedMinutes: number;
  };
  sections: Array<{
    type: string;
    itemRefs?: string[];
  }>;
};

const RAW_HSK_1_LESSONS = [
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
] as unknown as RawTextbookLesson[];

function sectionCount(lesson: RawTextbookLesson, type: string): number {
  return lesson.sections.find((section) => section.type === type)?.itemRefs?.length ?? 0;
}

const HSK_1_TEXTBOOK_LESSONS: HskCurriculumLesson[] = RAW_HSK_1_LESSONS.map((lesson) => {
  const vocabulary = sectionCount(lesson, "vocabulary");
  const grammar = sectionCount(lesson, "grammar");
  const dialogues = sectionCount(lesson, "dialogue");
  const writing = vocabulary;
  const assessments = sectionCount(lesson, "practice");
  const pronunciationSteps = sectionCount(lesson, "pronunciation") > 0 ? 1 : 0;
  return {
    id: lesson.slug,
    lessonNumber: lesson.metadata.lessonNumber,
    title: lesson.metadata.titleVi,
    kind: "textbook",
    vocabulary,
    grammar,
    dialogues,
    writing,
    minutes: lesson.metadata.estimatedMinutes,
    guidedSteps: vocabulary + grammar + dialogues + pronunciationSteps + assessments + 3,
    available: true,
  };
});

type RawHsk2Curriculum = {
  lessons: Array<{
    lessonNumber: number;
    titleVi: string;
  }>;
};

type RawHsk2Entity = {
  lessonRef: string;
};

type RawHsk2Scene = RawHsk2Entity & {
  lines: Array<unknown>;
};

const RAW_HSK_2_CURRICULUM = hsk2CurriculumData as unknown as RawHsk2Curriculum;
const RAW_HSK_2_LEXEMES = (hsk2LexemeData as unknown as { lexemes: RawHsk2Entity[] }).lexemes;
const RAW_HSK_2_SCENES = (hsk2SceneData as unknown as { scenes: RawHsk2Scene[] }).scenes;
const RAW_HSK_2_GRAMMAR = (hsk2GrammarData as unknown as { grammarPoints: RawHsk2Entity[] }).grammarPoints;

const HSK_2_TEXTBOOK_LESSONS: HskCurriculumLesson[] = RAW_HSK_2_CURRICULUM.lessons.map((lesson) => {
  const id = `hsk2-tb-lesson-${String(lesson.lessonNumber).padStart(2, "0")}`;
  const vocabulary = RAW_HSK_2_LEXEMES.filter((item) => item.lessonRef === id).length;
  const dialogues = RAW_HSK_2_SCENES.filter((item) => item.lessonRef === id && item.lines.length > 0).length;
  const grammar = RAW_HSK_2_GRAMMAR.filter((item) => item.lessonRef === id).length;
  const exercises = 4;
  const writing = vocabulary;
  return {
    id,
    lessonNumber: lesson.lessonNumber,
    title: lesson.titleVi,
    kind: "textbook",
    vocabulary,
    grammar,
    dialogues,
    writing,
    exercises,
    minutes: Math.max(25, Math.min(30, 24 + Math.ceil(vocabulary / 4))),
    guidedSteps: vocabulary + grammar + dialogues + exercises + 4,
    available: true,
  };
});

type RawHsk3Curriculum = {
  lessons: Array<{
    lessonNumber: number;
    titleVi: string;
  }>;
};

type RawHsk3Entity = {
  lessonRef: string;
};

type RawHsk3Scene = RawHsk3Entity & {
  lines: Array<unknown>;
};

const RAW_HSK_3_CURRICULUM = hsk3CurriculumData as unknown as RawHsk3Curriculum;
const RAW_HSK_3_LEXEMES = (hsk3LexemeData as unknown as { lexemes: RawHsk3Entity[] }).lexemes;
const RAW_HSK_3_SCENES = (hsk3SceneData as unknown as { scenes: RawHsk3Scene[] }).scenes;
const RAW_HSK_3_GRAMMAR = (hsk3GrammarData as unknown as { blocks: RawHsk3Entity[] }).blocks;

const HSK_3_TEXTBOOK_LESSONS: HskCurriculumLesson[] = RAW_HSK_3_CURRICULUM.lessons.map((lesson) => {
  const id = `hsk3-tb-lesson-${String(lesson.lessonNumber).padStart(2, "0")}`;
  const vocabulary = RAW_HSK_3_LEXEMES.filter((item) => item.lessonRef === id).length;
  const dialogues = RAW_HSK_3_SCENES.filter((item) => item.lessonRef === id && item.lines.length > 0).length;
  const grammar = RAW_HSK_3_GRAMMAR.filter((item) => item.lessonRef === id).length;
  const exercises = 4;
  const writing = vocabulary;
  const guidedDialogueSteps = dialogues || 1;
  return {
    id,
    lessonNumber: lesson.lessonNumber,
    title: lesson.titleVi,
    kind: "textbook",
    vocabulary,
    grammar,
    dialogues,
    writing,
    exercises,
    minutes: Math.max(25, Math.min(35, 20 + Math.ceil(vocabulary / 3))),
    guidedSteps: vocabulary + grammar + guidedDialogueSteps + exercises + 4,
    available: true,
  };
});

type RawHsk4Curriculum = {
  lessons: Array<{
    lessonNumber: number;
    titleVi: string;
  }>;
};

function buildHsk4TextbookLessons(
  curriculum: RawHsk4Curriculum,
  lexemes: RawHsk3Entity[],
  texts: RawHsk3Entity[],
  volumePrefix: "hsk4u" | "hsk4l",
): HskCurriculumLesson[] {
  return curriculum.lessons.map((lesson) => {
    const id = `${volumePrefix}-tb-lesson-${String(lesson.lessonNumber).padStart(2, "0")}`;
    const vocabulary = lexemes.filter((item) => item.lessonRef === id).length;
    const dialogues = texts.filter((item) => item.lessonRef === id).length;
    const grammar = 5;
    const exercises = 4;
    const writing = vocabulary;
    return {
      id,
      lessonNumber: lesson.lessonNumber,
      title: lesson.titleVi,
      kind: "textbook",
      vocabulary,
      grammar,
      dialogues,
      writing,
      exercises,
      minutes: Math.max(35, Math.min(45, 25 + Math.ceil(vocabulary / 3))),
      guidedSteps: vocabulary + grammar + dialogues + exercises + 4,
      available: true,
    };
  });
}

const RAW_HSK_4_UPPER_CURRICULUM = hsk4UpperCurriculumData as unknown as RawHsk4Curriculum;
const RAW_HSK_4_UPPER_LEXEMES = (hsk4UpperLexemeData as unknown as { lexemes: RawHsk3Entity[] }).lexemes;
const RAW_HSK_4_UPPER_TEXTS = (hsk4UpperTextData as unknown as { texts: RawHsk3Entity[] }).texts;
const RAW_HSK_4_LOWER_CURRICULUM = hsk4LowerCurriculumData as unknown as RawHsk4Curriculum;
const RAW_HSK_4_LOWER_LEXEMES = (hsk4LowerLexemeData as unknown as { lexemes: RawHsk3Entity[] }).lexemes;
const RAW_HSK_4_LOWER_TEXTS = (hsk4LowerTextData as unknown as { texts: RawHsk3Entity[] }).texts;

const HSK_4_TEXTBOOK_LESSONS: HskCurriculumLesson[] = [
  ...buildHsk4TextbookLessons(
    RAW_HSK_4_UPPER_CURRICULUM,
    RAW_HSK_4_UPPER_LEXEMES,
    RAW_HSK_4_UPPER_TEXTS,
    "hsk4u",
  ),
  ...buildHsk4TextbookLessons(
    RAW_HSK_4_LOWER_CURRICULUM,
    RAW_HSK_4_LOWER_LEXEMES,
    RAW_HSK_4_LOWER_TEXTS,
    "hsk4l",
  ),
];

type RawHsk5Curriculum = {
  units: Array<{
    id: string;
    titleVi: string;
    lessonIds: string[];
  }>;
};

const RAW_HSK_5_CURRICULUM = hsk5LowerCurriculumData as unknown as RawHsk5Curriculum;
const HSK_5_LESSONS_BY_ID = new Map(
  HSK5_LOWER_TEXTBOOK_LESSONS.map((lesson) => [lesson.id, lesson]),
);
const HSK_5_TOPIC_ICONS: HskTopicIcon[] = ["food", "book", "people", "work", "globe", "travel"];

const HSK_5_TEXTBOOK_TOPICS: HskCurriculumTopic[] = RAW_HSK_5_CURRICULUM.units.map((unit, index) => ({
  id: unit.id,
  title: unit.titleVi,
  icon: HSK_5_TOPIC_ICONS[index % HSK_5_TOPIC_ICONS.length],
  lessons: unit.lessonIds.map((lessonId) => {
    const lesson = HSK_5_LESSONS_BY_ID.get(lessonId);
    if (!lesson) throw new Error(`Chủ đề HSK 5 tham chiếu bài học không tồn tại: ${lessonId}`);
    return {
      id: lesson.id,
      lessonNumber: lesson.lessonNumber,
      title: lesson.title,
      kind: "textbook" as const,
      vocabulary: lesson.vocabulary.length,
      grammar: lesson.grammar.length,
      dialogues: lesson.dialogues.length,
      writing: lesson.writingCharacters.length,
      exercises: lesson.exercises.length,
      minutes: lesson.minutes,
      guidedSteps: lesson.vocabulary.length
        + lesson.grammar.length
        + lesson.dialogues.length
        + lesson.exercises.length
        + 4,
      available: true,
    };
  }),
}));

type RawHsk5WorkbookCurriculum = {
  units: Array<{
    id: string;
    titleZh: string;
    lessonIds: string[];
  }>;
};

const RAW_HSK_5_WORKBOOK_1_CURRICULUM = hsk5Workbook1CurriculumData as unknown as RawHsk5WorkbookCurriculum;
const HSK_5_WORKBOOK_1_LESSONS_BY_ID = new Map(
  HSK5_WORKBOOK_1_LESSONS.map((lesson) => [lesson.id, lesson]),
);

const HSK_5_WORKBOOK_1_TOPICS: HskCurriculumTopic[] = RAW_HSK_5_WORKBOOK_1_CURRICULUM.units.map((unit, index) => ({
  id: unit.id,
  title: HSK5_WORKBOOK_1_UNIT_TITLES_VI[unit.id] ?? unit.titleZh,
  icon: HSK_5_TOPIC_ICONS[index % HSK_5_TOPIC_ICONS.length],
  lessons: unit.lessonIds.map((lessonId) => {
    const lesson = HSK_5_WORKBOOK_1_LESSONS_BY_ID.get(lessonId);
    if (!lesson) throw new Error(`Chủ đề HSK 5 workbook tham chiếu bài học không tồn tại: ${lessonId}`);
    return {
      id: lesson.id,
      lessonNumber: lesson.lessonNumber,
      title: lesson.title,
      kind: "workbook" as const,
      vocabulary: lesson.vocabulary.length,
      grammar: lesson.grammar.length,
      dialogues: lesson.dialogues.length,
      writing: lesson.writingCharacters.length,
      listening: 14,
      reading: 14,
      exercises: lesson.exercises.length,
      scoredExercises: true,
      minutes: lesson.minutes,
      guidedSteps: lesson.vocabulary.length
        + lesson.grammar.length
        + lesson.dialogues.length
        + lesson.exercises.length
        + 4,
      available: true,
    };
  }),
}));

type RawHsk6Curriculum = {
  themes: Array<{
    id: string;
    titleVi: string;
    lessonRefs: string[];
  }>;
};

type RawHsk6Volume1Curriculum = {
  units: Array<{
    id: string;
    titleVi: string;
    lessonIds: string[];
  }>;
};

const RAW_HSK_6_VOLUME_1_CURRICULUM = hsk6Volume1CurriculumData as unknown as RawHsk6Volume1Curriculum;
const RAW_HSK_6_VOLUME_2_CURRICULUM = hsk6Volume2CurriculumData as unknown as RawHsk6Curriculum;
const HSK_6_VOLUME_1_LESSONS_BY_ID = new Map(
  HSK6_VOLUME1_TEXTBOOK_LESSONS.map((lesson) => [lesson.id, lesson]),
);
const HSK_6_VOLUME_2_LESSONS_BY_ID = new Map(
  HSK6_VOLUME2_TEXTBOOK_LESSONS.map((lesson) => [lesson.id, lesson]),
);
const HSK_6_TOPIC_ICONS: HskTopicIcon[] = ["globe", "book", "people", "travel", "message"];

function hsk6CurriculumLesson(lesson: (typeof HSK6_VOLUME1_TEXTBOOK_LESSONS)[number]) {
  return {
    id: lesson.id,
    lessonNumber: lesson.lessonNumber,
    title: lesson.title,
    kind: "textbook" as const,
    vocabulary: lesson.vocabulary.length,
    grammar: lesson.grammar.length,
    dialogues: lesson.dialogues.length,
    writing: lesson.writingCharacters.length,
    exercises: lesson.exercises.length,
    minutes: lesson.minutes,
    guidedSteps: lesson.vocabulary.length
      + lesson.grammar.length
      + lesson.dialogues.length
      + lesson.exercises.length
      + 4,
    available: true,
  };
}

const HSK_6_VOLUME_1_TOPICS: HskCurriculumTopic[] = RAW_HSK_6_VOLUME_1_CURRICULUM.units.map((unit, index) => ({
  id: unit.id,
  title: unit.titleVi,
  icon: HSK_6_TOPIC_ICONS[index % HSK_6_TOPIC_ICONS.length],
  lessons: unit.lessonIds.map((lessonId) => {
    const lesson = HSK_6_VOLUME_1_LESSONS_BY_ID.get(lessonId);
    if (!lesson) throw new Error(`Chủ đề HSK 6 Tập 1 tham chiếu bài học không tồn tại: ${lessonId}`);
    return hsk6CurriculumLesson(lesson);
  }),
}));

const HSK_6_VOLUME_2_TOPICS: HskCurriculumTopic[] = RAW_HSK_6_VOLUME_2_CURRICULUM.themes.map((theme, index) => ({
  id: theme.id,
  title: theme.titleVi,
  icon: HSK_6_TOPIC_ICONS[index % HSK_6_TOPIC_ICONS.length],
  lessons: theme.lessonRefs.map((lessonId) => {
    const lesson = HSK_6_VOLUME_2_LESSONS_BY_ID.get(lessonId);
    if (!lesson) throw new Error(`Chủ đề HSK 6 tham chiếu bài học không tồn tại: ${lessonId}`);
    return hsk6CurriculumLesson(lesson);
  }),
}));

function hsk2TextbookTopic(
  id: string,
  title: string,
  icon: HskTopicIcon,
  startIndex: number,
  endIndex: number,
): HskCurriculumTopic {
  return {
    id,
    title,
    icon,
    lessons: HSK_2_TEXTBOOK_LESSONS.slice(startIndex, endIndex),
  };
}

function hsk3TextbookTopic(
  id: string,
  title: string,
  icon: HskTopicIcon,
  startIndex: number,
  endIndex: number,
): HskCurriculumTopic {
  return {
    id,
    title,
    icon,
    lessons: HSK_3_TEXTBOOK_LESSONS.slice(startIndex, endIndex),
  };
}

function hsk4TextbookTopic(
  id: string,
  title: string,
  icon: HskTopicIcon,
  startIndex: number,
  endIndex: number,
): HskCurriculumTopic {
  return {
    id,
    title,
    icon,
    lessons: HSK_4_TEXTBOOK_LESSONS.slice(startIndex, endIndex),
  };
}

function textbookTopic(
  id: string,
  title: string,
  icon: HskTopicIcon,
  startIndex: number,
  endIndex: number,
): HskCurriculumTopic {
  return {
    id,
    title,
    icon,
    lessons: HSK_1_TEXTBOOK_LESSONS.slice(startIndex, endIndex),
  };
}

export const HSK_CURRICULUM: HskCurriculumLevel[] = [
  {
    id: "hsk-1",
    label: "HSK 1",
    symbol: "壹",
    description: "15 bài từ Giáo trình chuẩn HSK 1, từ chào hỏi đến giao tiếp hằng ngày.",
    topics: [
      textbookTopic("nen-tang-lam-quen", "Nền tảng & Làm quen", "message", 0, 5),
      textbookTopic("giao-tiep-hang-ngay", "Giao tiếp hằng ngày", "people", 5, 10),
      textbookTopic("thoi-gian-hoat-dong", "Thời gian & Hoạt động", "clock", 10, 15),
    ],
  },
  {
    id: "hsk-2",
    label: "HSK 2",
    symbol: "贰",
    description: "15 bài từ Giáo trình chuẩn HSK 2, có từ vựng, bài khóa, ngữ pháp, phát âm, luyện viết và bài tập tương tác như HSK 1.",
    topics: [
      hsk2TextbookTopic("du-lich-cong-viec-mua-sam", "Du lịch, công việc & mua sắm", "travel", 0, 5),
      hsk2TextbookTopic("sinh-hoat-di-chuyen-ke-hoach", "Sinh hoạt, di chuyển & kế hoạch", "clock", 5, 10),
      hsk2TextbookTopic("so-sanh-trang-thai-trai-nghiem", "So sánh, trạng thái & trải nghiệm", "message", 10, 15),
    ],
  },
  {
    id: "hsk-3",
    label: "HSK 3",
    symbol: "叁",
    description: "20 bài từ Giáo trình chuẩn HSK 3, có từ vựng, bài khóa, ngữ pháp, phát âm, luyện viết và bài tập tương tác.",
    topics: [
      hsk3TextbookTopic("ke-hoach-sinh-hoat", "Kế hoạch & Sinh hoạt", "clock", 0, 5),
      hsk3TextbookTopic("di-chuyen-so-sanh", "Di chuyển & So sánh", "travel", 5, 10),
      hsk3TextbookTopic("cong-viec-trai-nghiem", "Công việc & Trải nghiệm", "work", 10, 15),
      hsk3TextbookTopic("quan-diem-anh-huong", "Quan điểm & Ảnh hưởng", "message", 15, 20),
    ],
  },
  {
    id: "hsk-4",
    label: "HSK 4",
    symbol: "肆",
    description: "20 bài từ Giáo trình chuẩn HSK 4 - Tập 1 và Tập 2, có từ vựng, bài khóa, ngữ pháp, phát âm, luyện viết và bài tập tương tác.",
    topics: [
      hsk4TextbookTopic("tinh-cam-cong-viec-lua-chon", "Tình cảm, công việc & lựa chọn", "people", 0, 5),
      hsk4TextbookTopic("suc-khoe-cuoc-song-hanh-phuc", "Sức khỏe, cuộc sống & hạnh phúc", "globe", 5, 10),
      hsk4TextbookTopic("tri-thuc-van-hoa-moi-truong", "Tri thức, văn hóa & môi trường", "book", 10, 15),
      hsk4TextbookTopic("cuoc-song-cong-nghe-thien-nhien", "Cuộc sống, công nghệ & thiên nhiên", "globe", 15, 20),
    ],
  },
  {
    id: "hsk-5",
    label: "HSK 5",
    symbol: "伍",
    description: "18 bài Sách bài tập HSK 5 - Tập 1 và 18 bài Giáo trình chuẩn HSK 5 - Tập 2, có đầy đủ các chế độ học tương tác.",
    topics: [...HSK_5_WORKBOOK_1_TOPICS, ...HSK_5_TEXTBOOK_TOPICS],
  },
  {
    id: "hsk-6",
    label: "HSK 6",
    symbol: "陆",
    description: "40 bài từ Giáo trình chuẩn HSK 6 - Tập 1 và Tập 2, có từ vựng, bài khóa, điểm ngôn ngữ, phát âm, luyện viết và bài tập tương tác.",
    topics: [...HSK_6_VOLUME_1_TOPICS, ...HSK_6_VOLUME_2_TOPICS],
  },
  {
    id: "hsk-7-9",
    label: "HSK 7–9",
    symbol: "柒",
    description: "Vận dụng tiếng Trung trong nghiên cứu và bối cảnh chuyên môn phức tạp.",
    topics: [
      makeTopic("hsk-7-9", "nghien-cuu-chuyen-sau", "Nghiên cứu chuyên sâu", "book", ["Đặt câu hỏi nghiên cứu", "Đọc tài liệu chuyên ngành", "Phân tích phương pháp", "Trình bày phát hiện"], 28),
      makeTopic("hsk-7-9", "dam-phan-ngoai-giao", "Đàm phán & Ngoại giao", "people", ["Xác lập lợi ích", "Đọc hàm ý", "Xử lý bế tắc", "Soạn thỏa thuận"], 27),
      makeTopic("hsk-7-9", "kinh-te-vi-mo", "Kinh tế vĩ mô", "work", ["Đọc chỉ báo kinh tế", "Phân tích chu kỳ", "Đánh giá chính sách", "Dự báo kịch bản"], 28),
      makeTopic("hsk-7-9", "khoa-hoc-cong-nghe", "Khoa học & Công nghệ", "globe", ["Mô tả đổi mới", "Phân tích tác động", "Tranh luận đạo đức", "Viết báo cáo chuyên môn"], 29),
    ],
  },
];

export function getHskCurriculumLevel(levelId: string) {
  return HSK_CURRICULUM.find((level) => level.id === levelId);
}
