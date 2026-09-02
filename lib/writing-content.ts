import { HSK_CURRICULUM, type HskCurriculumLesson } from "./hsk-curriculum";
import { getHskLearningLessonContent } from "./hsk-learning-content";

export const WRITING_LEVEL_IDS = ["hsk-1", "hsk-2", "hsk-3", "hsk-4", "hsk-5", "hsk-6"] as const;

export type WritingLevelId = (typeof WRITING_LEVEL_IDS)[number];
export type WritingLevelLabel = `HSK ${1 | 2 | 3 | 4 | 5 | 6}`;

export type WritingCharacter = {
  id: string;
  hanzi: string;
  pinyin: string;
  meaning: string;
  strokes?: number;
};

export type WritingTopic = {
  slug: string;
  levelId: WritingLevelId;
  level: WritingLevelLabel;
  lessonNumber: number;
  sourceLabel: string;
  title: string;
  summary: string;
  duration: string;
  outcomes: string[];
  characters: WritingCharacter[];
};

export type WritingLevel = {
  id: WritingLevelId;
  label: WritingLevelLabel;
  description: string;
  lessonCount: number;
  characterCount: number;
  previewCharacters: string[];
};

export type WritingLessonSummary = {
  id: string;
  lessonNumber: number;
  sourceLabel: string;
  topicTitle: string;
  title: string;
  summary: string;
  minutes: number;
  characterCount: number;
  previewCharacters: string[];
};

function normalizeWritingLevelId(level: string): WritingLevelId | undefined {
  const normalized = level.startsWith("hsk-") ? level : `hsk-${level}`;
  return WRITING_LEVEL_IDS.find((levelId) => levelId === normalized);
}

function getAvailableCurriculumLessons(levelId: WritingLevelId) {
  const level = HSK_CURRICULUM.find((item) => item.id === levelId);
  if (!level) return [];

  return level.topics.flatMap((topic) => topic.lessons
    .filter((lesson) => lesson.available)
    .map((lesson) => ({ lesson, topicTitle: topic.title })));
}

function getSourceLabel(lesson: HskCurriculumLesson): string {
  return lesson.kind === "workbook" ? "Sách bài tập" : "Giáo trình";
}

export function getWritingLevels(): WritingLevel[] {
  return WRITING_LEVEL_IDS.map((levelId) => {
    const level = HSK_CURRICULUM.find((item) => item.id === levelId);
    if (!level) return undefined;

    const lessons = getAvailableCurriculumLessons(levelId);
    const previewCharacters = lessons
      .slice(0, 2)
      .flatMap(({ lesson }) => getHskLearningLessonContent(levelId, lesson.id)?.writingCharacters ?? [])
      .map((character) => character.hanzi)
      .filter((character, index, characters) => characters.indexOf(character) === index)
      .slice(0, 4);

    return {
      id: levelId,
      label: level.label as WritingLevelLabel,
      description: level.description,
      lessonCount: lessons.length,
      characterCount: lessons.reduce((total, { lesson }) => total + lesson.writing, 0),
      previewCharacters,
    };
  }).filter((level): level is WritingLevel => Boolean(level));
}

export function getWritingLevel(level: string): WritingLevel | undefined {
  const levelId = normalizeWritingLevelId(level);
  if (!levelId) return undefined;
  return getWritingLevels().find((item) => item.id === levelId);
}

export function getWritingLessons(level: string): WritingLessonSummary[] {
  const levelId = normalizeWritingLevelId(level);
  if (!levelId) return [];

  return getAvailableCurriculumLessons(levelId).flatMap(({ lesson, topicTitle }) => {
    const content = getHskLearningLessonContent(levelId, lesson.id);
    if (!content?.writingCharacters.length) return [];

    return [{
      id: lesson.id,
      lessonNumber: content.lessonNumber,
      sourceLabel: getSourceLabel(lesson),
      topicTitle,
      title: content.title,
      summary: content.summary,
      minutes: content.minutes,
      characterCount: content.writingCharacters.length,
      previewCharacters: content.writingCharacters.slice(0, 5).map((character) => character.hanzi),
    }];
  });
}

export function getWritingTopic(level: string, lessonId: string): WritingTopic | undefined {
  const levelId = normalizeWritingLevelId(level);
  if (!levelId) return undefined;

  const curriculumLesson = getAvailableCurriculumLessons(levelId)
    .find(({ lesson }) => lesson.id === lessonId)?.lesson;
  const lesson = getHskLearningLessonContent(levelId, lessonId);
  if (!curriculumLesson || !lesson?.writingCharacters.length) return undefined;

  return {
    slug: lesson.id,
    levelId,
    level: lesson.levelLabel as WritingLevelLabel,
    lessonNumber: lesson.lessonNumber,
    sourceLabel: getSourceLabel(curriculumLesson),
    title: lesson.title,
    summary: lesson.summary,
    duration: `${lesson.minutes} phút`,
    outcomes: [
      `Quan sát thứ tự nét của ${lesson.writingCharacters.length} chữ trong bài`,
      "Tô theo mẫu để ghi nhớ cấu trúc chữ",
      "Tự viết và nhận phản hồi ngay trên bàn luyện",
    ],
    characters: lesson.writingCharacters.map((character, index) => ({
      id: `${character.id}-${index}`,
      hanzi: character.hanzi,
      pinyin: character.pinyin,
      meaning: character.meaning,
    })),
  };
}

export function getWritingPracticeParams() {
  return WRITING_LEVEL_IDS.flatMap((level) => getAvailableCurriculumLessons(level)
    .map(({ lesson }) => ({ level, lesson: lesson.id })));
}
