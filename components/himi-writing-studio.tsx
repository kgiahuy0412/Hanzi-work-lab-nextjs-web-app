"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type HanziWriter from "hanzi-writer";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  Lightbulb,
  PenLine,
  Play,
  RotateCcw,
  Search,
  Sparkles,
  Volume2,
} from "lucide-react";
import type { WritingCharacter, WritingTopic } from "@/lib/writing-content";

type WritingMode = "watch" | "trace" | "quiz";
type CharacterGroup = "all" | "daily" | "work";

const GROUPS: { value: CharacterGroup; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "daily", label: "Hằng ngày" },
  { value: "work", label: "Công việc" },
];

const MODES: { value: WritingMode; label: string; hint: string; icon: typeof Eye }[] = [
  { value: "watch", label: "Xem nét", hint: "Quan sát thứ tự", icon: Eye },
  { value: "trace", label: "Tô theo", hint: "Viết theo nét mờ", icon: PenLine },
  { value: "quiz", label: "Tự viết", hint: "Không nhìn gợi ý", icon: Sparkles },
];

const STORAGE_KEY = "himi-writing-completed";

function getDailyStorageKey(topicSlug: string): string {
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return `${STORAGE_KEY}:${topicSlug}:${date}`;
}

function getModeMessage(mode: WritingMode): string {
  if (mode === "watch") return "Himi đang chỉ bạn thứ tự từng nét.";
  if (mode === "trace") return "Viết đè lên nét mờ. Sai cũng không sao, Himi sẽ gợi ý.";
  return "Tự viết từ trí nhớ. Sau 3 lần sai, nét đúng sẽ sáng lên.";
}

export function HimiWritingStudio({ topic }: { topic: WritingTopic }) {
  const boardRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<HanziWriter | null>(null);
  const [canvasSize, setCanvasSize] = useState(420);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mode, setMode] = useState<WritingMode>("watch");
  const [group, setGroup] = useState<CharacterGroup>("all");
  const [query, setQuery] = useState("");
  const [resetVersion, setResetVersion] = useState(0);
  const [status, setStatus] = useState("Đang chuẩn bị dữ liệu nét…");
  const [mistakes, setMistakes] = useState(0);
  const [correctStrokes, setCorrectStrokes] = useState(0);
  const [completedCharacters, setCompletedCharacters] = useState<string[]>([]);

  const selected = topic.characters[selectedIndex];
  const filteredCharacters = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("vi-VN");
    return topic.characters.filter((character) => {
      const matchesGroup = group === "all" || character.groups.includes(group);
      const matchesQuery = !normalizedQuery
        || `${character.hanzi} ${character.pinyin} ${character.meaning}`.toLocaleLowerCase("vi-VN").includes(normalizedQuery);
      return matchesGroup && matchesQuery;
    });
  }, [group, query, topic.characters]);

  useEffect(() => {
    let handle: number | undefined;
    try {
      const stored = window.localStorage.getItem(getDailyStorageKey(topic.slug));
      if (stored) {
        handle = window.setTimeout(() => setCompletedCharacters(JSON.parse(stored) as string[]), 0);
      }
    } catch {
      // Progress remains available for the current session if storage is unavailable.
    }
    return () => {
      if (handle) window.clearTimeout(handle);
    };
  }, [topic.slug]);

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const updateSize = () => setCanvasSize(Math.max(250, Math.min(460, Math.floor(board.clientWidth))));
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
      const writer = HanziWriterClass.create(boardRef.current, selected.hanzi, {
        width: canvasSize,
        height: canvasSize,
        padding: Math.round(canvasSize * 0.09),
        renderer: "svg",
        showCharacter: mode === "watch" && reduceMotion,
        showOutline: mode !== "quiz",
        strokeColor: "#153f38",
        radicalColor: "#ff5a4f",
        outlineColor: mode === "trace" ? "#efc7c1" : "#ded8cb",
        highlightColor: "#ff5a4f",
        highlightCompleteColor: "#0d8a79",
        drawingColor: "#ff5a4f",
        drawingWidth: Math.max(7, Math.round(canvasSize / 48)),
        strokeWidth: 3,
        outlineWidth: 2.5,
        strokeAnimationSpeed: 1.25,
        delayBetweenStrokes: 360,
        onLoadCharDataError: () => {
          if (!canceled) setStatus("Chưa tải được dữ liệu nét. Hãy kiểm tra kết nối rồi thử lại.");
        },
      });
      writerRef.current = writer;

      if (mode === "watch") {
        setStatus(reduceMotion ? "Đã hiển thị cấu trúc chữ." : "Theo dõi nét đỏ đang dẫn đường nhé.");
        if (!reduceMotion) void writer.animateCharacter();
        return;
      }

      setStatus(getModeMessage(mode));
      void writer.quiz({
        leniency: mode === "trace" ? 1.35 : 0.95,
        showHintAfterMisses: mode === "trace" ? 1 : 3,
        highlightOnComplete: true,
        onCorrectStroke: ({ strokesRemaining }) => {
          if (canceled) return;
          setCorrectStrokes(selected.strokes - strokesRemaining);
          setStatus(strokesRemaining ? `Đúng rồi! Còn ${strokesRemaining} nét nữa.` : "Hoàn thành chữ rồi!");
        },
        onMistake: ({ totalMistakes }) => {
          if (canceled) return;
          setMistakes(totalMistakes);
          setStatus(mode === "trace" ? "Chậm lại một chút và đi theo nét sáng nhé." : "Nét này chưa đúng. Thử lại từ điểm bắt đầu nhé.");
        },
        onComplete: () => {
          if (canceled) return;
          setCorrectStrokes(selected.strokes);
          setStatus("Tuyệt lắm! Himi đã lưu chữ này vào tiến độ hôm nay.");
          setCompletedCharacters((current) => {
            const next = current.includes(selected.hanzi) ? current : [...current, selected.hanzi];
            try {
              window.localStorage.setItem(getDailyStorageKey(topic.slug), JSON.stringify(next));
            } catch {
              // Completion feedback still works without persistent storage.
            }
            return next;
          });
        },
      });
    }).catch(() => {
      if (!canceled) setStatus("Không thể mở bàn luyện viết lúc này. Hãy tải lại trang.");
    });

    return () => {
      canceled = true;
      writerRef.current?.cancelQuiz();
      writerRef.current?.pauseAnimation();
      writerRef.current = null;
      board.replaceChildren();
    };
  }, [canvasSize, mode, resetVersion, selected, topic.slug]);

  const prepareSession = (nextMode: WritingMode) => {
    setMistakes(0);
    setCorrectStrokes(0);
    setStatus(nextMode === "watch" ? "Himi đang chuẩn bị thứ tự nét…" : getModeMessage(nextMode));
  };

  const chooseCharacter = (character: WritingCharacter) => {
    const nextIndex = topic.characters.indexOf(character);
    prepareSession("watch");
    setSelectedIndex(nextIndex);
    setMode("watch");
    setResetVersion((current) => current + 1);
  };

  const moveCharacter = (direction: -1 | 1) => {
    prepareSession("watch");
    setSelectedIndex((current) => (current + direction + topic.characters.length) % topic.characters.length);
    setMode("watch");
    setResetVersion((current) => current + 1);
  };

  const changeMode = (nextMode: WritingMode) => {
    prepareSession(nextMode);
    setMode(nextMode);
    setResetVersion((current) => current + 1);
  };

  const replayOrReset = () => {
    prepareSession(mode);
    setResetVersion((current) => current + 1);
  };

  const speakCharacter = () => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(selected.hanzi);
    utterance.lang = "zh-CN";
    utterance.rate = 0.78;
    window.speechSynthesis.speak(utterance);
  };

  const progressPercent = Math.min(100, Math.round((correctStrokes / selected.strokes) * 100));

  return (
    <main className="learner-dashboard himi-writing-studio">
      <header className="himi-writing-session-header">
        <Link href={`/writing/${topic.slug}`}><ArrowLeft aria-hidden="true" size={16} /> Quay lại bài học</Link>
        <div><span>{topic.level} · Bài 01</span><h1>{topic.title}</h1></div>
        <strong>{topic.characters.length} chữ trọng tâm</strong>
      </header>
      <section className="himi-writing-workspace" aria-label="Bàn luyện viết Hán tự">
        <aside className="himi-writing-library">
          <div className="himi-writing-library-heading">
            <div><span>Kho chữ</span><strong>{filteredCharacters.length} chữ</strong></div>
            <label className="himi-writing-search">
              <Search aria-hidden="true" size={17} />
              <span className="sr-only">Tìm chữ, pinyin hoặc nghĩa</span>
              <input onChange={(event) => setQuery(event.target.value)} placeholder="Tìm chữ, pinyin, nghĩa…" type="search" value={query} />
            </label>
          </div>
          <div className="himi-writing-groups" aria-label="Lọc kho chữ">
            {GROUPS.map((item) => (
              <button aria-pressed={group === item.value} className={group === item.value ? "active" : ""} key={item.value} onClick={() => setGroup(item.value)} type="button">{item.label}</button>
            ))}
          </div>
          <div className="himi-writing-character-grid">
            {filteredCharacters.map((character) => {
              const active = character.hanzi === selected.hanzi;
              const completed = completedCharacters.includes(character.hanzi);
              return (
                <button
                  aria-label={`${character.hanzi}, ${character.pinyin}, ${character.meaning}${completed ? ", đã luyện" : ""}`}
                  aria-pressed={active}
                  className={`${active ? "active" : ""} ${completed ? "completed" : ""}`.trim()}
                  key={character.hanzi}
                  onClick={() => chooseCharacter(character)}
                  type="button"
                >
                  <span lang="zh-CN">{character.hanzi}</span>
                  <small>{character.pinyin}</small>
                  {completed ? <Check aria-hidden="true" size={12} /> : null}
                </button>
              );
            })}
            {!filteredCharacters.length ? <p className="himi-writing-empty">Chưa tìm thấy chữ phù hợp.</p> : null}
          </div>
        </aside>

        <section className="himi-writing-practice">
          <div className="himi-writing-mode-tabs" aria-label="Chế độ luyện viết">
            {MODES.map((item) => {
              const Icon = item.icon;
              return (
                <button aria-pressed={mode === item.value} className={mode === item.value ? "active" : ""} key={item.value} onClick={() => changeMode(item.value)} type="button">
                  <Icon aria-hidden="true" size={18} />
                  <span><strong>{item.label}</strong><small>{item.hint}</small></span>
                </button>
              );
            })}
          </div>

          <div className={`himi-writing-board-shell is-${mode}`}>
            <span aria-hidden="true" className="himi-writing-grid-line is-horizontal" />
            <span aria-hidden="true" className="himi-writing-grid-line is-vertical" />
            <span aria-hidden="true" className="himi-writing-grid-line is-diagonal-one" />
            <span aria-hidden="true" className="himi-writing-grid-line is-diagonal-two" />
            <div aria-label={`Khu vực viết chữ ${selected.hanzi}`} className="himi-writing-board" ref={boardRef} role="img" />
            <span className="himi-writing-mode-badge">{mode === "watch" ? "Đang xem" : mode === "trace" ? "Đang tô" : "Tự viết"}</span>
          </div>

          <div className="himi-writing-feedback" aria-live="polite">
            <div className="himi-writing-feedback-copy">
              <span className={mistakes ? "has-mistake" : ""}><Lightbulb aria-hidden="true" size={17} /></span>
              <div><strong>{status}</strong><small>{mode === "watch" ? `${selected.strokes} nét · xem từ đầu đến cuối` : `${correctStrokes}/${selected.strokes} nét đúng · ${mistakes} lần cần sửa`}</small></div>
            </div>
            <div className="himi-writing-progress" aria-label={`Hoàn thành ${progressPercent}%`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercent}><span style={{ width: `${progressPercent}%` }} /></div>
          </div>

          <div className="himi-writing-board-actions">
            <button onClick={replayOrReset} type="button"><RotateCcw aria-hidden="true" size={18} /> {mode === "watch" ? "Phát lại" : "Viết lại"}</button>
            {mode !== "quiz" ? <button className="primary" onClick={() => changeMode(mode === "watch" ? "trace" : "quiz")} type="button"><Play aria-hidden="true" fill="currentColor" size={17} /> {mode === "watch" ? "Bắt đầu tô" : "Thử tự viết"}</button> : null}
          </div>
        </section>

        <aside className="himi-writing-character-info">
          <div className="himi-writing-character-card">
            <span className="himi-writing-card-label">Chữ đang luyện</span>
            <strong lang="zh-CN">{selected.hanzi}</strong>
            <div><b>{selected.pinyin}</b><button aria-label={`Nghe phát âm chữ ${selected.hanzi}`} onClick={speakCharacter} type="button"><Volume2 aria-hidden="true" size={19} /></button></div>
            <p>{selected.meaning}</p>
            <div className="himi-writing-meta"><span>{topic.level}</span><span>{selected.strokes} nét</span></div>
          </div>

          <div className="himi-writing-navigation">
            <button aria-label="Chữ trước" onClick={() => moveCharacter(-1)} type="button"><ArrowLeft aria-hidden="true" size={18} /></button>
            <span>{selectedIndex + 1} / {topic.characters.length}</span>
            <button aria-label="Chữ tiếp theo" onClick={() => moveCharacter(1)} type="button"><ArrowRight aria-hidden="true" size={18} /></button>
          </div>

          <div className="himi-writing-daily-card">
            <span><Sparkles aria-hidden="true" size={17} /> Tiến độ hôm nay</span>
            <strong>{completedCharacters.length}<small> / 5 chữ</small></strong>
            <div aria-label={`Đã luyện ${Math.min(completedCharacters.length, 5)} trên 5 chữ`} role="progressbar" aria-valuemin={0} aria-valuemax={5} aria-valuenow={Math.min(completedCharacters.length, 5)}><span style={{ width: `${Math.min(100, completedCharacters.length * 20)}%` }} /></div>
            <p>{completedCharacters.length >= 5 ? "Hoàn thành mục tiêu rồi — giỏi lắm!" : "Mỗi ngày 5 chữ là đủ để tạo thói quen."}</p>
          </div>

          <div className="himi-writing-rule-card">
            <span>Mẹo bút thuận</span>
            <strong>Trên trước, dưới sau.</strong>
            <p>Ưu tiên nét ngang trước nét dọc và đi từ trái sang phải.</p>
          </div>
        </aside>
      </section>
    </main>
  );
}
