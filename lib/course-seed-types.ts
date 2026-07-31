import type { LessonContent, Vocabulary } from "./content-types.ts";

export type CourseModuleSeed = {
  slug: string;
  title: string;
  description: string;
};

export type CourseLessonSeed = {
  moduleSlug: string;
  slug: string;
  title: string;
  summary: string;
  situation: string;
  estimatedMinutes: number;
  isFree: boolean;
  content: LessonContent;
  vocabulary: Vocabulary[];
};

export type CourseSeedBundle = {
  courseSlug: string;
  modules: CourseModuleSeed[];
  lessons: CourseLessonSeed[];
};
