"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  AudioWaveform,
  BookOpen,
  Check,
  ChevronRight,
  CircleCheck,
  Headphones,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Volume2,
  X,
} from "lucide-react";
import { HimiSectionBanner } from "@/components/himi-section-banner";
import {
  getListeningLesson,
  getListeningLevel,
  listeningLevels as LEVELS,
  type ListeningWord,
} from "@/lib/listening-content";
import {
  LISTENING_PROGRESS_KEY,
  parseListeningProgress,
  recordListeningResult,
  type ListeningProgress,
} from "@/lib/listening-progress";
import {
  HSK_LISTENING_PERFORMANCE_KEY,
  parseListeningPerformance,
  recordListeningQuestion,
} from "@/lib/listening-performance";
import {
  advanceListeningQuestion,
  answerListeningQuestion,
  createInitialListeningState,
  leaveListeningSession,
  selectListeningLevel,
  startListeningLesson,
} from "@/lib/listening-studio-state";

const ROUND_LENGTH = 10;
const VISIBLE_LEVELS = LEVELS.filter((level) => level.id !== "hsk-7-9");

export function ListeningStudio({
  initialLevelId,
  modeSwitcher,
}: {
  initialLevelId?: string;
  modeSwitcher?: ReactNode;
}) {
  const initialVisibleLevelId = initialLevelId && VISIBLE_LEVELS.some((level) => level.id === initialLevelId)
    ? initialLevelId
    : VISIBLE_LEVELS[0].id;
  const [studio, setStudio] = useState(() => createInitialListeningState(initialVisibleLevelId));
  const [slowPlayback, setSlowPlayback] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [answerReady, setAnswerReady] = useState(false);
  const [audioSupported, setAudioSupported] = useState(true);
  const [progress, setProgress] = useState<ListeningProgress>({});
  const [catalogMessage, setCatalogMessage] = useState("");
  const lessonSectionRef = useRef<HTMLElement>(null);
  const answerStartedAtRef = useRef(0);
  const answerLockedRef = useRef(true);

  const currentLevel = getListeningLevel(studio.selectedLevelId) ?? VISIBLE_LEVELS[0];
  const currentLesson = studio.selectedLessonId
    ? getListeningLesson(currentLevel.id, studio.selectedLessonId)
    : undefined;
  const question = studio.round[studio.questionIndex];
  const currentWord = question?.word;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        setProgress(parseListeningProgress(window.localStorage.getItem(LISTENING_PROGRESS_KEY)));
      } catch {
        setProgress({});
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  useEffect(() => {
    if (studio.view !== "intro") window.scrollTo({ top: 0, behavior: "auto" });
  }, [studio.view]);

  const playWord = (
    word: ListeningWord | undefined = currentWord,
    slower = slowPlayback,
    opensAnswerWindow = false,
  ) => {
    const openAnswerWindow = () => {
      if (!opensAnswerWindow) return;
      answerStartedAtRef.current = window.performance.now();
      answerLockedRef.current = false;
      setAnswerReady(true);
    };
    if (opensAnswerWindow) {
      answerLockedRef.current = true;
      setAnswerReady(false);
    }
    if (!word || typeof window === "undefined" || !("speechSynthesis" in window)) {
      setAudioSupported(false);
      if (typeof window !== "undefined") openAnswerWindow();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word.hanzi);
    utterance.lang = "zh-CN";
    utterance.rate = slower ? 0.58 : 0.76;
    const voice = window.speechSynthesis.getVoices().find((item) => item.lang.toLocaleLowerCase().startsWith("zh"));
    if (voice) utterance.voice = voice;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      openAnswerWindow();
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      openAnswerWindow();
    };
    window.speechSynthesis.speak(utterance);
  };

  const revealLessonSection = () => {
    window.setTimeout(() => lessonSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };

  const selectLevel = (levelId: string) => {
    setStudio((current) => selectListeningLevel(current, levelId));
    setCatalogMessage("");
    revealLessonSection();
  };

  const startLesson = (lessonId: string) => {
    const lesson = getListeningLesson(currentLevel.id, lessonId);
    if (!lesson) {
      setCatalogMessage("Không tìm thấy bài học này. Hãy chọn lại một bài khác.");
      return;
    }

    try {
      const next = startListeningLesson(studio, currentLevel, lesson);
      setStudio(next);
      answerLockedRef.current = true;
      setAnswerReady(false);
      setCatalogMessage("");
      window.setTimeout(() => playWord(next.round[0].word, false, true), 120);
    } catch {
      setCatalogMessage("Không thể tạo bài luyện này. Hãy chọn lại một bài khác.");
      setStudio((current) => leaveListeningSession(current));
      revealLessonSection();
    }
  };

  const saveResult = (lessonId: string, finalScore: number) => {
    setProgress((current) => {
      const next = recordListeningResult(current, lessonId, finalScore, ROUND_LENGTH);
      try {
        window.localStorage.setItem(LISTENING_PROGRESS_KEY, JSON.stringify(next));
      } catch {
        // Browser storage is optional; in-memory progress remains available.
      }
      return next;
    });
  };

  const selectChoice = (choice: string) => {
    if (!answerReady || isSpeaking || answerLockedRef.current || studio.answerStatus !== "idle" || !currentWord) return;
    answerLockedRef.current = true;
    const reactionMs = window.performance.now() - answerStartedAtRef.current;
    try {
      const currentPerformance = parseListeningPerformance(
        window.localStorage.getItem(HSK_LISTENING_PERFORMANCE_KEY),
      );
      const nextPerformance = recordListeningQuestion(
        currentPerformance,
        choice === currentWord.hanzi,
        reactionMs,
      );
      window.localStorage.setItem(HSK_LISTENING_PERFORMANCE_KEY, JSON.stringify(nextPerformance));
    } catch {
      // The exercise remains usable when private browsing blocks local storage.
    }
    setStudio((current) => answerListeningQuestion(current, choice));
  };

  const nextQuestion = () => {
    const next = advanceListeningQuestion(studio);
    if (next.view === "complete" && studio.view === "session") {
      window.speechSynthesis?.cancel();
      answerLockedRef.current = true;
      setAnswerReady(false);
      if (currentLesson) saveResult(currentLesson.id, studio.score);
    } else if (next.view === "session") {
      answerLockedRef.current = true;
      setAnswerReady(false);
      window.setTimeout(() => playWord(next.round[next.questionIndex].word, false, true), 100);
    }
    setStudio(next);
  };

  const returnToLessons = () => {
    window.speechSynthesis?.cancel();
    answerLockedRef.current = true;
    setAnswerReady(false);
    setStudio((current) => leaveListeningSession(current));
    revealLessonSection();
  };

  const togglePlaybackSpeed = () => {
    const nextSlowPlayback = !slowPlayback;
    setSlowPlayback(nextSlowPlayback);
    if (currentWord) playWord(currentWord, nextSlowPlayback);
  };

  if (studio.view === "intro") {
    return (
      <main className="learner-dashboard listening-studio">
        {modeSwitcher ? <div className="listening-mode-shell">{modeSwitcher}</div> : null}
        <div className="listening-banner-shell">
          <HimiSectionBanner
            actions={
              <div className="listening-banner-actions">
                <div className="listening-intro-facts" aria-label="Thông tin bài luyện">
                  <span><strong>10</strong> câu mỗi bài</span>
                  <span><strong>4</strong> bài mỗi cấp</span>
                  <span><strong>5–7</strong> phút</span>
                </div>
                <button className="listening-primary-action" onClick={revealLessonSection} type="button">
                  <Volume2 aria-hidden="true" size={20} /> Chọn bài luyện nghe <ChevronRight aria-hidden="true" size={19} />
                </button>
              </div>
            }
            description="Luyện nghe theo tình huống, bắt đúng từ khóa và kiểm tra mức hiểu ngay sau mỗi đoạn."
            titleId="listening-title"
            titleLines={["Nghe rõ từng câu.", "Phản xạ tự nhiên hơn."]}
            variant="listening"
          />
        </div>

        <section className="listening-level-section" aria-labelledby="listening-level-title">
          <div className="listening-section-heading">
            <div><h2 id="listening-level-title">Chọn cấp độ luyện nghe</h2><p>Từ nền tảng HSK 1 đến khả năng nghe hiểu nâng cao ở HSK 6.</p></div>
            <span>{currentLevel.words.length} từ trong bộ · 4 bài học</span>
          </div>
          <div className="listening-level-picker" role="group" aria-label="Chọn cấp độ luyện nghe">
            {VISIBLE_LEVELS.map((level) => (
              <button
                aria-label={`${level.label}: ${level.title}, ${level.lessons.length} bài học`}
                aria-pressed={studio.selectedLevelId === level.id}
                className={studio.selectedLevelId === level.id ? "is-active" : ""}
                key={level.id}
                onClick={() => selectLevel(level.id)}
                type="button"
              >
                <span className="listening-level-symbol"><Headphones aria-hidden="true" size={20} /></span>
                <strong>{level.label}</strong>
                <small>{level.title}</small>
                <span className="listening-level-count">{level.lessons.length} bài</span>
                {studio.selectedLevelId === level.id ? <Check aria-hidden="true" className="listening-level-check" size={17} /> : null}
              </button>
            ))}
          </div>
        </section>

        <section className="listening-lesson-section" aria-labelledby="listening-lesson-title" ref={lessonSectionRef}>
          <div className="listening-section-heading">
            <div>
              <span className="listening-section-kicker">{currentLevel.label} · 4 bài học</span>
              <h2 id="listening-lesson-title">Chọn bài luyện nghe</h2>
              <p>Nghe từng từ và chọn đúng Hán tự trong bốn đáp án.</p>
            </div>
            <span>10 câu/bài · khoảng 5 phút</span>
          </div>
          {catalogMessage ? <p className="listening-catalog-message" role="status">{catalogMessage}</p> : null}
          <div className="listening-lesson-grid">
            {currentLevel.lessons.map((lesson) => {
              const saved = progress[lesson.id];
              return (
                <button
                  aria-label={`${currentLevel.label}, bài ${lesson.order}: ${lesson.title}`}
                  className="listening-lesson-card"
                  key={lesson.id}
                  onClick={() => startLesson(lesson.id)}
                  type="button"
                >
                  <span className="listening-lesson-icon"><BookOpen aria-hidden="true" size={22} /></span>
                  <span className="listening-lesson-order">Bài {String(lesson.order).padStart(2, "0")}</span>
                  <strong className="listening-lesson-title">{lesson.title}</strong>
                  <span className="listening-lesson-description">{lesson.description}</span>
                  <span className="listening-lesson-meta">
                    <span>{lesson.wordIds.length} từ</span>
                    <span>10 câu</span>
                    {saved ? <span className="is-complete"><CircleCheck aria-hidden="true" size={15} /> Tốt nhất {saved.bestScore}/10</span> : null}
                  </span>
                  <span className="listening-lesson-cta"><Play aria-hidden="true" size={17} /> {saved ? "Luyện lại" : "Bắt đầu bài"}</span>
                </button>
              );
            })}
          </div>
        </section>
      </main>
    );
  }

  if (studio.view === "complete" && currentLesson) {
    const percentage = Math.round((studio.score / ROUND_LENGTH) * 100);
    return (
      <main className="learner-dashboard listening-studio listening-complete-page">
        <section className="listening-complete" aria-labelledby="listening-complete-title">
          <Image alt="Himi vui mừng khi bạn hoàn thành bài nghe" height={300} src="/assets/mascot/himi-v2/himi-celebrate.webp" unoptimized width={300} />
          <span className="listening-complete-eyebrow">{currentLevel.label} · {currentLesson.title}</span>
          <span className="listening-complete-score">{studio.score}/{ROUND_LENGTH}</span>
          <h1 id="listening-complete-title">Bạn đã hoàn thành bài luyện nghe.</h1>
          <p>{percentage >= 80 ? "Tai nghe đang bắt nhịp rất tốt. Hãy thử lại ở tốc độ thường để giữ phản xạ." : "Hãy nghe lại một lượt ở tốc độ chậm. Những từ chưa chắc sẽ trở nên quen hơn."}</p>
          <div className="listening-complete-actions">
            <button onClick={() => startLesson(currentLesson.id)} type="button"><RotateCcw aria-hidden="true" size={18} /> Luyện lại bài này</button>
            <button className="is-secondary" onClick={returnToLessons} type="button">Danh sách bài học</button>
          </div>
        </section>
      </main>
    );
  }

  if (!question || !currentWord || !currentLesson) return null;

  const progressValue = ((studio.questionIndex + 1) / ROUND_LENGTH) * 100;

  return (
    <main className="learner-dashboard listening-studio listening-session-page">
      <section className="listening-session" aria-labelledby="listening-question-title">
        <header className="listening-session-header">
          <button aria-label="Trở về danh sách bài học" className="listening-back" onClick={returnToLessons} type="button"><ArrowLeft aria-hidden="true" size={20} /></button>
          <div className="listening-progress-block">
            <div><strong>{currentLevel.label} · {currentLesson.title}</strong><span>Câu {studio.questionIndex + 1}/{ROUND_LENGTH}</span></div>
            <div
              aria-label={`Tiến độ ${studio.questionIndex + 1} trên ${ROUND_LENGTH}`}
              aria-valuemax={ROUND_LENGTH}
              aria-valuemin={1}
              aria-valuenow={studio.questionIndex + 1}
              className="listening-progress"
              role="progressbar"
            ><span style={{ transform: `scaleX(${progressValue / 100})` }} /></div>
          </div>
          <div className="listening-score"><Check aria-hidden="true" size={17} /><strong>{studio.score}</strong><span>đúng</span></div>
        </header>

        <div className="listening-question-stage">
          <p id="listening-question-title">Chọn Hán tự bạn vừa nghe</p>
          <div className="listening-audio-control">
            <button
              aria-label={isSpeaking ? "Đang phát từ tiếng Trung" : "Phát từ tiếng Trung"}
              className={`listening-play-button ${isSpeaking ? "is-speaking" : ""}`.trim()}
              onClick={() => playWord()}
              type="button"
            ><Volume2 aria-hidden="true" size={35} /></button>
            <AudioWaveform aria-hidden="true" className={isSpeaking ? "is-speaking" : ""} size={34} />
          </div>
          <strong>{isSpeaking ? "Đang phát…" : "Bấm để nghe lại"}</strong>
          <button aria-pressed={slowPlayback} className="listening-speed" onClick={togglePlaybackSpeed} type="button">
            <SlidersHorizontal aria-hidden="true" size={16} /> {slowPlayback ? "Tốc độ chậm" : "Tốc độ thường"}
          </button>
          {!audioSupported ? <small role="status">Trình duyệt hiện không thể phát giọng đọc tiếng Trung.</small> : null}
        </div>

        <div className="listening-choice-grid">
          {question.choices.map((choice, index) => {
            const isCorrect = choice === currentWord.hanzi;
            const isSelected = studio.selectedAnswer === choice;
            const stateClass = studio.answerStatus === "idle" ? "" : isCorrect ? "is-correct" : isSelected ? "is-wrong" : "is-muted";
            return (
              <button
                aria-label={`Đáp án ${String.fromCharCode(65 + index)}: ${choice}`}
                className={stateClass}
                disabled={studio.answerStatus !== "idle" || !answerReady || isSpeaking}
                key={choice}
                onClick={() => selectChoice(choice)}
                type="button"
              >
                <span>{String.fromCharCode(65 + index)}</span><strong lang="zh-CN">{choice}</strong>
                {studio.answerStatus !== "idle" && isCorrect ? <Check aria-hidden="true" size={18} /> : studio.answerStatus === "wrong" && isSelected ? <X aria-hidden="true" size={18} /> : null}
              </button>
            );
          })}
        </div>

        {studio.answerStatus !== "idle" ? (
          <div aria-live="polite" className={`listening-feedback is-${studio.answerStatus}`} role="status">
            <div>{studio.answerStatus === "correct" ? <Check aria-hidden="true" size={20} /> : <X aria-hidden="true" size={20} />}</div>
            <span>
              <strong>{studio.answerStatus === "correct" ? "Nghe đúng rồi!" : "Chưa đúng, nghe lại từ này nhé."}</strong>
              <small><b lang="zh-CN">{currentWord.hanzi}</b> · {currentWord.pinyin} · {currentWord.meaning}</small>
            </span>
            <button onClick={nextQuestion} type="button">{studio.questionIndex === ROUND_LENGTH - 1 ? "Xem kết quả" : "Câu tiếp theo"}<ChevronRight aria-hidden="true" size={18} /></button>
          </div>
        ) : null}
      </section>
    </main>
  );
}
