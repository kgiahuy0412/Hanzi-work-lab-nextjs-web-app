import type { ListeningLesson, ListeningLevel } from "./listening-content.ts";
import { buildListeningRound, type ListeningQuestion } from "./listening-session.ts";

export type ListeningView = "intro" | "session" | "complete";
export type ListeningAnswerStatus = "idle" | "correct" | "wrong";

export type ListeningStudioState = {
  view: ListeningView;
  selectedLevelId: string;
  selectedLessonId: string | null;
  round: ListeningQuestion[];
  questionIndex: number;
  score: number;
  selectedAnswer: string;
  answerStatus: ListeningAnswerStatus;
};

export function createInitialListeningState(levelId: string): ListeningStudioState {
  return {
    view: "intro",
    selectedLevelId: levelId,
    selectedLessonId: null,
    round: [],
    questionIndex: 0,
    score: 0,
    selectedAnswer: "",
    answerStatus: "idle",
  };
}

export function selectListeningLevel(
  state: ListeningStudioState,
  levelId: string,
): ListeningStudioState {
  return {
    ...createInitialListeningState(levelId),
    view: "intro",
  };
}

export function startListeningLesson(
  state: ListeningStudioState,
  level: ListeningLevel,
  lesson: ListeningLesson,
  random: () => number = Math.random,
): ListeningStudioState {
  if (lesson.levelId !== level.id) {
    throw new Error("Listening lesson does not belong to the selected level.");
  }

  return {
    ...state,
    view: "session",
    selectedLevelId: level.id,
    selectedLessonId: lesson.id,
    round: buildListeningRound(level, lesson, 10, random),
    questionIndex: 0,
    score: 0,
    selectedAnswer: "",
    answerStatus: "idle",
  };
}

export function answerListeningQuestion(
  state: ListeningStudioState,
  answer: string,
): ListeningStudioState {
  const question = state.round[state.questionIndex];
  if (state.view !== "session" || state.answerStatus !== "idle" || !question) return state;

  const correct = answer === question.word.hanzi;
  return {
    ...state,
    selectedAnswer: answer,
    answerStatus: correct ? "correct" : "wrong",
    score: correct ? state.score + 1 : state.score,
  };
}

export function advanceListeningQuestion(state: ListeningStudioState): ListeningStudioState {
  if (state.view !== "session" || state.answerStatus === "idle") return state;

  if (state.questionIndex === state.round.length - 1) {
    return { ...state, view: "complete" };
  }

  return {
    ...state,
    questionIndex: state.questionIndex + 1,
    selectedAnswer: "",
    answerStatus: "idle",
  };
}

export function leaveListeningSession(state: ListeningStudioState): ListeningStudioState {
  return {
    ...state,
    view: "intro",
    round: [],
    questionIndex: 0,
    score: 0,
    selectedAnswer: "",
    answerStatus: "idle",
  };
}
