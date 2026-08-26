"use client";

import { useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, type PanInfo, type Variants, useReducedMotion } from "motion/react";
import { ArrowRight, Award, BookOpen, Check, Clock3, Gamepad2, Headphones, RotateCcw, TimerReset, Volume2, X, Zap } from "lucide-react";
import type { Vocabulary } from "@/lib/content-types";
import type { DailySessionSnapshot, DailySessionStepId } from "@/lib/daily-session";

type ReviewRating = "known" | "again" | "hard";
type SwipeDirection = -1 | 0 | 1;

type ReviewHomeStudioProps = {
  authenticated: boolean;
  dailySession: DailySessionSnapshot;
  verified?: boolean;
  vocabulary: Vocabulary[];
};

const dailyStepIcons = {
  review: RotateCcw,
  lesson: BookOpen,
  practice: Headphones,
  game: Gamepad2,
} satisfies Record<DailySessionStepId, typeof BookOpen>;

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
  dailySession,
  verified = false,
  vocabulary,
}: ReviewHomeStudioProps) {
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<ReviewRating | null>(null);
  const [cardVisible, setCardVisible] = useState(true);
  const [exitDirection, setExitDirection] = useState<SwipeDirection>(0);
  const [remembered, setRemembered] = useState(0);
  const [reviewedInSession, setReviewedInSession] = useState(0);
  const [saveError, setSaveError] = useState(false);
  const [phraseSpeaking, setPhraseSpeaking] = useState(false);
  const [phraseAudioMessage, setPhraseAudioMessage] = useState("");
  const transitionLock = useRef(false);
  const reduceMotion = useReducedMotion();

  const finished = vocabulary.length > 0 && index >= vocabulary.length;
  const currentWord = vocabulary[index];
  const upcomingWords = vocabulary.slice(index + 1, index + 3);
  const effectiveReviewedToday = Math.min(
    dailySession.reviewTarget,
    dailySession.reviewedToday + reviewedInSession,
  );
  const sessionSteps = dailySession.steps.map((step) => step.id === "review" ? {
    ...step,
    completed: dailySession.reviewTarget === 0 || effectiveReviewedToday >= dailySession.reviewTarget,
    title: dailySession.reviewTarget === 0
      ? "Không có từ đến lịch"
      : effectiveReviewedToday >= dailySession.reviewTarget
        ? `Đã ôn ${dailySession.reviewTarget} từ`
        : `${dailySession.reviewTarget - effectiveReviewedToday} từ đang chờ`,
  } : step);
  const completedSessionSteps = sessionSteps.filter((step) => step.completed).length;
  const activeSessionStep = sessionSteps.find((step) => !step.completed);
  const lessonStep = sessionSteps.find((step) => step.id === "lesson");
  const sessionComplete = completedSessionSteps === dailySession.totalSteps;
  const reviewTargetReachedThisVisit = reviewedInSession > 0
    && Boolean(sessionSteps.find((step) => step.id === "review")?.completed);
  const summaryReviewedWords = Math.max(dailySession.summary.reviewedWords, effectiveReviewedToday);

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
    setReviewedInSession((value) => value + 1);
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

  function playDailyPhrase() {
    if (!("speechSynthesis" in window)) {
      setPhraseAudioMessage("Trình duyệt này chưa hỗ trợ phát âm.");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance("我马上跟进");
    utterance.lang = "zh-CN";
    utterance.rate = .82;
    utterance.onstart = () => {
      setPhraseSpeaking(true);
      setPhraseAudioMessage("Đang phát âm câu dùng ngay.");
    };
    utterance.onend = () => {
      setPhraseSpeaking(false);
      setPhraseAudioMessage("Đã phát âm xong.");
    };
    utterance.onerror = () => {
      setPhraseSpeaking(false);
      setPhraseAudioMessage("Chưa thể phát âm. Hãy thử lại.");
    };
    window.speechSynthesis.speak(utterance);
  }

  function restart() {
    if (authenticated) {
      window.location.reload();
      return;
    }
    setIndex(0);
    setRemembered(0);
    setReviewedInSession(0);
    setFeedback(null);
    setCardVisible(true);
    setExitDirection(0);
    transitionLock.current = false;
  }

  return (
    <main className="learner-dashboard review-home-dashboard" onKeyDown={handleReviewKeyDown}>
      <div className="review-studio">
        {verified ? <p className="home-auth-success" role="status"><Check size={17} /> Email đã xác minh. Chào mừng bạn đến Himi Chinese.</p> : null}
        <section className="today-session-strip" aria-labelledby="today-session-title">
          <header className="today-session-intro">
            <span><TimerReset size={16} /> Nhịp học gợi ý</span>
            <h1 id="today-session-title">Phiên 10 phút hôm nay</h1>
            <p>{sessionComplete
              ? "Đã khép kín nhịp hôm nay. Nghỉ một chút cũng được."
              : "Bốn bước ngắn để ôn, học và phản xạ mà không quá tải."}</p>
            {!sessionComplete && activeSessionStep ? <Link className="today-session-resume" href={activeSessionStep.href} prefetch>
              Tiếp tục từ {activeSessionStep.label.toLocaleLowerCase("vi-VN")} <ArrowRight size={16} />
            </Link> : null}
          </header>

          {sessionComplete ? <section className="today-session-complete" id="today-summary" aria-live="polite">
            <span className="today-session-complete-mark"><Award size={24} /></span>
            <div className="today-session-complete-copy">
              <small>4/4 · Phiên hôm nay đã xong</small>
              <h2>10 phút đã khép lại.</h2>
              <p>Một nhịp ngắn nhưng đủ cả ôn, học, nghe và phản xạ.</p>
            </div>
            <dl className="today-session-summary">
              <div><dt>Ôn nhanh</dt><dd>{summaryReviewedWords} từ</dd></div>
              <div><dt>Bài học</dt><dd>{dailySession.summary.lessonTitle ?? "Đã hoàn thành"}</dd></div>
              <div><dt>Luyện ca</dt><dd>{dailySession.summary.practiceCorrect ?? 0}/{dailySession.summary.practiceTotal ?? 0} đúng</dd></div>
              <div><dt>Phản xạ</dt><dd>{dailySession.summary.gameScore ?? 0} điểm · +{dailySession.summary.xpEarned} XP</dd></div>
            </dl>
            <Link className="today-session-extra" href={lessonStep?.href ?? "/courses"} prefetch>
              Học tiếp nếu còn hứng <ArrowRight size={16} />
            </Link>
          </section> : <div className="today-session-plan">
            <div className="today-session-progress-copy">
              <span>{activeSessionStep ? `Bước tiếp: ${activeSessionStep.label}` : "Hoàn thành hôm nay"}</span>
              <strong>{completedSessionSteps}/{dailySession.totalSteps} bước</strong>
            </div>
            <div
              aria-label={`Đã hoàn thành ${completedSessionSteps} trên ${dailySession.totalSteps} bước`}
              aria-valuemax={dailySession.totalSteps}
              aria-valuemin={0}
              aria-valuenow={completedSessionSteps}
              className="today-session-progress"
              role="progressbar"
            >
              <i style={{ width: `${completedSessionSteps / dailySession.totalSteps * 100}%` }} />
            </div>
            <ol className="today-session-steps">
              {sessionSteps.map((step, stepIndex) => {
                const StepIcon = dailyStepIcons[step.id];
                const active = activeSessionStep?.id === step.id;
                return <li className={step.completed ? "is-complete" : active ? "is-active" : ""} key={step.id}>
                  <Link aria-current={active ? "step" : undefined} href={step.href} prefetch>
                    <span className="today-session-step-number">
                      {step.completed ? <Check size={15} /> : <StepIcon size={16} />}
                    </span>
                    <span className="today-session-step-copy">
                      <b>{String(stepIndex + 1).padStart(2, "0")} · {step.label}</b>
                      <small>{step.title}</small>
                    </span>
                    <em>{step.minutes}&prime;</em>
                  </Link>
                </li>;
              })}
            </ol>
          </div>}
        </section>

        <div className="review-studio-layout">
          <section className="review-deck-stage" id="review-deck" aria-label="Bộ thẻ ôn tập">
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
                <h2>Chưa có từ đến lịch ôn</h2>
                <p>Học thêm một bài để tạo bộ từ và lịch ôn dành riêng cho bạn.</p>
                <Link href="/courses">Khám phá lộ trình <ArrowRight size={17} /></Link>
              </div>
            )}

            {currentWord ? <p className="sr-only" id="review-card-instructions">Kéo thẻ sang phải khi nhớ, sang trái khi thấy khó; hoặc chọn một mức ghi nhớ ở cuối thẻ.</p> : null}
            {reviewTargetReachedThisVisit && lessonStep && !finished ? <aside className="review-target-next" aria-live="polite">
              <span><Check size={17} /></span>
              <div><strong>Đủ phần ôn nhanh</strong><small>Bạn có thể tiếp tục hai thẻ còn lại hoặc sang bước học.</small></div>
              <Link href={lessonStep.href} prefetch>Học tiếp 4 phút <ArrowRight size={16} /></Link>
            </aside> : null}
            {saveError ? <p className="review-save-error" role="alert">Kết quả chưa được lưu. Bạn vẫn có thể tiếp tục và thử lại sau.</p> : null}
          </section>

          <aside className="review-studio-aside">
            <section className="review-daily-phrase">
              <div className="review-daily-phrase-heading"><span>Câu dùng ngay</span><i aria-hidden="true" /></div>
              <strong lang="zh">我马上跟进。</strong>
              <span className="review-daily-phrase-pinyin">wǒ mǎshàng gēnjìn</span>
              <p>Tôi sẽ theo dõi ngay.</p>
              <div className="review-daily-phrase-actions">
                <button aria-label="Nghe phát âm câu 我马上跟进" aria-pressed={phraseSpeaking} className={phraseSpeaking ? "playing" : ""} onClick={playDailyPhrase} type="button"><Volume2 size={20} /></button>
                <Link href="/practice">Luyện phản xạ <ArrowRight size={18} /></Link>
              </div>
              <p aria-live="polite" className="sr-only">{phraseAudioMessage}</p>
            </section>

            {finished ? (
              <section className="review-complete-panel" aria-live="polite">
                <span><Check size={22} /></span>
                <h2>Hoàn thành lượt ôn</h2>
                <p>Bạn nhớ chắc {remembered}/{vocabulary.length} từ trong phiên này.</p>
                <div className="review-complete-actions">
                  <button onClick={restart} type="button"><RotateCcw size={18} /> {authenticated ? "Tải lượt ôn mới" : "Ôn lại từ đầu"}</button>
                  {lessonStep ? <Link href={lessonStep.href} prefetch><Zap size={17} /> Học tiếp 4 phút <ArrowRight size={16} /></Link> : null}
                </div>
              </section>
            ) : null}

            <Link className="review-next-lesson" href={lessonStep?.href ?? "/courses"}>
              <span>Tiếp theo</span>
              <strong>{lessonStep?.title ?? "Chọn bài học tiếp theo"}</strong>
              <small><Clock3 size={14} /> 4 phút trong phiên <BookOpen size={14} /> Học tiếp</small>
              <ArrowRight size={19} />
            </Link>

            <figure className="review-swipe-demo review-swipe-demo-below" role="img" aria-label="Minh họa thẻ từ Himi Chinese trượt sang phải rồi sang trái">
              <Image className="review-swipe-demo-motion" src="/assets/review/swipe-review-demo.gif" alt="" aria-hidden="true" width={600} height={216} unoptimized />
              <Image className="review-swipe-demo-static" src="/assets/review/swipe-review-demo.png" alt="" aria-hidden="true" width={600} height={216} unoptimized />
            </figure>
          </aside>
        </div>
      </div>
    </main>
  );
}
