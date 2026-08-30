"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type HanziWriter from "hanzi-writer";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  GraduationCap,
  Headphones,
  MessageCircle,
  PenLine,
  Play,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
  Volume2,
  X,
} from "lucide-react";
import type { HskExercise, HskLessonContent } from "@/lib/hsk-lesson-content";
import { buildHskGuidedLessonSteps, buildHskGuidedSections, type HskGuidedStepKind } from "@/lib/hsk-guided-lesson";
import {
  EMPTY_HSK_LESSON_PROGRESS,
  getHskLessonProgressStorageKey,
  parseHskLessonProgress,
  type HskLessonProgress,
} from "@/lib/hsk-lesson-progress";

type SpeechRate = 0.75 | 1 | 1.25;
type WritingMode = "watch" | "trace" | "quiz";

const SECTION_ICONS = {
  introduction: BookOpen,
  vocabulary: Sparkles,
  grammar: GraduationCap,
  dialogue: MessageCircle,
  pronunciation: Headphones,
  writing: PenLine,
  practice: Target,
  complete: Trophy,
} satisfies Record<HskGuidedStepKind, typeof BookOpen>;

function saveProgress(lessonId: string, progress: HskLessonProgress) {
  try {
    window.localStorage.setItem(getHskLessonProgressStorageKey(lessonId), JSON.stringify(progress));
  } catch {
    // The guided lesson stays usable when browser storage is unavailable.
  }
}

function GuidedIntroduction({ lesson }: { lesson: HskLessonContent }) {
  return <section className="hsk-guided-introduction">
    <span className="hsk-guided-kicker">Bài {lesson.lessonNumber} · {lesson.levelLabel}</span>
    <div className="hsk-guided-hero-character" lang="zh-CN">{lesson.greeting}</div>
    <h1>{lesson.title}</h1>
    <p>{lesson.summary}</p>
    <div className="hsk-guided-stats">
      <div><BookOpen aria-hidden="true" size={20} /><strong>{lesson.vocabulary.length}</strong><span>từ vựng</span></div>
      <div><GraduationCap aria-hidden="true" size={20} /><strong>{lesson.grammar.length}</strong><span>ngữ pháp</span></div>
      <div><MessageCircle aria-hidden="true" size={20} /><strong>{lesson.dialogues.length}</strong><span>hội thoại</span></div>
      <div><Target aria-hidden="true" size={20} /><strong>~{lesson.minutes}</strong><span>phút học</span></div>
    </div>
    <p className="hsk-guided-tip"><Sparkles aria-hidden="true" size={16} /> Dùng phím mũi tên để chuyển nhanh giữa các bước.</p>
  </section>;
}

function GuidedVocabulary({ lesson, itemIndex, showPinyin, speak }: {
  lesson: HskLessonContent;
  itemIndex: number;
  showPinyin: boolean;
  speak: (text: string) => void;
}) {
  const word = lesson.vocabulary[itemIndex];
  return <section className="hsk-guided-vocabulary">
    <span className="hsk-guided-kicker">Từ mới · {String(itemIndex + 1).padStart(2, "0")}/{lesson.vocabulary.length}</span>
    <div className="hsk-guided-word-heading">
      <div>
        <strong lang="zh-CN">{word.hanzi}</strong>
        {showPinyin ? <span>{word.pinyin}</span> : null}
      </div>
      <button aria-label={`Phát âm ${word.hanzi}`} className="hsk-guided-audio" onClick={() => speak(word.hanzi)} type="button"><Volume2 aria-hidden="true" size={24} /></button>
    </div>
    <span className="hsk-guided-word-class">{word.wordClass}</span>

    <div className="hsk-guided-word-grid">
      <article>
        <small>Nghĩa của từ</small>
        <h2>{word.meaning}</h2>
        <div className="hsk-guided-example">
          <div><span>Ví dụ</span><button aria-label="Phát âm câu ví dụ" onClick={() => speak(word.example)} type="button"><Volume2 aria-hidden="true" size={17} /></button></div>
          <strong lang="zh-CN">{word.example}</strong>
          {showPinyin ? <b>{word.examplePinyin}</b> : null}
          <p>{word.translation}</p>
        </div>
      </article>
      <aside>
        <small>Bộ thủ cấu tạo</small>
        {(word.radicals?.length ? word.radicals : [{ glyph: word.hanzi[0], name: "Thành phần gợi nhớ", strokes: word.hanzi.length, note: `Quan sát cấu trúc của chữ ${word.hanzi} trước khi luyện viết.` }]).map((radical) => <div className="hsk-guided-radical" key={`${word.id}-${radical.glyph}`}>
          <strong lang="zh-CN">{radical.glyph}</strong>
          <div><b>{radical.name}</b><span>{radical.strokes} nét</span><p>{radical.note}</p></div>
        </div>)}
      </aside>
    </div>
  </section>;
}

function GuidedGrammar({ lesson, itemIndex, showPinyin, speak }: {
  lesson: HskLessonContent;
  itemIndex: number;
  showPinyin: boolean;
  speak: (text: string) => void;
}) {
  const point = lesson.grammar[itemIndex];
  return <section className="hsk-guided-grammar">
    <span className="hsk-guided-kicker">Điểm ngữ pháp · {itemIndex + 1}/{lesson.grammar.length}</span>
    <h1>{point.title}</h1>
    <code>{point.formula}</code>
    <p>{point.explanation}</p>
    <div className="hsk-guided-grammar-examples">
      {point.examples.map((example) => <article key={example.hanzi}>
        <button aria-label={`Phát âm ${example.hanzi}`} onClick={() => speak(example.hanzi)} type="button"><Volume2 aria-hidden="true" size={19} /></button>
        <strong lang="zh-CN">{example.hanzi}</strong>
        {showPinyin ? <span>{example.pinyin}</span> : null}
        <p>{example.translation}</p>
      </article>)}
    </div>
  </section>;
}

function GuidedDialogue({ lesson, itemIndex, showPinyin, speak }: {
  lesson: HskLessonContent;
  itemIndex: number;
  showPinyin: boolean;
  speak: (text: string) => void;
}) {
  const dialogue = lesson.dialogues[itemIndex];
  const fullDialogue = dialogue.turns.map((turn) => turn.hanzi).join(" ");
  return <section className="hsk-guided-dialogue">
    <span className="hsk-guided-kicker">Hội thoại · {itemIndex + 1}/{lesson.dialogues.length}</span>
    <div className="hsk-guided-dialogue-title"><div><h1>{dialogue.title}</h1><p>{dialogue.setting}</p></div><button onClick={() => speak(fullDialogue)} type="button"><Play aria-hidden="true" fill="currentColor" size={16} /> Nghe toàn bài</button></div>
    <div className="hsk-guided-dialogue-list">
      {dialogue.turns.map((turn, index) => <article className={index % 2 ? "is-peer" : ""} key={`${dialogue.id}-${turn.speaker}-${index}`}>
        <span>{turn.speaker.slice(0, 1)}</span>
        <div><small>{turn.speaker}</small><strong lang="zh-CN">{turn.hanzi}</strong>{showPinyin ? <b>{turn.pinyin}</b> : null}<p>{turn.translation}</p></div>
        <button aria-label={`Phát âm lượt nói của ${turn.speaker}`} onClick={() => speak(turn.hanzi)} type="button"><Volume2 aria-hidden="true" size={18} /></button>
      </article>)}
    </div>
  </section>;
}

function GuidedPronunciation({ lesson }: { lesson: HskLessonContent }) {
  return <section className="hsk-guided-grammar hsk-guided-pronunciation">
    <span className="hsk-guided-kicker">Phát âm</span>
    <h1>Trọng tâm ghép âm và thanh điệu</h1>
    <p>{lesson.audioAvailable
      ? "Nghe mẫu và luyện đọc lần lượt theo từng trọng tâm."
      : "Audio gốc của giáo trình chưa có; nút phát âm trong bài đang dùng giọng đọc tiếng Trung của thiết bị."}</p>
    <div className="hsk-guided-grammar-examples">
      {lesson.pronunciationTopics.map((topic, index) => <article key={topic}>
        <Headphones aria-hidden="true" size={19} />
        <strong>{index + 1}. {topic}</strong>
      </article>)}
    </div>
  </section>;
}

function GuidedWriting({ lesson, speak, onComplete }: {
  lesson: HskLessonContent;
  speak: (text: string) => void;
  onComplete: (hanzi: string) => void;
}) {
  const boardRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<HanziWriter | null>(null);
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState<WritingMode>("watch");
  const [version, setVersion] = useState(0);
  const [status, setStatus] = useState("Quan sát thứ tự từng nét.");
  const character = lesson.writingCharacters[index];

  useEffect(() => {
    let canceled = false;
    const board = boardRef.current;
    if (!board) return;
    board.replaceChildren();
    const size = Math.max(250, Math.min(360, Math.floor(board.clientWidth || 330)));

    void import("hanzi-writer").then(({ default: HanziWriterClass }) => {
      if (canceled || !boardRef.current) return;
      const writer = HanziWriterClass.create(boardRef.current, character.hanzi, {
        width: size,
        height: size,
        padding: Math.round(size * .09),
        showCharacter: false,
        showOutline: mode !== "quiz",
        strokeColor: "#153f38",
        radicalColor: "#ff6d55",
        outlineColor: mode === "trace" ? "#efc9c3" : "#d8e4df",
        highlightColor: "#ff6d55",
        drawingColor: "#ff6d55",
        drawingWidth: 8,
      });
      writerRef.current = writer;
      if (mode === "watch") {
        setStatus("Quan sát thứ tự từng nét.");
        void writer.animateCharacter();
      } else {
        setStatus(mode === "trace" ? "Tô theo nét mờ để ghi nhớ bút thuận." : "Tự viết từ trí nhớ; hệ thống sẽ gợi ý khi cần.");
        void writer.quiz({
          leniency: mode === "trace" ? 1.35 : .95,
          showHintAfterMisses: mode === "trace" ? 1 : 3,
          onCorrectStroke: ({ strokesRemaining }) => setStatus(strokesRemaining ? `Đúng rồi, còn ${strokesRemaining} nét.` : "Hoàn thành chữ!"),
          onMistake: () => setStatus("Nét này chưa đúng, thử lại từ điểm bắt đầu nhé."),
          onComplete: () => {
            setStatus("Hoàn thành! Chữ này đã được lưu vào tiến độ.");
            onComplete(character.hanzi);
          },
        });
      }
    }).catch(() => setStatus("Chưa thể tải bàn viết. Hãy thử lại sau."));

    return () => {
      canceled = true;
      writerRef.current?.cancelQuiz();
      writerRef.current?.pauseAnimation();
      writerRef.current = null;
      board.replaceChildren();
    };
  }, [character.hanzi, mode, onComplete, version]);

  const chooseCharacter = (next: number) => {
    setIndex(next);
    setMode("watch");
    setVersion((current) => current + 1);
  };

  return <section className="hsk-guided-writing">
    <span className="hsk-guided-kicker">Luyện viết</span>
    <h1>Luyện viết chữ Hán</h1>
    <div className="hsk-guided-writing-picker" aria-label="Chọn chữ Hán">{lesson.writingCharacters.map((item, itemIndex) => <button aria-pressed={itemIndex === index} key={item.hanzi} onClick={() => chooseCharacter(itemIndex)} type="button"><span lang="zh-CN">{item.hanzi}</span><small>{itemIndex + 1}/{lesson.writingCharacters.length}</small></button>)}</div>
    <div className="hsk-guided-writing-layout">
      <div>
        <div aria-label="Chế độ luyện viết" className="hsk-guided-writing-modes" role="group">
          {([ ["watch", "Xem"], ["trace", "Tô lại"], ["quiz", "Kiểm tra"] ] as Array<[WritingMode, string]>).map(([value, label]) => <button aria-pressed={mode === value} key={value} onClick={() => { setMode(value); setVersion((current) => current + 1); }} type="button">{label}</button>)}
        </div>
        <div className="hsk-guided-writing-board"><span aria-hidden="true" /><span aria-hidden="true" /><div aria-label={`Khu vực viết chữ ${character.hanzi}`} ref={boardRef} role="img" /></div>
        <p aria-live="polite">{status}</p>
      </div>
      <aside><strong lang="zh-CN">{character.hanzi}</strong><div><b>{character.pinyin}</b><button aria-label={`Phát âm ${character.hanzi}`} onClick={() => speak(character.hanzi)} type="button"><Volume2 aria-hidden="true" size={19} /></button></div><p>{character.meaning}</p><button onClick={() => setVersion((current) => current + 1)} type="button"><RotateCcw aria-hidden="true" size={17} /> {mode === "watch" ? "Phát lại" : "Viết lại"}</button></aside>
    </div>
  </section>;
}

function GuidedPractice({ exercise, speak }: { exercise: HskExercise; speak: (text: string) => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const correct = selected === exercise.answer;
  return <section className="hsk-guided-practice">
    <span className="hsk-guided-kicker">Luyện tập nhanh</span>
    <h1>{exercise.instruction}</h1>
    {exercise.type === "listening" ? <button className="hsk-guided-listen" onClick={() => speak(exercise.speakText ?? exercise.answer)} type="button"><Headphones aria-hidden="true" size={32} /><span>Nghe lại</span></button> : <div className="hsk-guided-practice-prompt" lang="zh-CN">{exercise.prompt}</div>}
    <div className="hsk-guided-practice-options">{exercise.options.map((option, index) => {
      const state = selected ? option === exercise.answer ? " is-correct" : option === selected ? " is-wrong" : "" : "";
      return <button className={state} key={option} onClick={() => setSelected(option)} type="button"><b>{String.fromCharCode(65 + index)}</b><span>{option}</span>{state === " is-correct" ? <Check aria-hidden="true" size={18} /> : null}</button>;
    })}</div>
    {selected ? <p className={`hsk-guided-practice-feedback ${correct ? "is-correct" : "is-wrong"}`} role="status">{correct ? "Chính xác! Bạn đã nắm được từ này." : `Chưa đúng. Đáp án là “${exercise.answer}”.`}</p> : null}
  </section>;
}

function GuidedCompletion({ lesson }: { lesson: HskLessonContent }) {
  const baseHref = `/hsk/${lesson.levelId.replace(/^hsk-/, "")}/${lesson.id}`;
  return <section className="hsk-guided-completion">
    <span><Trophy aria-hidden="true" size={34} /></span>
    <small>Hoàn thành</small>
    <h1>Hoàn thành bài học!</h1>
    <p>Bạn vừa học xong <strong>Bài {lesson.lessonNumber}: {lesson.title}</strong>.</p>
    <div><article><strong>{lesson.vocabulary.length}</strong><span>từ vựng</span></article><article><strong>{lesson.grammar.length}</strong><span>điểm ngữ pháp</span></article><article><strong>{lesson.writingCharacters.length}</strong><span>chữ luyện viết</span></article></div>
    <nav><Link href="/courses?view=hsk">Danh sách bài học</Link><Link href={`${baseHref}/flashcard`}>Ôn tập Flashcard</Link></nav>
  </section>;
}

export function HskGuidedLesson({ lesson }: { lesson: HskLessonContent }) {
  const steps = useMemo(() => buildHskGuidedLessonSteps(lesson), [lesson]);
  const sections = useMemo(() => buildHskGuidedSections(lesson), [lesson]);
  const [currentStep, setCurrentStep] = useState(0);
  const [showPinyin, setShowPinyin] = useState(true);
  const [rate, setRate] = useState<SpeechRate>(1);
  const [, setProgress] = useState<HskLessonProgress>(EMPTY_HSK_LESSON_PROGRESS);
  const step = steps[currentStep];
  const baseHref = `/hsk/${lesson.levelId.replace(/^hsk-/, "")}/${lesson.id}`;

  useEffect(() => {
    const handle = window.setTimeout(() => {
      try {
        const saved = parseHskLessonProgress(window.localStorage.getItem(getHskLessonProgressStorageKey(lesson.id)));
        setProgress(saved);
        if (saved.guidedStep >= 0) setCurrentStep(Math.min(saved.guidedStep, steps.length - 1));
      } catch {
        setProgress(EMPTY_HSK_LESSON_PROGRESS);
      }
    }, 0);
    return () => window.clearTimeout(handle);
  }, [lesson.id, steps.length]);

  const commit = useCallback((updates: Partial<HskLessonProgress> | ((current: HskLessonProgress) => Partial<HskLessonProgress>)) => {
    setProgress((current) => {
      const patch = typeof updates === "function" ? updates(current) : updates;
      const next = { ...current, ...patch };
      saveProgress(lesson.id, next);
      return next;
    });
  }, [lesson.id]);

  const goToStep = useCallback((next: number) => {
    const clamped = Math.max(0, Math.min(steps.length - 1, next));
    setCurrentStep(clamped);
    commit((current) => ({ guidedStep: clamped, guidedCompleted: clamped === steps.length - 1 || current.guidedCompleted }));
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [commit, steps.length]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("button, a, input, textarea, select")) return;
      if (event.key === "ArrowLeft") { event.preventDefault(); goToStep(currentStep - 1); }
      if (event.key === "ArrowRight") { event.preventDefault(); goToStep(currentStep + 1); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [currentStep, goToStep]);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const speak = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = rate;
    const voice = window.speechSynthesis.getVoices().find((candidate) => candidate.lang.toLowerCase().startsWith("zh"));
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  }, [rate]);

  const completeWriting = useCallback((hanzi: string) => {
    commit((current) => ({ writing: current.writing.includes(hanzi) ? current.writing : [...current.writing, hanzi] }));
  }, [commit]);

  let content = <GuidedIntroduction lesson={lesson} />;
  if (step.kind === "vocabulary") content = <GuidedVocabulary itemIndex={step.itemIndex ?? 0} lesson={lesson} showPinyin={showPinyin} speak={speak} />;
  if (step.kind === "grammar") content = <GuidedGrammar itemIndex={step.itemIndex ?? 0} lesson={lesson} showPinyin={showPinyin} speak={speak} />;
  if (step.kind === "dialogue") content = <GuidedDialogue itemIndex={step.itemIndex ?? 0} lesson={lesson} showPinyin={showPinyin} speak={speak} />;
  if (step.kind === "pronunciation") content = <GuidedPronunciation lesson={lesson} />;
  if (step.kind === "writing") content = <GuidedWriting lesson={lesson} onComplete={completeWriting} speak={speak} />;
  if (step.kind === "practice") content = <GuidedPractice exercise={lesson.exercises[step.itemIndex ?? 0]} speak={speak} />;
  if (step.kind === "complete") content = <GuidedCompletion lesson={lesson} />;

  return <div className="hsk-guided-page">
    <header className="hsk-guided-header">
      <div className="hsk-guided-toolbar">
        <Link aria-label="Thoát bài học" href={baseHref}><X aria-hidden="true" size={22} /></Link>
        <div aria-label={`Bước ${currentStep + 1} trên ${steps.length}`} aria-valuemax={steps.length} aria-valuemin={1} aria-valuenow={currentStep + 1} className="hsk-guided-progress" role="progressbar"><span style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }} /></div>
        <strong>{currentStep + 1} / {steps.length}</strong>
        <button aria-label={showPinyin ? "Ẩn pinyin" : "Hiện pinyin"} aria-pressed={showPinyin} className="hsk-guided-pinyin" onClick={() => setShowPinyin((current) => !current)} type="button"><b aria-hidden="true">pīn</b></button>
        <div aria-label="Tốc độ phát" className="hsk-guided-speed" role="group">{([0.75, 1, 1.25] as SpeechRate[]).map((value) => <button aria-pressed={rate === value} key={value} onClick={() => setRate(value)} type="button">{value}×</button>)}</div>
      </div>
      <nav aria-label="Các chặng trong bài học" className="hsk-guided-sections">
        {sections.map((section) => {
          const Icon = SECTION_ICONS[section.id];
          return <button aria-current={step.kind === section.id ? "step" : undefined} className={step.kind === section.id ? "is-active" : ""} key={section.id} onClick={() => goToStep(section.start)} type="button"><Icon aria-hidden="true" size={17} /><span>{section.label}</span>{section.count ? <b>{section.count}</b> : null}</button>;
        })}
      </nav>
    </header>

    <main className={`hsk-guided-main is-${step.kind}`}>{content}</main>

    {step.kind !== "complete" ? <footer className="hsk-guided-footer">
      <button disabled={currentStep === 0} onClick={() => goToStep(currentStep - 1)} type="button"><ArrowLeft aria-hidden="true" size={19} /><span>Trước</span></button>
      <span>Bước {currentStep + 1} / {steps.length}</span>
      <button className="is-primary" onClick={() => goToStep(currentStep + 1)} type="button"><span>Tiếp</span><ArrowRight aria-hidden="true" size={19} /></button>
    </footer> : null}
  </div>;
}
