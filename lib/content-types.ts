export type Course = {
  slug: string;
  category: string;
  title: string;
  chineseTitle: string;
  hanzi: string;
  description: string;
  lessons: number;
  minutes: number;
  freeLessons: number;
  level: string;
  color: string;
  ink: string;
  availability: "available" | "coming_soon";
};

export type Vocabulary = {
  slug: string;
  hanzi: string;
  pinyin: string;
  meaning: string;
  example: string;
  translation: string;
  audioUrl: string | null;
};

export type DialogueLine = {
  speaker: string;
  hanzi: string;
  pinyin: string;
  translation: string;
};

export type UsageNote = {
  title: string;
  pattern: string;
  explanation: string;
};

export type ChallengeQuestion = {
  prompt: string;
  options: string[];
  correctOption: number;
  explanation: string;
};

export type LessonChallenge = {
  title: string;
  description: string;
  passScore: number;
  questions: ChallengeQuestion[];
};

export type LessonContent = {
  dialogue: DialogueLine[];
  phrases?: DialogueLine[];
  notes: UsageNote[];
  challenge?: LessonChallenge;
};

export type LessonSummary = {
  slug: string;
  title: string;
  summary: string;
  situation: string;
  estimatedMinutes: number;
  isFree: boolean;
  order: number;
  moduleSlug: string;
  moduleTitle: string;
  moduleOrder: number;
};

export type LessonDetail = LessonSummary & LessonContent & {
  vocabulary: Vocabulary[];
};

export type LessonAccess = {
  allowed: boolean;
  source: "free" | "vip" | "vip_required";
};

export type LessonProgressState = {
  completionPercent: number;
  completedAt: string | null;
  lastOpenedAt: string;
};

export type LearningSummary = {
  completedLessons: number;
  openedLessons: number;
};
