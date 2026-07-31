"use client";

import { useState } from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";
import type { LessonChallenge } from "@/lib/content-types";

export function LessonChallengePanel({
  challenge,
  onPassed,
}: {
  challenge: LessonChallenge;
  onPassed: (passed: boolean) => void;
}) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [score, setScore] = useState<number | null>(null);
  const answered = Object.keys(answers).length;
  const passed = score !== null && score >= challenge.passScore;

  function choose(questionIndex: number, optionIndex: number) {
    setAnswers((current) => ({ ...current, [questionIndex]: optionIndex }));
    if (score !== null) {
      setScore(null);
      onPassed(false);
    }
  }

  function grade() {
    const nextScore = challenge.questions.reduce(
      (total, question, index) => total + (answers[index] === question.correctOption ? 1 : 0),
      0,
    );
    setScore(nextScore);
    onPassed(nextScore >= challenge.passScore);
  }

  function retry() {
    setAnswers({});
    setScore(null);
    onPassed(false);
  }

  return <section className="lesson-challenge" aria-labelledby="lesson-challenge-title">
    <div className="lesson-challenge-heading">
      <div><span className="section-kicker">Kiểm tra module</span><h2 id="lesson-challenge-title">{challenge.title}</h2><p>{challenge.description}</p></div>
      <div className="lesson-challenge-target"><strong>{challenge.passScore}/{challenge.questions.length}</strong><span>Điểm đạt</span></div>
    </div>

    <div className="challenge-question-list">{challenge.questions.map((question, questionIndex) => <fieldset className="challenge-question" key={question.prompt}>
      <legend><span>{String(questionIndex + 1).padStart(2, "0")}</span>{question.prompt}</legend>
      <div className="challenge-options">{question.options.map((option, optionIndex) => {
        const selected = answers[questionIndex] === optionIndex;
        const correct = score !== null && optionIndex === question.correctOption;
        const incorrect = score !== null && selected && optionIndex !== question.correctOption;
        return <label className={`${selected ? "selected" : ""}${correct ? " correct" : ""}${incorrect ? " incorrect" : ""}`} key={option}>
          <input
            checked={selected}
            name={`challenge-question-${questionIndex}`}
            onChange={() => choose(questionIndex, optionIndex)}
            type="radio"
            value={optionIndex}
          />
          <span>{option}</span>
        </label>;
      })}</div>
      {score !== null ? <p className="challenge-explanation">{question.explanation}</p> : null}
    </fieldset>)}</div>

    <div className="challenge-result" aria-live="polite">
      {score === null ? <p>Đã trả lời {answered}/{challenge.questions.length} câu.</p> : passed
        ? <p className="challenge-result-pass"><CheckCircle2 size={19} /> Đạt {score}/{challenge.questions.length}. Bạn có thể hoàn thành bài và tiếp tục.</p>
        : <p>Đạt {score}/{challenge.questions.length}. Hãy xem giải thích và thử lại.</p>}
      {score === null
        ? <button className="button button-primary" disabled={answered !== challenge.questions.length} onClick={grade} type="button">Chấm kết quả</button>
        : <button className="button button-secondary" onClick={retry} type="button"><RotateCcw size={17} /> Làm lại</button>}
    </div>
  </section>;
}
