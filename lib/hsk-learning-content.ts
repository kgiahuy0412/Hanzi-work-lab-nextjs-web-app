import { getHskLessonContent, normalizeHskLevelParam } from "./hsk-lesson-content";
import { getHsk2TextbookLessonContent } from "./hsk2-textbook-content";
import { getHsk3TextbookLessonContent } from "./hsk3-textbook-content";
import { getHsk4TextbookLessonContent } from "./hsk4-textbook-content";
import { getHsk4UpperTextbookLessonContent } from "./hsk4-upper-textbook-content";
import { getHsk5LowerTextbookLessonContent } from "./hsk5-lower-textbook-content";

export function getHskLearningLessonContent(level: string, lessonId: string) {
  const levelId = normalizeHskLevelParam(level);
  return getHskLessonContent(levelId, lessonId)
    ?? getHsk2TextbookLessonContent(levelId, lessonId)
    ?? getHsk3TextbookLessonContent(levelId, lessonId)
    ?? getHsk4UpperTextbookLessonContent(levelId, lessonId)
    ?? getHsk4TextbookLessonContent(levelId, lessonId)
    ?? getHsk5LowerTextbookLessonContent(levelId, lessonId);
}
