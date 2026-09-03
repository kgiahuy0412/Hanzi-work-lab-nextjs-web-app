"use client";

import { useMemo, useState } from "react";
import { AudioLines, CheckCircle2 } from "lucide-react";
import { PronunciationEvaluator } from "@/components/pronunciation-evaluator";
import type { DialogueLine, Vocabulary } from "@/lib/content-types";

type PracticeTarget = {
  id: string;
  hanzi: string;
  pinyin: string;
  translation: string;
};

export function LessonPronunciationCoach({ words, dialogue }: { words: Vocabulary[]; dialogue: DialogueLine[] }) {
  const targets = useMemo<PracticeTarget[]>(() => {
    const candidates = [
      ...dialogue.map((line, index) => ({ id: `dialogue-${index}`, hanzi: line.hanzi, pinyin: line.pinyin, translation: line.translation })),
      ...words.filter((word) => word.example.trim()).map((word) => ({ id: `word-${word.slug}`, hanzi: word.example, pinyin: word.pinyin, translation: word.translation })),
    ];
    return candidates.filter((item, index) => candidates.findIndex((candidate) => candidate.hanzi === item.hanzi) === index);
  }, [dialogue, words]);
  const [index, setIndex] = useState(0);
  const [passed, setPassed] = useState<Set<string>>(() => new Set());
  const current = targets[index];

  if (!current) return <div className="lesson-vocab-empty"><h2>Bài này chưa có câu luyện nghe</h2><p>Hãy chuyển sang phần Hội thoại để tiếp tục.</p></div>;

  return <section className="lesson-pronunciation-coach" aria-labelledby="lesson-pronunciation-title">
    <div className="lesson-interactive-heading">
      <div><span className="section-kicker">🔊 Nghe → 🎤 Đọc lại → Nhận điểm</span><h2 id="lesson-pronunciation-title">Luyện nghe & phát âm với iFlytek</h2><p>Nghe câu mẫu, đọc trọn câu vào micro rồi nhận điểm chi tiết theo thang 100.</p></div>
      <span className="lesson-interactive-heading-icon"><AudioLines size={25} /></span>
    </div>

    <div className="pronunciation-practice-layout">
      <nav className="pronunciation-target-list" aria-label="Danh sách câu luyện phát âm">{targets.map((target, targetIndex) => <button
        aria-current={targetIndex === index ? "step" : undefined}
        className={targetIndex === index ? "is-active" : ""}
        key={target.id}
        onClick={() => setIndex(targetIndex)}
        type="button"
      >
        <span>{String(targetIndex + 1).padStart(2, "0")}</span>
        <small>{target.hanzi}</small>
        {passed.has(target.id) ? <CheckCircle2 size={16} /> : null}
      </button>)}</nav>

      <article className="pronunciation-practice-card">
        <span className="pronunciation-step-label">Câu {index + 1} / {targets.length}</span>
        <strong lang="zh-CN">{current.hanzi}</strong>
        <small>{current.pinyin}</small>
        <p>{current.translation}</p>
        <PronunciationEvaluator
          key={current.id}
          onEvaluated={(result) => {
            if (result.totalScore < 70) return;
            setPassed((items) => new Set(items).add(current.id));
          }}
          targetText={current.hanzi}
        />
        <div className="pronunciation-next-row">
          <span>{passed.has(current.id) ? <><CheckCircle2 size={16} /> Đã đạt câu này</> : "Mục tiêu: từ 70 điểm"}</span>
          <button disabled={index === targets.length - 1} onClick={() => setIndex((currentIndex) => Math.min(targets.length - 1, currentIndex + 1))} type="button">Câu tiếp theo</button>
        </div>
      </article>
    </div>
  </section>;
}
