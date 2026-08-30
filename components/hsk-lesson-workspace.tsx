"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type HanziWriter from "hanzi-writer";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  GraduationCap,
  Headphones,
  PenLine,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
  X,
} from "lucide-react";
import type {
  HskExercise,
  HskLessonContent,
  HskLessonMode,
  HskVocabularyItem,
  HskWritingCharacter,
} from "@/lib/hsk-lesson-content";
import {
  calculateHskLessonProgress,
  EMPTY_HSK_LESSON_PROGRESS,
  getHskLessonProgressStorageKey,
  parseHskLessonProgress,
  type HskLessonProgress,
} from "@/lib/hsk-lesson-progress";

type SpeechRate = 0.75 | 1 | 1.25;
type WritingMode = "watch" | "trace" | "quiz";

const TABS: Array<{ id: HskLessonMode; label: string; icon: typeof BookOpen }> = [
  { id: "vocabulary", label: "Từ vựng", icon: BookOpen },
  { id: "exercise", label: "Bài tập", icon: GraduationCap },
  { id: "pronunciation", label: "Phát âm", icon: Headphones },
  { id: "hanzi", label: "Chữ Hán", icon: PenLine },
];

function addUnique(items: string[], item: string): string[] {
  return items.includes(item) ? items : [...items, item];
}

function saveProgress(lessonId: string, progress: HskLessonProgress): void {
  try {
    window.localStorage.setItem(getHskLessonProgressStorageKey(lessonId), JSON.stringify(progress));
  } catch {
    // The lesson remains fully usable when browser storage is unavailable.
  }
}

function VocabularyPanel({
  words,
  completed,
  onComplete,
  onContinue,
  speak,
}: {
  words: HskVocabularyItem[];
  completed: string[];
  onComplete: (wordId: string) => void;
  onContinue: () => void;
  speak: (text: string, rate?: SpeechRate) => void;
}) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const word = words[index];

  const move = useCallback((direction: -1 | 1) => {
    setIndex((current) => (current + direction + words.length) % words.length);
    setFlipped(false);
  }, [words.length]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("button, a, input, textarea, select")) return;
      if (event.key === " ") {
        event.preventDefault();
        setFlipped((value) => !value);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        move(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        move(-1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [move]);

  const rateWord = (remembered: boolean) => {
    if (remembered) onComplete(word.id);
    if (index === words.length - 1) onContinue();
    else move(1);
  };

  return <section className="hsk-vocab-mode" aria-label="Flashcard từ vựng">
    <div className="hsk-mode-intro">
      <div><span>Flashcard chủ động</span><h2>Nhớ mặt chữ trước, kiểm tra nghĩa sau</h2><p>Bấm vào thẻ để lật. Sau đó tự đánh giá độ thuộc để lưu tiến độ.</p></div>
      <strong>{completed.length}/{words.length} đã nhớ</strong>
    </div>

    <div aria-label={`Từ ${index + 1} trên ${words.length}`} aria-valuemax={words.length} aria-valuemin={1} aria-valuenow={index + 1} className="hsk-step-progress" role="progressbar">
      <span style={{ width: `${((index + 1) / words.length) * 100}%` }} />
    </div>

    <div className="hsk-flashcard-stage">
      <button aria-label="Từ trước" className="hsk-round-nav" onClick={() => move(-1)} type="button"><ChevronLeft aria-hidden="true" size={24} /></button>
      <article className={`hsk-flashcard${flipped ? " is-flipped" : ""}`}>
        <button aria-label={flipped ? "Ẩn nghĩa của từ" : "Xem pinyin và nghĩa"} className="hsk-flashcard-flip" onClick={() => setFlipped((value) => !value)} type="button">
          <span className="hsk-flashcard-count">{String(index + 1).padStart(2, "0")} / {String(words.length).padStart(2, "0")}</span>
          <small>{word.wordClass}</small>
          <strong lang="zh-CN">{word.hanzi}</strong>
          {flipped ? <span className="hsk-flashcard-answer"><b>{word.pinyin}</b><em>{word.meaning}</em></span> : <span className="hsk-flashcard-hint">Bấm để xem pinyin và nghĩa</span>}
        </button>
        <button aria-label={`Nghe phát âm ${word.hanzi}`} className="hsk-audio-orb" onClick={() => speak(word.hanzi)} type="button"><Volume2 aria-hidden="true" size={22} /></button>
        {flipped ? <div className="hsk-flashcard-example"><span>Ví dụ</span><strong lang="zh-CN">{word.example}</strong><small>{word.examplePinyin}</small><p>{word.translation}</p></div> : null}
        {flipped ? <div className="hsk-flashcard-rating" aria-label="Tự đánh giá độ thuộc">
          <button onClick={() => rateWord(false)} type="button"><span>1</span>Quên</button>
          <button onClick={() => rateWord(false)} type="button"><span>2</span>Còn khó</button>
          <button onClick={() => rateWord(true)} type="button"><span>3</span>Đã nhớ</button>
          <button onClick={() => rateWord(true)} type="button"><span>4</span>Rất chắc</button>
        </div> : null}
      </article>
      <button aria-label="Từ tiếp theo" className="hsk-round-nav" onClick={() => move(1)} type="button"><ChevronRight aria-hidden="true" size={24} /></button>
    </div>
    <p className="hsk-keyboard-hint">Phím <kbd>Space</kbd> để lật · <kbd>←</kbd> <kbd>→</kbd> để chuyển thẻ</p>
  </section>;
}

function ExercisePrompt({ exercise, speak }: { exercise: HskExercise; speak: (text: string, rate?: SpeechRate) => void }) {
  if (exercise.type === "listening") {
    return <button aria-label="Nghe câu hỏi" className="hsk-exercise-listen" onClick={() => speak(exercise.speakText ?? exercise.answer ?? "")} type="button"><Volume2 aria-hidden="true" size={30} /><span>Nghe lại</span></button>;
  }
  return <div className={`hsk-exercise-copy${exercise.pinyin ? " has-pinyin" : ""}`}><strong className="hsk-exercise-prompt" lang={exercise.type === "meaning" ? "zh-CN" : undefined}>{exercise.prompt}</strong>{exercise.pinyin ? <span>{exercise.pinyin}</span> : null}</div>;
}

function ExercisePanel({
  exercises,
  bestPercent,
  reviewed,
  onFinished,
  onReview,
  speak,
}: {
  exercises: HskExercise[];
  bestPercent: number;
  reviewed: string[];
  onFinished: (percent: number) => void;
  onReview: (exerciseId: string) => void;
  speak: (text: string, rate?: SpeechRate) => void;
}) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [finished, setFinished] = useState(false);
  const exercise = exercises[index];
  const scored = exercises.every((item) => item.answer !== null);

  const choose = (option: string) => {
    if (selected) return;
    setSelected(option);
    if (exercise.answer !== null && option === exercise.answer) setCorrect((value) => value + 1);
  };

  const next = () => {
    if (exercise.answer !== null && exercise.options.length && !selected) return;
    onReview(exercise.id);
    if (index === exercises.length - 1) {
      if (scored) onFinished(Math.round((correct / exercises.length) * 100));
      setFinished(true);
      return;
    }
    setIndex((value) => value + 1);
    setSelected(null);
  };

  const restart = () => {
    setIndex(0);
    setSelected(null);
    setCorrect(0);
    setFinished(false);
  };

  if (finished) {
    const percent = Math.round((correct / exercises.length) * 100);
    return <section className="hsk-result-card" aria-live="polite">
      <span><Sparkles aria-hidden="true" size={28} /></span>
      <small>{scored ? "Hoàn thành bài tập" : "Hoàn thành lượt ôn tập"}</small>
      <h2>{scored ? `${correct}/${exercises.length} câu đúng` : `Đã xem ${exercises.length} nội dung`}</h2>
      <p>{scored ? percent >= 80 ? "Bạn đã nắm khá chắc bài này." : "Ôn lại flashcard rồi thử thêm một lượt nhé." : "Tiến độ đã được lưu. Phần này không chấm đúng sai vì dữ liệu nguồn không có đáp án."}</p>
      <button onClick={restart} type="button"><RotateCcw aria-hidden="true" size={18} /> Làm lại bài tập</button>
    </section>;
  }

  return <section className="hsk-exercise-mode" aria-label="Bài tập HSK">
    <div className="hsk-mode-intro">
      <div><span>Luyện tập tổng hợp</span><h2>{exercise.instruction}</h2><p>Câu {index + 1}/{exercises.length}{scored ? ` · Kỷ lục ${bestPercent}%` : " · Tự luyện theo nội dung nguồn"}</p></div>
      <strong>{scored ? `${correct} câu đúng` : `${reviewed.length}/${exercises.length} đã xem`}</strong>
    </div>
    <div aria-label={`Bài tập ${index + 1} trên ${exercises.length}`} aria-valuemax={exercises.length} aria-valuemin={1} aria-valuenow={index + 1} className="hsk-step-progress" role="progressbar"><span style={{ width: `${((index + 1) / exercises.length) * 100}%` }} /></div>
    <article className="hsk-exercise-card">
      <ExercisePrompt exercise={exercise} speak={speak} />
      {exercise.note ? <p className="hsk-exercise-note">{exercise.note}</p> : null}
      <div className="hsk-exercise-options">
        {exercise.options.map((option, optionIndex) => {
          const state = exercise.answer !== null && selected ? option === exercise.answer ? " is-correct" : option === selected ? " is-wrong" : "" : selected === option ? " is-selected" : "";
          return <button className={state} key={option} onClick={() => choose(option)} type="button"><b>{String.fromCharCode(65 + optionIndex)}</b><span>{option}</span>{state === " is-correct" ? <Check aria-hidden="true" size={18} /> : state === " is-wrong" ? <X aria-hidden="true" size={18} /> : null}</button>;
        })}
      </div>
      {selected && exercise.answer !== null ? <div className={`hsk-answer-feedback${selected === exercise.answer ? " is-correct" : " is-wrong"}`} role="status">
        <span>{selected === exercise.answer ? <Check aria-hidden="true" size={18} /> : <X aria-hidden="true" size={18} />}</span>
        <strong>{selected === exercise.answer ? "Chính xác" : `Đáp án đúng: ${exercise.answer}`}</strong>
      </div> : null}
      <button className="hsk-primary-action" disabled={exercise.answer !== null && exercise.options.length > 0 && !selected} onClick={next} type="button">{index === exercises.length - 1 ? scored ? "Xem kết quả" : "Hoàn thành" : "Câu tiếp theo"}<ArrowRight aria-hidden="true" size={18} /></button>
    </article>
  </section>;
}

function PronunciationPanel({
  words,
  completed,
  onComplete,
  speak,
}: {
  words: HskVocabularyItem[];
  completed: string[];
  onComplete: (wordId: string) => void;
  speak: (text: string, rate?: SpeechRate) => void;
}) {
  const [index, setIndex] = useState(0);
  const [rate, setRate] = useState<SpeechRate>(1);
  const [showPinyin, setShowPinyin] = useState(true);
  const word = words[index];

  const shadow = () => {
    onComplete(word.id);
    if (index < words.length - 1) setIndex((value) => value + 1);
  };

  return <section className="hsk-pronunciation-mode" aria-label="Luyện phát âm">
    <div className="hsk-mode-intro">
      <div><span>Nghe · nhại · tự kiểm tra</span><h2>Đọc theo từng từ ở tốc độ phù hợp</h2><p>Nghe mẫu trước, đọc nhại thành tiếng, rồi đánh dấu khi hoàn tất.</p></div>
      <strong>{completed.length}/{words.length} đã đọc</strong>
    </div>

    <div className="hsk-speech-toolbar">
      <button aria-pressed={showPinyin} onClick={() => setShowPinyin((value) => !value)} type="button">{showPinyin ? "Ẩn pinyin" : "Hiện pinyin"}</button>
      <div aria-label="Tốc độ phát" role="group">{([0.75, 1, 1.25] as SpeechRate[]).map((value) => <button aria-pressed={rate === value} key={value} onClick={() => setRate(value)} type="button">{value}×</button>)}</div>
    </div>

    <div className="hsk-pronunciation-layout">
      <nav aria-label="Chọn từ luyện phát âm" className="hsk-pronunciation-list">
        {words.map((item, wordIndex) => <button aria-current={wordIndex === index ? "true" : undefined} className={wordIndex === index ? "is-active" : ""} key={item.id} onClick={() => setIndex(wordIndex)} type="button"><span lang="zh-CN">{item.hanzi}</span><small>{item.pinyin}</small>{completed.includes(item.id) ? <Check aria-hidden="true" size={15} /> : null}</button>)}
      </nav>
      <article className="hsk-pronunciation-card">
        <small>TỪ {String(index + 1).padStart(2, "0")} / {String(words.length).padStart(2, "0")}</small>
        <strong lang="zh-CN">{word.hanzi}</strong>
        {showPinyin ? <b>{word.pinyin}</b> : null}
        <p>{word.meaning}</p>
        <button aria-label={`Nghe phát âm ${word.hanzi}`} className="hsk-pronunciation-play" onClick={() => speak(word.hanzi, rate)} type="button"><Volume2 aria-hidden="true" size={28} /><span>Nghe mẫu · {rate}×</span></button>
        <div className="hsk-shadowing-example"><span>Đọc trong câu</span><strong lang="zh-CN">{word.example}</strong><small>{showPinyin ? word.examplePinyin : "Pinyin đang ẩn"}</small><p>{word.translation}</p><button onClick={() => speak(word.example, rate)} type="button"><Play aria-hidden="true" fill="currentColor" size={16} /> Nghe cả câu</button></div>
        <button className="hsk-primary-action" onClick={shadow} type="button"><Check aria-hidden="true" size={18} /> Tôi đã đọc theo</button>
      </article>
    </div>
  </section>;
}

function HanziPanel({
  characters,
  completed,
  onComplete,
  speak,
}: {
  characters: HskWritingCharacter[];
  completed: string[];
  onComplete: (writingId: string) => void;
  speak: (text: string, rate?: SpeechRate) => void;
}) {
  const boardRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<HanziWriter | null>(null);
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState<WritingMode>("watch");
  const [boardSize, setBoardSize] = useState(330);
  const [resetVersion, setResetVersion] = useState(0);
  const [status, setStatus] = useState("Đang chuẩn bị dữ liệu nét…");
  const character = characters[index];
  const completedCount = characters.filter((item) => (
    completed.includes(item.id) || completed.includes(item.hanzi)
  )).length;

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const updateSize = () => setBoardSize(Math.max(240, Math.min(360, Math.floor(board.clientWidth))));
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(board);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let canceled = false;
    const board = boardRef.current;
    if (!board) return;
    board.replaceChildren();

    void import("hanzi-writer").then(({ default: HanziWriterClass }) => {
      if (canceled || !boardRef.current) return;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const writer = HanziWriterClass.create(boardRef.current, character.hanzi, {
        width: boardSize,
        height: boardSize,
        padding: Math.round(boardSize * 0.09),
        renderer: "svg",
        showCharacter: mode === "watch" && reduceMotion,
        showOutline: mode !== "quiz",
        strokeColor: "#153f38",
        radicalColor: "#ff6d55",
        outlineColor: mode === "trace" ? "#f0c8c0" : "#d8e4df",
        highlightColor: "#ff6d55",
        drawingColor: "#ff6d55",
        drawingWidth: Math.max(7, Math.round(boardSize / 48)),
        strokeAnimationSpeed: 1.25,
        delayBetweenStrokes: 320,
        onLoadCharDataError: () => {
          if (!canceled) setStatus("Chưa tải được dữ liệu nét. Hãy thử lại sau.");
        },
      });
      writerRef.current = writer;

      if (mode === "watch") {
        setStatus(reduceMotion ? "Đã hiển thị cấu trúc chữ." : "Quan sát thứ tự từng nét.");
        if (!reduceMotion) void writer.animateCharacter();
        return;
      }

      setStatus(mode === "trace" ? "Tô theo nét mờ để ghi nhớ bút thuận." : "Tự viết từ trí nhớ; gợi ý xuất hiện sau ba lần sai.");
      void writer.quiz({
        leniency: mode === "trace" ? 1.35 : 0.95,
        showHintAfterMisses: mode === "trace" ? 1 : 3,
        highlightOnComplete: true,
        onCorrectStroke: ({ strokesRemaining }) => {
          if (!canceled) setStatus(strokesRemaining ? `Đúng rồi, còn ${strokesRemaining} nét.` : "Hoàn thành chữ!");
        },
        onMistake: () => {
          if (!canceled) setStatus(mode === "trace" ? "Đi chậm và bám theo nét mờ nhé." : "Nét này chưa đúng, thử lại từ điểm bắt đầu.");
        },
        onComplete: () => {
          if (!canceled) {
            setStatus("Hoàn thành! Tiến độ chữ này đã được lưu.");
            onComplete(character.id);
          }
        },
      });
    }).catch(() => {
      if (!canceled) setStatus("Không thể mở bàn luyện viết lúc này.");
    });

    return () => {
      canceled = true;
      writerRef.current?.cancelQuiz();
      writerRef.current?.pauseAnimation();
      writerRef.current = null;
      board.replaceChildren();
    };
  }, [boardSize, character.hanzi, character.id, mode, onComplete, resetVersion]);

  const chooseCharacter = (nextIndex: number) => {
    setIndex(nextIndex);
    setMode("watch");
    setStatus("Đang chuẩn bị dữ liệu nét…");
    setResetVersion((value) => value + 1);
  };

  const chooseMode = (nextMode: WritingMode) => {
    setMode(nextMode);
    setResetVersion((value) => value + 1);
  };

  return <section className="hsk-hanzi-mode" aria-label="Luyện viết chữ Hán">
    <div className="hsk-mode-intro">
      <div><span>Bút thuận tương tác</span><h2>Xem nét, tô theo, rồi tự viết</h2><p>Bàn viết phản hồi ngay sau mỗi nét và lưu chữ đã hoàn thành.</p></div>
      <strong>{completedCount}/{characters.length} đã luyện</strong>
    </div>

    <div className="hsk-hanzi-layout">
      <nav aria-label="Chọn từ luyện viết" className="hsk-hanzi-list">{characters.map((item, itemIndex) => <button aria-current={itemIndex === index ? "true" : undefined} className={itemIndex === index ? "is-active" : ""} key={item.id} onClick={() => chooseCharacter(itemIndex)} type="button"><span lang="zh-CN">{item.hanzi}</span><small>{item.pinyin}</small>{completed.includes(item.id) || completed.includes(item.hanzi) ? <Check aria-hidden="true" size={14} /> : null}</button>)}</nav>
      <div className="hsk-hanzi-practice">
        <div aria-label="Chế độ luyện viết" className="hsk-writing-modes" role="group">
          <button aria-pressed={mode === "watch"} onClick={() => chooseMode("watch")} type="button"><Eye aria-hidden="true" size={17} /> Xem nét</button>
          <button aria-pressed={mode === "trace"} onClick={() => chooseMode("trace")} type="button"><PenLine aria-hidden="true" size={17} /> Tô theo</button>
          <button aria-pressed={mode === "quiz"} onClick={() => chooseMode("quiz")} type="button"><Sparkles aria-hidden="true" size={17} /> Tự viết</button>
        </div>
        <div className={`hsk-writing-board is-${mode}`}>
          <span aria-hidden="true" className="hsk-grid-horizontal" /><span aria-hidden="true" className="hsk-grid-vertical" />
          <div aria-label={`Khu vực viết chữ ${character.hanzi}`} ref={boardRef} role="img" />
        </div>
        <p aria-live="polite" className="hsk-writing-status">{status}</p>
        <button className="hsk-writing-reset" onClick={() => setResetVersion((value) => value + 1)} type="button"><RotateCcw aria-hidden="true" size={17} /> {mode === "watch" ? "Phát lại" : "Viết lại"}</button>
      </div>
      <aside className="hsk-character-detail"><small>CHỮ TRONG TỪ {index + 1}/{characters.length}</small><strong lang="zh-CN">{character.hanzi}</strong><div><b>{character.pinyin}</b><button aria-label={`Nghe phát âm ${character.hanzi}`} onClick={() => speak(character.hanzi)} type="button"><Volume2 aria-hidden="true" size={18} /></button></div><p>Từ “{character.word}” · {character.meaning}</p><div className="hsk-character-nav"><button aria-label="Chữ trước" onClick={() => chooseCharacter((index - 1 + characters.length) % characters.length)} type="button"><ChevronLeft aria-hidden="true" size={18} /></button><span>{index + 1}/{characters.length}</span><button aria-label="Chữ tiếp theo" onClick={() => chooseCharacter((index + 1) % characters.length)} type="button"><ChevronRight aria-hidden="true" size={18} /></button></div></aside>
    </div>
  </section>;
}

export function HskLessonWorkspace({ lesson, initialMode = "vocabulary", showLaunchActions = true }: {
  lesson: HskLessonContent;
  initialMode?: HskLessonMode;
  showLaunchActions?: boolean;
}) {
  const availableTabs = TABS.filter((tab) => {
    if (tab.id === "vocabulary") return lesson.vocabulary.length > 0;
    if (tab.id === "exercise") return lesson.exercises.length > 0;
    if (tab.id === "pronunciation") return lesson.vocabulary.length > 0;
    return lesson.writingCharacters.length > 0;
  });
  const defaultTab = availableTabs.some((tab) => tab.id === initialMode)
    ? initialMode
    : availableTabs[0]?.id ?? "exercise";
  const [activeTab, setActiveTab] = useState<HskLessonMode>(defaultTab);
  const [progress, setProgress] = useState<HskLessonProgress>(EMPTY_HSK_LESSON_PROGRESS);
  const progressPercent = useMemo(() => calculateHskLessonProgress(lesson, progress), [lesson, progress]);
  const lessonHref = `/hsk/${lesson.levelId.replace(/^hsk-/, "")}/${lesson.id}`;
  const scoredExercises = lesson.exercises.length > 0 && lesson.exercises.every((exercise) => exercise.answer !== null);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      try {
        setProgress(parseHskLessonProgress(window.localStorage.getItem(getHskLessonProgressStorageKey(lesson.id))));
      } catch {
        setProgress(EMPTY_HSK_LESSON_PROGRESS);
      }
    }, 0);
    return () => window.clearTimeout(handle);
  }, [lesson.id]);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const commitProgress = useCallback((updater: (current: HskLessonProgress) => HskLessonProgress) => {
    setProgress((current) => {
      const next = updater(current);
      saveProgress(lesson.id, next);
      return next;
    });
  }, [lesson.id]);

  const speak = useCallback((text: string, rate: SpeechRate = 1) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = rate;
    const voice = window.speechSynthesis.getVoices().find((item) => item.lang.toLocaleLowerCase().startsWith("zh"));
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  }, []);

  const panel = activeTab === "vocabulary"
    ? <VocabularyPanel completed={progress.vocabulary} onComplete={(id) => commitProgress((current) => ({ ...current, vocabulary: addUnique(current.vocabulary, id) }))} onContinue={() => setActiveTab("exercise")} speak={speak} words={lesson.vocabulary} />
    : activeTab === "exercise"
      ? <ExercisePanel bestPercent={progress.exerciseBestPercent} exercises={lesson.exercises} onFinished={(percent) => commitProgress((current) => ({ ...current, exerciseBestPercent: Math.max(current.exerciseBestPercent, percent) }))} onReview={(id) => commitProgress((current) => ({ ...current, reviewedExercises: addUnique(current.reviewedExercises, id) }))} reviewed={progress.reviewedExercises} speak={speak} />
      : activeTab === "pronunciation"
        ? <PronunciationPanel completed={progress.pronunciation} onComplete={(id) => commitProgress((current) => ({ ...current, pronunciation: addUnique(current.pronunciation, id) }))} speak={speak} words={lesson.vocabulary} />
        : <HanziPanel characters={lesson.writingCharacters} completed={progress.writing} onComplete={(writingId) => commitProgress((current) => ({ ...current, writing: addUnique(current.writing, writingId) }))} speak={speak} />;

  return <main className="hsk-lesson-page">
    <header className="hsk-learning-header">
      <div className="hsk-learning-breadcrumb"><Link href="/courses?view=hsk"><ArrowLeft aria-hidden="true" size={17} /> Lộ trình HSK</Link><span>{lesson.levelLabel} · Bài {lesson.lessonNumber}</span></div>
      <div className="hsk-learning-title-row">
        <div className="hsk-learning-greeting" lang="zh-CN">{lesson.greeting}</div>
        <div><span>{lesson.levelLabel} · {lesson.minutes} phút</span><h1>Bài {lesson.lessonNumber}: {lesson.title}</h1><p>{lesson.summary}</p></div>
        <div className="hsk-learning-progress-copy"><strong>{progressPercent}%</strong><span>hoàn thành</span></div>
      </div>
      <div aria-label={`Tiến độ bài học ${progressPercent}%`} aria-valuemax={100} aria-valuemin={0} aria-valuenow={progressPercent} className="hsk-learning-progress" role="progressbar"><span style={{ width: `${progressPercent}%` }} /></div>
      <div className="hsk-learning-meta">
        {lesson.vocabulary.length ? <span><BookOpen aria-hidden="true" size={16} /> {lesson.vocabulary.length} từ trọng tâm</span> : null}
        {lesson.exercises.length ? <span><GraduationCap aria-hidden="true" size={16} /> {lesson.exercises.length} bài tập</span> : null}
        {lesson.writingCharacters.length ? <span><PenLine aria-hidden="true" size={16} /> {lesson.writingCharacters.length} từ luyện viết</span> : null}
      </div>
      {showLaunchActions ? <nav aria-label="Cách học bài này" className="hsk-lesson-launch-actions">
        <Link className="is-primary" href={`${lessonHref}/play`}><Play aria-hidden="true" fill="currentColor" size={17} /><span>Bắt đầu học</span></Link>
        {lesson.vocabulary.length ? <Link href={`${lessonHref}/flashcard`}><BookOpen aria-hidden="true" size={17} /><span>Flashcard</span></Link> : null}
        {lesson.exercises.length ? <Link href={`${lessonHref}/quiz`}><GraduationCap aria-hidden="true" size={17} /><span>{scoredExercises ? "Quiz" : "Bài tập"}</span></Link> : null}
      </nav> : null}
    </header>

    <nav aria-label="Nội dung bài học" className="hsk-learning-tabs" role="tablist">
      {availableTabs.map((tab) => {
        const Icon = tab.icon;
        const selected = activeTab === tab.id;
        return <button aria-controls={`hsk-panel-${tab.id}`} aria-selected={selected} className={selected ? "is-active" : ""} id={`hsk-tab-${tab.id}`} key={tab.id} onClick={() => setActiveTab(tab.id)} role="tab" type="button"><Icon aria-hidden="true" size={19} /><span>{tab.label}</span>{tab.id === "vocabulary" ? <small>{progress.vocabulary.length}/{lesson.vocabulary.length}</small> : null}</button>;
      })}
    </nav>

    <div aria-labelledby={`hsk-tab-${activeTab}`} className="hsk-learning-panel" id={`hsk-panel-${activeTab}`} role="tabpanel">{panel}</div>
  </main>;
}
