"use client";

import { useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, type PanInfo, type Variants, useReducedMotion } from "motion/react";
import { ArrowRight, BookOpen, Check, Clock3, RotateCcw, Volume2, X } from "lucide-react";
import type { Vocabulary } from "@/lib/content-types";

type ReviewRating = "known" | "again" | "hard";
type SwipeDirection = -1 | 0 | 1;

type ReviewHomeStudioProps = {
  authenticated: boolean;
  completedLessons: number;
  vocabulary: Vocabulary[];
};

const weekDays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const cardMotionVariants: Variants = {
  enter: {
    opacity: 0,
    rotate: -1.2,
    scale: .982,
    x: 28,
    y: 10,
  },
  active: {
    opacity: 1,
    rotate: 0,
    scale: 1,
    x: 0,
    y: 0,
    transition: { type: "spring", stiffness: 320, damping: 30, mass: .72 },
  },
  exit: (direction: SwipeDirection) => ({
    opacity: 0,
    rotate: direction * 7,
    scale: .965,
    x: direction === 0 ? 0 : direction * 360,
    y: direction === 0 ? 58 : -8,
    transition: { duration: .26, ease: [0.32, 0, 0.2, 1] },
  }),
};

export function ReviewHomeStudio({
  authenticated,
  completedLessons,
  vocabulary,
}: ReviewHomeStudioProps) {
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<ReviewRating | null>(null);
  const [cardVisible, setCardVisible] = useState(true);
  const [exitDirection, setExitDirection] = useState<SwipeDirection>(0);
  const [remembered, setRemembered] = useState(0);
  const [saveError, setSaveError] = useState(false);
  const transitionLock = useRef(false);
  const reduceMotion = useReducedMotion();

  const finished = vocabulary.length > 0 && index >= vocabulary.length;
  const currentWord = vocabulary[index];
  const upcomingWords = vocabulary.slice(index + 1, index + 3);
  const weeklyCount = Math.min(7, Math.max(0, completedLessons));

  function saveReview(word: Vocabulary, rating: ReviewRating) {
    if (!authenticated) return;
    void fetch("/api/progress/review", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ vocabularySlug: word.slug, remembered: rating === "known" }),
      keepalive: true,
    }).then((response) => {
      if (!response.ok) throw new Error("Review save failed");
    }).catch(() => setSaveError(true));
  }

  function answer(rating: ReviewRating) {
    if (!currentWord || feedback || transitionLock.current) return;

    transitionLock.current = true;
    setFeedback(rating);
    setSaveError(false);
    saveReview(currentWord, rating);

    if (reduceMotion) {
      if (rating === "known") setRemembered((value) => value + 1);
      setIndex((value) => value + 1);
      setFeedback(null);
      transitionLock.current = false;
      return;
    }

    setExitDirection(rating === "known" ? 1 : rating === "hard" ? -1 : 0);
    setCardVisible(false);
  }

  function finishCardTransition() {
    if (!feedback) return;
    if (feedback === "known") setRemembered((value) => value + 1);
    setIndex((value) => value + 1);
    setFeedback(null);
    setCardVisible(true);
    transitionLock.current = false;
  }

  function handleReviewKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
    if (finished || feedback) return;
    if (!["ArrowRight", "ArrowDown", "ArrowLeft"].includes(event.key)) return;
    event.preventDefault();
    if (event.key === "ArrowRight") answer("known");
    if (event.key === "ArrowDown") answer("again");
    if (event.key === "ArrowLeft") answer("hard");
  }

  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (feedback) return;
    const projectedX = info.offset.x + info.velocity.x * .12;
    if (projectedX > 95) answer("known");
    if (projectedX < -95) answer("hard");
  }

  function playAudio() {
    if (!currentWord?.audioUrl) return;
    void new Audio(currentWord.audioUrl).play();
  }

  function restart() {
    if (authenticated) {
      window.location.reload();
      return;
    }
    setIndex(0);
    setRemembered(0);
    setFeedback(null);
    setCardVisible(true);
    setExitDirection(0);
    transitionLock.current = false;
  }

  return (
    <main className="learner-dashboard review-home-dashboard" onKeyDown={handleReviewKeyDown}>
      <div className="review-studio">
        <header className="review-studio-heading">
          <figure className="review-swipe-demo" role="img" aria-label="Minh họa thẻ từ HanziWork trượt sang phải rồi sang trái">
            <Image className="review-swipe-demo-motion" src="/assets/review/swipe-review-demo.gif" alt="" aria-hidden="true" width={600} height={216} priority unoptimized />
            <Image className="review-swipe-demo-static" src="/assets/review/swipe-review-demo.png" alt="" aria-hidden="true" width={600} height={216} priority unoptimized />
          </figure>
        </header>

        <div className="review-studio-layout">
          <section className="review-deck-stage" aria-label="Bộ thẻ ôn tập">
            {currentWord ? (
              <div className="review-card-stack">
                {upcomingWords.map((word, upcomingIndex) => (
                  <motion.article
                    animate={{ opacity: 1, rotate: upcomingIndex === 0 ? 4 : 8, scale: 1, x: 0, y: 0 }}
                    className={`review-peek-card peek-${upcomingIndex + 1}`}
                    initial={false}
                    key={word.slug}
                    layout="position"
                    transition={{ type: "spring", stiffness: 260, damping: 28, mass: .78 }}
                    aria-hidden="true"
                  >
                    <span>{String(index + upcomingIndex + 2).padStart(2, "0")}</span>
                    <strong lang="zh">{word.hanzi}</strong>
                    <b>{word.pinyin}</b>
                    <small>{word.meaning}</small>
                    <Volume2 size={19} />
                  </motion.article>
                ))}

                <AnimatePresence custom={exitDirection} initial={false} mode="wait" onExitComplete={finishCardTransition}>
                  {cardVisible && currentWord ? <motion.article
                    animate="active"
                    aria-label={`Từ ${index + 1} trên ${vocabulary.length}: ${currentWord.hanzi}`}
                    className="review-active-card"
                    aria-describedby="review-card-instructions"
                    custom={exitDirection}
                    drag={!feedback ? "x" : false}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={.2}
                    dragMomentum={false}
                    dragTransition={{ bounceStiffness: 420, bounceDamping: 32 }}
                    exit={reduceMotion ? { opacity: 0 } : "exit"}
                    initial={reduceMotion ? false : "enter"}
                    key={currentWord.slug}
                    onDragEnd={handleDragEnd}
                    tabIndex={0}
                    variants={cardMotionVariants}
                  >
                    <div className="review-card-content">
                      <div className="review-card-order"><span>{String(index + 1).padStart(2, "0")}</span><b>{index + 1} / {vocabulary.length}</b></div>
                      <strong className="review-card-hanzi" lang="zh">{currentWord.hanzi}</strong>
                      <div className="review-card-reading">
                        <span>{currentWord.pinyin}</span>
                        <small>{currentWord.meaning}</small>
                        <button aria-label={currentWord.audioUrl ? `Nghe phát âm ${currentWord.hanzi}` : "Audio sắp được bổ sung"} disabled={!currentWord.audioUrl} onClick={playAudio} title={currentWord.audioUrl ? "Nghe phát âm" : "Audio sắp được bổ sung"} type="button"><Volume2 size={18} /></button>
                      </div>
                      <div className="review-card-example">
                        <span>Câu ví dụ trong công việc</span>
                        <strong lang="zh">{currentWord.example}</strong>
                        <p>{currentWord.translation}</p>
                      </div>
                    </div>

                    <div className="review-answer-dock" aria-label="Mức độ ghi nhớ">
                      <button className="known" disabled={Boolean(feedback)} onClick={() => answer("known")} type="button"><Check size={22} /><span><strong>Nhớ</strong><small>→</small></span></button>
                      <button className="again" disabled={Boolean(feedback)} onClick={() => answer("again")} type="button"><RotateCcw size={21} /><span><strong>Cần ôn lại</strong><small>↓</small></span></button>
                      <button className="hard" disabled={Boolean(feedback)} onClick={() => answer("hard")} type="button"><X size={23} /><span><strong>Khó</strong><small>←</small></span></button>
                    </div>
                  </motion.article> : null}
                </AnimatePresence>
              </div>
            ) : (
              <div className="review-studio-empty">
                <BookOpen size={30} />
                <h1>Chưa có từ đến lịch ôn</h1>
                <p>Học thêm một bài để tạo bộ từ và lịch ôn dành riêng cho bạn.</p>
                <Link href="/courses">Khám phá lộ trình <ArrowRight size={17} /></Link>
              </div>
            )}

            {currentWord ? <p className="sr-only" id="review-card-instructions">Kéo thẻ sang phải khi nhớ, sang trái khi thấy khó; hoặc chọn một mức ghi nhớ ở cuối thẻ.</p> : null}
            {saveError ? <p className="review-save-error" role="alert">Kết quả chưa được lưu. Bạn vẫn có thể tiếp tục và thử lại sau.</p> : null}
          </section>

          <aside className="review-studio-aside">
            <section className="review-week-rhythm">
              <div><span>Nhịp tuần này</span><small>{weeklyCount} / 7 ngày hoàn thành</small></div>
              <div className="review-week-days">
                {weekDays.map((day, dayIndex) => <span className={dayIndex < weeklyCount ? "done" : dayIndex === 5 ? "today" : ""} key={day}><b>{day}</b><i>{dayIndex < weeklyCount ? <Check size={13} /> : null}</i></span>)}
              </div>
              <p>{weeklyCount >= 5 ? "Giữ đều là thói quen tốt!" : "Mỗi phiên ngắn đều giúp bạn tiến bộ."}</p>
            </section>

            {finished ? (
              <section className="review-complete-panel" aria-live="polite">
                <span><Check size={22} /></span>
                <h2>Hoàn thành lượt ôn</h2>
                <p>Bạn nhớ chắc {remembered}/{vocabulary.length} từ trong phiên này.</p>
                <button onClick={restart} type="button"><RotateCcw size={18} /> {authenticated ? "Tải lượt ôn mới" : "Ôn lại từ đầu"}</button>
              </section>
            ) : null}

            <Link className="review-next-lesson" href="/learn/van-phong-hanh-chinh">
              <span>Tiếp theo</span>
              <strong>Bài 05 — Theo dõi tiến độ công việc</strong>
              <small><Clock3 size={14} /> 12 phút <BookOpen size={14} /> 6 mục học</small>
              <ArrowRight size={19} />
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}
