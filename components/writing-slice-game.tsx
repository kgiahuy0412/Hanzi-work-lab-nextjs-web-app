/* eslint-disable @next/next/no-img-element */
"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Heart,
  Keyboard,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from "react";
import { gameWords, speakChinese } from "@/lib/game-content";

type GameMode = "ready" | "playing" | "paused" | "slicing" | "complete" | "gameover";

type StrikeMotion = {
  x: number;
  y: number;
  approachX: number;
  approachY: number;
  impactX: number;
  impactY: number;
  exitX: number;
  exitY: number;
};

const TARGET_ROUNDS = 12;

function normalizeAnswer(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("vi-VN")
    .replace(/[^a-z\s]/gu, "")
    .replace(/\s+/gu, " ")
    .trim();
}

function GameOverlay({
  mode,
  score,
  onStart,
  completionAction,
}: {
  mode: GameMode;
  score: number;
  onStart: () => void;
  completionAction?: ReactNode;
}) {
  if (!(["ready", "complete", "gameover"] as GameMode[]).includes(mode)) return null;

  const complete = mode === "complete";
  const gameover = mode === "gameover";
  return (
    <div className="writing-game-overlay">
      <span className="writing-overlay-mark" aria-hidden="true">
        {complete ? <Check size={28} /> : gameover ? <RotateCcw size={26} /> : <Keyboard size={28} />}
      </span>
      <span className="writing-overlay-kicker">
        {complete ? "Lượt luyện hoàn tất" : gameover ? "Cánh Cụt cần nghỉ một nhịp" : "Phản xạ pinyin"}
      </span>
      <h2>{complete ? `${score} điểm — rất gọn!` : gameover ? "Mình thử lại chậm hơn nhé." : "Gõ đúng. Cánh Cụt chém gọn."}</h2>
      <p>
        {complete
          ? "Bạn đã xử lý đủ 12 từ của lượt hôm nay."
          : gameover
            ? "Ba từ đã chạm đất. Lượt mới sẽ bắt đầu lại từ đầu."
            : "Nhìn Hán tự đang rơi, gõ pinyin không dấu hoặc có dấu. Đúng từ là Cánh Cụt sẽ lao lên cắt ngay."}
      </p>
      <button className="writing-primary-action" onClick={onStart} type="button">
        <Play fill="currentColor" size={16} /> {mode === "ready" ? "Bắt đầu chém từ" : "Chơi lại"}
      </button>
      {complete ? completionAction : null}
      {mode === "ready" ? <small>Enter để chốt · Không cần gõ dấu thanh</small> : null}
    </div>
  );
}

export function WritingSliceGame({
  onExit,
  onComplete,
  completionAction,
}: {
  onExit?: () => void;
  onComplete?: (score: number) => void;
  completionAction?: ReactNode;
} = {}) {
  const [mode, setMode] = useState<GameMode>("ready");
  const [wordIndex, setWordIndex] = useState(0);
  const [runKey, setRunKey] = useState(0);
  const [answer, setAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [missed, setMissed] = useState(false);
  const [strikePoint, setStrikePoint] = useState<StrikeMotion>({
    x: 50,
    y: 44,
    approachX: 120,
    approachY: -110,
    impactX: 150,
    impactY: -180,
    exitX: 270,
    exitY: -300,
  });
  const arenaRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLDivElement>(null);
  const penguinRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextTimerRef = useRef<number | null>(null);

  const word = gameWords[wordIndex];
  const normalizedTarget = useMemo(() => normalizeAnswer(word.pinyin), [word.pinyin]);
  const gameStyle = {
    "--word-lane": `${word.lane}%`,
    "--fall-duration": `${word.duration}s`,
    "--strike-x": `${strikePoint.x}%`,
    "--strike-y": `${strikePoint.y}%`,
    "--strike-approach-x": `${strikePoint.approachX}px`,
    "--strike-approach-y": `${strikePoint.approachY}px`,
    "--strike-impact-x": `${strikePoint.impactX}px`,
    "--strike-impact-y": `${strikePoint.impactY}px`,
    "--strike-exit-x": `${strikePoint.exitX}px`,
    "--strike-exit-y": `${strikePoint.exitY}px`,
  } as CSSProperties;

  useEffect(() => () => {
    if (nextTimerRef.current) window.clearTimeout(nextTimerRef.current);
    window.speechSynthesis?.cancel();
  }, []);

  useEffect(() => {
    if (mode === "playing") inputRef.current?.focus({ preventScroll: true });
  }, [mode, runKey]);

  const clearNextTimer = () => {
    if (!nextTimerRef.current) return;
    window.clearTimeout(nextTimerRef.current);
    nextTimerRef.current = null;
  };

  const startGame = () => {
    clearNextTimer();
    window.speechSynthesis?.cancel();
    setMode("playing");
    setWordIndex(0);
    setRunKey((value) => value + 1);
    setAnswer("");
    setScore(0);
    setCombo(0);
    setCompleted(0);
    setHearts(3);
    setMissed(false);
  };

  const advanceWord = (nextMode: GameMode = "playing") => {
    setWordIndex((value) => (value + 1) % gameWords.length);
    setRunKey((value) => value + 1);
    setAnswer("");
    setMissed(false);
    setMode(nextMode);
  };

  const measureStrikePoint = () => {
    const arena = arenaRef.current?.getBoundingClientRect();
    const target = wordRef.current?.getBoundingClientRect();
    const penguin = penguinRef.current?.getBoundingClientRect();
    if (!arena || !target || !penguin) return;
    const targetX = target.left + target.width / 2;
    const targetY = target.top + target.height / 2;
    // Align the upper tip of the penguin's diagonal bamboo staff with the word.
    const impactLeft = targetX - penguin.width * 0.86;
    const impactTop = targetY - penguin.height * 0.16;
    const impactX = impactLeft - penguin.left;
    const impactY = impactTop - penguin.top;
    setStrikePoint({
      x: Math.max(12, Math.min(88, ((targetX - arena.left) / arena.width) * 100)),
      y: Math.max(18, Math.min(78, ((targetY - arena.top) / arena.height) * 100)),
      approachX: impactX * 0.68 - 16,
      approachY: impactY * 0.62 + 28,
      impactX,
      impactY,
      exitX: impactX + Math.max(100, arena.width * 0.12),
      exitY: impactY - Math.max(110, arena.height * 0.2),
    });
  };

  const handleCorrect = () => {
    if (mode !== "playing") return;
    measureStrikePoint();
    window.speechSynthesis?.cancel();
    const nextCombo = combo + 1;
    const nextCompleted = completed + 1;
    setCombo(nextCombo);
    setCompleted(nextCompleted);
    setScore((value) => value + 100 + Math.min(nextCombo - 1, 5) * 20);
    setMode("slicing");
    clearNextTimer();
    nextTimerRef.current = window.setTimeout(() => {
      if (nextCompleted >= TARGET_ROUNDS) {
        setMode("complete");
        setAnswer("");
        onComplete?.(score + 100 + Math.min(nextCombo - 1, 5) * 20);
        return;
      }
      advanceWord();
    }, 1780);
  };

  const handleMiss = () => {
    if (mode !== "playing") return;
    const nextHearts = hearts - 1;
    setHearts(nextHearts);
    setCombo(0);
    setMissed(true);
    setMode(nextHearts <= 0 ? "gameover" : "paused");
    if (nextHearts <= 0) return;
    clearNextTimer();
    nextTimerRef.current = window.setTimeout(() => advanceWord(), 700);
  };

  const updateAnswer = (value: string) => {
    setAnswer(value);
    if (mode === "playing" && normalizeAnswer(value) === normalizedTarget) handleCorrect();
  };

  const submitAnswer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (normalizeAnswer(answer) === normalizedTarget) handleCorrect();
    else if (answer.trim()) {
      setMissed(true);
      window.setTimeout(() => setMissed(false), 560);
    }
  };

  const speakWord = () => {
    speakChinese(word.hanzi);
  };

  const togglePause = () => {
    if (mode === "playing") setMode("paused");
    else if (mode === "paused" && !missed) setMode("playing");
  };

  return (
    <main className="learner-dashboard writing-game-dashboard game-immersive-dashboard">
      <div className="writing-page-shell">
        <h1 className="writing-page-title">Luyện chém từ cùng Cánh Cụt</h1>
        <div className="writing-game-layout">
          <section className="writing-arena-column" aria-label="Sân chơi chém từ">
            <div className={`writing-arena is-${mode}`} ref={arenaRef} style={gameStyle}>
              <img
                alt=""
                aria-hidden="true"
                className="writing-arena-background"
                height="1080"
                src="/assets/writing/bamboo-landscape.webp"
                width="1920"
              />

              {onExit ? (
                <button aria-label="Quay lại tất cả trò chơi" className="writing-game-back" onClick={onExit} type="button">
                  <ArrowLeft size={18} />
                  <span>Tất cả trò chơi</span>
                </button>
              ) : null}

              <div className="writing-arena-metrics" aria-label="Tiến độ lượt luyện">
                <span>
                  <strong>{completed}<em> / {TARGET_ROUNDS}</em></strong>
                  <small>ĐÃ CHÉM</small>
                </span>
                <span>
                  <strong>{score}</strong>
                  <small>ĐIỂM</small>
                </span>
              </div>

              <div className="writing-arena-topline">
                <div className="writing-arena-controls">
                  <button aria-label={mode === "paused" ? "Tiếp tục" : "Tạm dừng"} disabled={mode === "ready" || mode === "slicing" || mode === "complete" || mode === "gameover"} onClick={togglePause} type="button">
                    {mode === "paused" ? <Play fill="currentColor" size={15} /> : <Pause fill="currentColor" size={15} />}
                  </button>
                </div>
                <span>LƯỢT {Math.min(completed + 1, TARGET_ROUNDS)} / {TARGET_ROUNDS}</span>
                <span className="writing-hearts" aria-label={`${hearts} lượt còn lại`}>
                  {[0, 1, 2].map((index) => <Heart fill={index < hearts ? "currentColor" : "none"} key={index} size={17} />)}
                </span>
              </div>

              <div className="writing-target-ribbon">
                <span>Từ cần gõ</span>
                <strong lang="zh-CN">{word.hanzi}</strong>
                <small>{word.meaning}</small>
              </div>

              <div
                className={`writing-falling-word ${mode === "slicing" ? "is-sliced" : ""}`}
                key={runKey}
                onAnimationEnd={(event) => {
                  if (event.animationName === "writing-word-fall") handleMiss();
                }}
                ref={wordRef}
              >
                <span className="writing-word-face">
                  <span className="writing-word-whole" lang="zh-CN">{word.hanzi}</span>
                  <small>{word.meaning}</small>
                </span>
                <span aria-hidden="true" className="writing-word-half is-left" lang="zh-CN">{word.hanzi}</span>
                <span aria-hidden="true" className="writing-word-half is-right" lang="zh-CN">{word.hanzi}</span>
              </div>

              <div className="writing-penguin" ref={penguinRef}>
                <img
                  alt=""
                  aria-hidden="true"
                  className="writing-penguin-cape"
                  height="1254"
                  src="/assets/writing/penguin-bamboo-warrior-cape.png"
                  width="1254"
                />
                <img
                  alt="Chim cánh cụt đội nón tre và cầm gậy tre"
                  className="writing-penguin-body"
                  height="1254"
                  src="/assets/writing/penguin-bamboo-warrior.png"
                  width="1254"
                />
              </div>

              <img
                alt=""
                aria-hidden="true"
                className="writing-slice-impact"
                height="1254"
                src="/assets/writing/bamboo-slice-burst.png"
                width="1254"
              />
              <span aria-hidden="true" className="writing-hit-score">
                +{100 + Math.min(Math.max(combo - 1, 0), 5) * 20}
              </span>

              <div className="writing-combo" aria-live="polite">
                {combo >= 2 && mode !== "ready" ? <><Sparkles size={15} /> Combo x{combo}</> : null}
              </div>

              <GameOverlay completionAction={completionAction} mode={mode} onStart={startGame} score={score} />
              {mode === "paused" && !missed ? (
                <button className="writing-pause-overlay" onClick={togglePause} type="button"><Play fill="currentColor" size={18} /> Tiếp tục</button>
              ) : null}
            </div>

            <form className={`writing-answer-bar ${missed ? "has-error" : ""}`} onSubmit={submitAnswer}>
              <label htmlFor="writing-answer">Gõ pinyin của từ đang rơi</label>
              <div>
                <Keyboard aria-hidden="true" size={20} />
                <input
                  autoComplete="off"
                  disabled={mode !== "playing"}
                  id="writing-answer"
                  onChange={(event) => updateAnswer(event.target.value)}
                  placeholder={mode === "playing" ? "Ví dụ: ni hao" : "Bấm bắt đầu để luyện"}
                  ref={inputRef}
                  spellCheck={false}
                  value={answer}
                />
                <button aria-label="Chốt đáp án" disabled={mode !== "playing" || !answer.trim()} type="submit"><ArrowRight size={19} /></button>
              </div>
              <span aria-live="polite">
                {missed ? <><X size={14} /> Chưa khớp — thử lại trước khi chữ chạm đất.</> : "Có thể gõ không dấu và dùng phím cách giữa các âm."}
              </span>
            </form>
          </section>

          <aside className="writing-session-aside">
            <section className="writing-current-word">
              <span>TỪ HIỆN TẠI</span>
              <div>
                <strong lang="zh-CN">{word.hanzi}</strong>
                <button aria-label="Nghe phát âm" onClick={speakWord} type="button"><Volume2 size={18} /></button>
              </div>
              <b>{word.pinyin}</b>
              <p>{word.example}</p>
            </section>

            <section className="writing-howto">
              <span>NHỊP CHƠI</span>
              <ol>
                <li><b>01</b><span>Nhìn Hán tự và nghĩa gợi ý.</span></li>
                <li><b>02</b><span>Gõ pinyin trước khi từ chạm đất.</span></li>
                <li><b>03</b><span>Đúng từ để Cánh Cụt chém và giữ combo.</span></li>
              </ol>
            </section>

            <section className="writing-session-note">
              <span><Sparkles size={16} /> Mẹo lượt này</span>
              <p>Ưu tiên đúng âm trước. Dấu thanh sẽ được luyện lại ở lượt nâng cao.</p>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
