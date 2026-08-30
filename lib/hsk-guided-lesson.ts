import type { HskLessonContent } from "./hsk-lesson-content";

export type HskGuidedStepKind =
  | "introduction"
  | "vocabulary"
  | "grammar"
  | "dialogue"
  | "pronunciation"
  | "writing"
  | "practice"
  | "complete";

export type HskGuidedStep = {
  id: string;
  kind: HskGuidedStepKind;
  itemIndex?: number;
};

export type HskGuidedSection = {
  id: HskGuidedStepKind;
  label: string;
  count?: number;
  start: number;
};

const SECTION_LABELS: Array<[HskGuidedStepKind, string]> = [
  ["introduction", "Giới thiệu"],
  ["vocabulary", "Từ vựng"],
  ["grammar", "Ngữ pháp"],
  ["dialogue", "Hội thoại"],
  ["pronunciation", "Phát âm"],
  ["writing", "Luyện viết"],
  ["practice", "Luyện tập"],
  ["complete", "Hoàn thành"],
];

export function buildHskGuidedLessonSteps(lesson: HskLessonContent): HskGuidedStep[] {
  return [
    { id: "introduction", kind: "introduction" },
    ...lesson.vocabulary.map((word, itemIndex) => ({ id: `vocabulary-${word.id}`, kind: "vocabulary" as const, itemIndex })),
    ...lesson.grammar.map((point, itemIndex) => ({ id: `grammar-${point.id}`, kind: "grammar" as const, itemIndex })),
    ...lesson.dialogues.map((dialogue, itemIndex) => ({ id: `dialogue-${dialogue.id}`, kind: "dialogue" as const, itemIndex })),
    ...(lesson.pronunciationTopics.length ? [{ id: "pronunciation", kind: "pronunciation" as const }] : []),
    { id: "writing", kind: "writing" },
    ...lesson.exercises.map((exercise, itemIndex) => ({ id: `practice-${exercise.id}`, kind: "practice" as const, itemIndex })),
    { id: "complete", kind: "complete" },
  ];
}

export function buildHskGuidedSections(lesson: HskLessonContent): HskGuidedSection[] {
  const steps = buildHskGuidedLessonSteps(lesson);
  return SECTION_LABELS.flatMap(([id, label]) => {
    const start = steps.findIndex((step) => step.kind === id);
    if (start < 0) return [];
    const count = steps.filter((step) => step.kind === id).length;
    return [{ id, label, start, ...(count > 1 ? { count } : {}) }];
  });
}

export function getGuidedSectionForStep(step: HskGuidedStep): HskGuidedStepKind {
  return step.kind;
}
