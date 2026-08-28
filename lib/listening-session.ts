import {
  getListeningLessonWords,
  type ListeningLesson,
  type ListeningLevel,
  type ListeningWord,
} from "./listening-content.ts";

export type ListeningQuestion = {
  id: string;
  word: ListeningWord;
  choices: string[];
};

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function buildListeningRound(
  level: ListeningLevel,
  lesson: ListeningLesson,
  length = 10,
  random: () => number = Math.random,
): ListeningQuestion[] {
  const lessonWords = getListeningLessonWords(level, lesson);
  const uniqueHanzi = new Set(level.words.map((word) => word.hanzi));

  if (lessonWords.length === 0) {
    throw new Error("Listening lesson has no valid words.");
  }
  if (uniqueHanzi.size < 4) {
    throw new Error("Listening level needs four unique Hanzi choices.");
  }

  const targets = shuffle(lessonWords, random);
  return Array.from({ length }, (_, index) => {
    const word = targets[index % targets.length];
    const distractors = shuffle(
      level.words.filter((candidate) => candidate.hanzi !== word.hanzi),
      random,
    ).map((candidate) => candidate.hanzi);
    const choices = shuffle([...new Set([word.hanzi, ...distractors])].slice(0, 4), random);

    return {
      id: `${lesson.id}-question-${index + 1}-${word.id}`,
      word,
      choices,
    };
  });
}
