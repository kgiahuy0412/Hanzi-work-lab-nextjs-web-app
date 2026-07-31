"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { RotateCcw, Trophy } from "lucide-react";
import type { Vocabulary } from "@/lib/content-types";

type Feedback = "hard" | "known" | null;

const enterTransition = {
  duration: 0.22,
  ease: [0.22, 1, 0.36, 1],
} as const;

export function PracticeBoard({ vocabulary, authenticated }: { vocabulary: Vocabulary[]; authenticated: boolean }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [saveError, setSaveError] = useState(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduceMotion = useReducedMotion();
  const finished = index >= vocabulary.length;
  const word = vocabulary[Math.min(index, Math.max(vocabulary.length - 1, 0))];

  useEffect(() => () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
  }, []);

  function answer(isKnown: boolean) {
    if (feedback) return;

    setFeedback(isKnown ? "known" : "hard");
    setSaveError(false);

    const advance = () => {
      if (isKnown) setKnown((value) => value + 1);
      setIndex((value) => value + 1);
      setFlipped(false);
      setFeedback(null);
      advanceTimer.current = null;
    };

    if (authenticated) {
      void fetch("/api/progress/review", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ vocabularySlug: word.slug, remembered: isKnown }),
          keepalive: true,
        }).then((response) => {
        if (!response.ok) throw new Error("Review save failed");
      }).catch(() => {
        setSaveError(true);
      });
    }

    if (reduceMotion) {
      advance();
      return;
    }

    advanceTimer.current = setTimeout(advance, 300);
  }

  function restart() {
    if (authenticated) {
      window.location.reload();
      return;
    }
    setIndex(0);
    setKnown(0);
    setFlipped(false);
    setFeedback(null);
  }

  if (!word) {
    return <section className="practice-board"><div className="practice-finish"><div><h2>{authenticated ? "Bạn đã ôn xong hôm nay" : "Chưa có từ để ôn"}</h2><p>{authenticated ? "Các từ đã đánh giá sẽ quay lại khi đến lịch ôn tiếp theo." : "Hãy quay lại sau khi nội dung bài học được xuất bản."}</p></div></div></section>;
  }

  const progress = ((index + 1) / vocabulary.length) * 100;
  const cardAnimation = reduceMotion
    ? undefined
    : feedback === "hard"
      ? { x: [0, -5, 4, -3, 0] }
      : feedback === "known"
        ? { scale: [1, 1.018, 1] }
        : { x: 0, scale: 1 };

  return <section className="practice-board" aria-live="polite">
    <AnimatePresence mode="wait" initial={false}>
      {!finished ? <motion.div
        animate={{ opacity: 1, x: 0 }}
        className="practice-round"
        exit={reduceMotion ? undefined : { opacity: 0, x: -14 }}
        initial={reduceMotion ? false : { opacity: 0, x: 14 }}
        key={word.slug}
        transition={enterTransition}
      >
        <div className="practice-top"><span>Ôn tập · Đa chuyên ngành</span><span>{index + 1} / {vocabulary.length}</span></div>
        <div aria-label={`Tiến độ ${index + 1} trên ${vocabulary.length}`} aria-valuemax={vocabulary.length} aria-valuemin={1} aria-valuenow={index + 1} className="practice-progress" role="progressbar">
          <motion.span animate={{ width: `${progress}%` }} initial={false} transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 150, damping: 24 }} />
        </div>

        <motion.div animate={cardAnimation} className={`flashcard-motion-shell ${feedback ? `is-${feedback}` : ""}`} transition={{ duration: feedback === "hard" ? 0.24 : 0.28 }}>
          <motion.button
            aria-pressed={flipped}
            className="flashcard"
            onClick={() => setFlipped((value) => !value)}
            type="button"
            whileTap={reduceMotion ? undefined : { scale: 0.992 }}
          >
            <span className="flashcard-label">{flipped ? "Đáp án" : "Nhìn từ và nhớ nghĩa"}</span>
            <span className="flashcard-hanzi" lang="zh">{word.hanzi}</span>
            <span className="flashcard-pinyin">{word.pinyin}</span>
            <span className="flashcard-answer-slot">
              <AnimatePresence initial={false}>
                {flipped ? <motion.span
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="flashcard-meaning"
                  exit={reduceMotion ? undefined : { opacity: 0, y: -4, scale: 0.985 }}
                  initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.985 }}
                  key="meaning"
                  transition={enterTransition}
                >{word.meaning}</motion.span> : null}
              </AnimatePresence>
            </span>
            <span className="flashcard-hint">Chạm vào thẻ để {flipped ? "ẩn" : "xem"} nghĩa</span>
          </motion.button>
        </motion.div>

        <div className="answer-actions">
          <motion.button className="answer-button hard" disabled={!flipped || Boolean(feedback)} onClick={() => answer(false)} type="button" whileTap={reduceMotion ? undefined : { scale: 0.97 }}>Cần ôn lại</motion.button>
          <motion.button className="answer-button known" disabled={!flipped || Boolean(feedback)} onClick={() => answer(true)} type="button" whileTap={reduceMotion ? undefined : { scale: 0.97 }}>Tôi đã nhớ</motion.button>
        </div>
        {saveError ? <p className="practice-save-error" role="alert">Chưa lưu được kết quả. Hãy thử lại.</p> : authenticated ? <p className="practice-save-note">Mỗi lựa chọn sẽ được lưu và dùng để tính lịch ôn tiếp theo.</p> : <p className="practice-save-note">Lượt này chưa được lưu. <Link href="/login?returnTo=/practice">Đăng nhập để lưu lịch ôn</Link>.</p>}
      </motion.div> : <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="practice-finish"
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        key="finished"
        transition={enterTransition}
      >
        <div>
          <motion.div
            animate={reduceMotion ? undefined : { rotate: [0, -5, 4, 0], scale: [0.84, 1.08, 1] }}
            className="practice-finish-icon"
            transition={{ duration: 0.5, ease: "easeOut" }}
          ><Trophy size={34} /></motion.div>
          <h2>Đã xong lượt ôn!</h2>
          <p>Bạn nhớ chắc {known}/{vocabulary.length} từ. {authenticated ? "Lịch ôn tiếp theo đã được cập nhật." : "Đăng nhập để lưu những từ cần ôn lại."}</p>
          <motion.button className="button button-primary" onClick={restart} type="button" whileTap={reduceMotion ? undefined : { scale: 0.97 }}><RotateCcw size={17} /> {authenticated ? "Tải lượt ôn tiếp theo" : "Ôn lại từ đầu"}</motion.button>
        </div>
      </motion.div>}
    </AnimatePresence>
  </section>;
}
