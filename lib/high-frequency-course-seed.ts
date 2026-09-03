import highFrequencyTopicData from "../content/high-frequency-topics.json" with { type: "json" };
import type { DialogueLine, Vocabulary } from "./content-types.ts";
import type { CourseLessonSeed, CourseModuleSeed } from "./course-seed-types.ts";

type HighFrequencyWord = {
  id: string;
  hanzi: string;
  pinyin: string;
  meaning: string;
  audioUrl: string;
};

type HighFrequencySentence = {
  id: string;
  hanzi: string;
  pinyin: string;
  translation: string;
};

type HighFrequencyTopic = {
  id: string;
  group: string;
  titleVi: string;
  titleZh: string;
  color: string;
  words: HighFrequencyWord[];
  sentences: HighFrequencySentence[];
};

const topics = highFrequencyTopicData as HighFrequencyTopic[];
const DAILY_TOPIC_GROUP = "HF_UPGRADE_15_TOPICS";
const FREE_LESSON_COUNT = 6;

export const highFrequencyModules: CourseModuleSeed[] = [
  {
    slug: "giao-tiep-hang-ngay",
    title: "Giao tiếp hằng ngày",
    description: "15 chủ đề tần suất cao về thời gian, ăn uống, đi lại, gia đình, học tập và sinh hoạt.",
  },
  {
    slug: "giao-tiep-theo-tinh-huong",
    title: "Giao tiếp theo tình huống",
    description: "12 chủ đề thực dụng từ chào hỏi, phỏng vấn và công sở đến nhà máy, dịch vụ và thương mại điện tử.",
  },
];

function toSlug(value: string) {
  return value.toLowerCase().replaceAll("_", "-");
}

function findExample(word: HighFrequencyWord, sentences: HighFrequencySentence[]) {
  return sentences.find((sentence) => sentence.hanzi.includes(word.hanzi));
}

function toVocabulary(word: HighFrequencyWord, sentences: HighFrequencySentence[]): Vocabulary {
  const example = findExample(word, sentences);
  return {
    slug: toSlug(word.id),
    hanzi: word.hanzi,
    pinyin: word.pinyin,
    meaning: word.meaning,
    example: example?.hanzi ?? "",
    translation: example?.translation ?? "",
    audioUrl: word.audioUrl,
  };
}

function toPhrase(sentence: HighFrequencySentence, index: number): DialogueLine {
  return {
    speaker: `Câu ${String(index + 1).padStart(2, "0")}`,
    hanzi: sentence.hanzi,
    pinyin: sentence.pinyin,
    translation: sentence.translation,
  };
}

export const highFrequencyLessons: CourseLessonSeed[] = topics.map((topic, index) => ({
  moduleSlug: topic.group === DAILY_TOPIC_GROUP ? "giao-tiep-hang-ngay" : "giao-tiep-theo-tinh-huong",
  slug: topic.id,
  title: topic.titleVi,
  summary: `Học ${topic.words.length} từ vựng và luyện ${topic.sentences.length} câu tiếng Trung thường gặp trong chủ đề này.`,
  situation: topic.titleZh,
  estimatedMinutes: Math.ceil((topic.words.length + topic.sentences.length) / 2),
  isFree: index < FREE_LESSON_COUNT,
  vocabulary: topic.words.map((word) => toVocabulary(word, topic.sentences)),
  content: {
    dialogue: [],
    phrases: topic.sentences.map(toPhrase),
    notes: [],
  },
}));

export const highFrequencyCourseStats = {
  lessons: highFrequencyLessons.length,
  minutes: highFrequencyLessons.reduce((total, lesson) => total + lesson.estimatedMinutes, 0),
  freeLessons: highFrequencyLessons.filter((lesson) => lesson.isFree).length,
  vocabulary: highFrequencyLessons.reduce((total, lesson) => total + lesson.vocabulary.length, 0),
  sentences: highFrequencyLessons.reduce((total, lesson) => total + (lesson.content.phrases?.length ?? 0), 0),
  modules: highFrequencyModules.length,
};
