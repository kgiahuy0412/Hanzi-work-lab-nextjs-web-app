/* eslint-disable @next/next/no-img-element */
"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
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

gsap.registerPlugin(useGSAP);

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
  const fallTweenRef = useRef<gsap.core.Tween | null>(null);
  const strikeTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const pendingStrikeRef = useRef<{ finalScore: number; nextCompleted: number } | null>(null);

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
    fallTweenRef.current?.kill();
    strikeTimelineRef.current?.kill();
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

  const measureStrikePoint = (): StrikeMotion | null => {
    const arena = arenaRef.current?.getBoundingClientRect();
    const target = wordRef.current?.getBoundingClientRect();
    const penguin = penguinRef.current?.getBoundingClientRect();
    if (!arena || !target || !penguin) return null;
    const targetX = target.left + target.width / 2;
    const targetY = target.top + target.height / 2;
    // Align the upper tip of the penguin's diagonal bamboo staff with the word.
    const impactLeft = targetX - penguin.width * 0.86;
    const impactTop = targetY - penguin.height * 0.16;
    const impactX = impactLeft - penguin.left;
    const impactY = impactTop - penguin.top;
    const nextStrikePoint = {
      x: Math.max(12, Math.min(88, ((targetX - arena.left) / arena.width) * 100)),
      y: Math.max(18, Math.min(78, ((targetY - arena.top) / arena.height) * 100)),
      approachX: impactX * 0.68 - 16,
      approachY: impactY * 0.62 + 28,
      impactX,
      impactY,
      exitX: impactX + Math.max(100, arena.width * 0.12),
      exitY: impactY - Math.max(110, arena.height * 0.2),
    };
    setStrikePoint(nextStrikePoint);
    return nextStrikePoint;
  };

  const handleCorrect = () => {
    if (mode !== "playing") return;
    fallTweenRef.current?.pause();
    const measuredStrike = measureStrikePoint();
    if (!measuredStrike) {
      fallTweenRef.current?.resume();
      return;
    }
    window.speechSynthesis?.cancel();
    const nextCombo = combo + 1;
    const nextCompleted = completed + 1;
    const earnedScore = 100 + Math.min(nextCombo - 1, 5) * 20;
    const finalScore = score + earnedScore;
    setCombo(nextCombo);
    setCompleted(nextCompleted);
    setScore(finalScore);
    pendingStrikeRef.current = { finalScore, nextCompleted };
    setMode("slicing");
    clearNextTimer();
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
    if (mode === "playing") {
      fallTweenRef.current?.pause();
      setMode("paused");
    } else if (mode === "paused" && !missed) {
      fallTweenRef.current?.resume();
      setMode("playing");
    }
  };

  useGSAP(() => {
    if (mode !== "playing") return;
    const arena = arenaRef.current;
    const fallingWord = wordRef.current;
    if (!arena || !fallingWord) return;

    const fallDistance = Math.max(220, arena.clientHeight - 176);
    gsap.set(fallingWord, { autoAlpha: 1, xPercent: -50, y: 0 });
    const tween = gsap.to(fallingWord, {
      duration: word.duration,
      ease: "none",
      onComplete: handleMiss,
      y: fallDistance,
    });
    fallTweenRef.current = tween;

    return () => {
      tween.kill();
      if (fallTweenRef.current === tween) fallTweenRef.current = null;
    };
  }, { dependencies: [runKey], scope: arenaRef });

  useGSAP(() => {
    if (mode !== "slicing") return;
    const arena = arenaRef.current;
    const fallingWord = wordRef.current;
    const penguin = penguinRef.current;
    if (!arena || !fallingWord || !penguin) return;

    fallTweenRef.current?.kill();
    fallTweenRef.current = null;

    const face = fallingWord.querySelector<HTMLElement>(".writing-word-face");
    const leftHalf = fallingWord.querySelector<HTMLElement>(".writing-word-half.is-left");
    const rightHalf = fallingWord.querySelector<HTMLElement>(".writing-word-half.is-right");
    const cape = penguin.querySelector<HTMLElement>(".writing-penguin-cape");
    const impact = arena.querySelector<HTMLElement>(".writing-slice-impact");
    const hitScore = arena.querySelector<HTMLElement>(".writing-hit-score");
    if (!face || !leftHalf || !rightHalf || !cape || !impact || !hitScore) return;

    const finishStrike = () => {
      const pending = pendingStrikeRef.current;
      pendingStrikeRef.current = null;
      if (!pending) return;
      if (pending.nextCompleted >= TARGET_ROUNDS) {
        setMode("complete");
        setAnswer("");
        onComplete?.(pending.finalScore);
      } else {
        advanceWord();
      }
    };

    gsap.set(face, { autoAlpha: 1 });
    gsap.set([leftHalf, rightHalf], { autoAlpha: 0, display: "grid", rotation: 0, x: 0, y: 0 });
    gsap.set(penguin, { autoAlpha: 1, filter: "drop-shadow(0 17px 18px rgba(35, 75, 47, .14))", rotation: -4, scale: 1, x: 0, y: 0 });
    gsap.set(cape, { autoAlpha: 0, rotation: 3, scaleX: .34, skewY: -2 });
    gsap.set(impact, { autoAlpha: 0, rotation: -7, scale: .42, xPercent: -50, yPercent: -50 });
    gsap.set(hitScore, { autoAlpha: 0, rotation: 0, scale: .84, x: 32, y: -4 });

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timeline = gsap.timeline({ onComplete: finishStrike });
    strikeTimelineRef.current = timeline;

    if (reducedMotion) {
      timeline
        .set(face, { autoAlpha: 0 })
        .set([leftHalf, rightHalf], { autoAlpha: 1 })
        .to(impact, { autoAlpha: 1, duration: .1, rotation: 0, scale: .8 })
        .to([leftHalf, rightHalf, impact], { autoAlpha: 0, duration: .16 });
    } else {
      timeline
        .to(penguin, { duration: .2, ease: "power2.out", rotation: -10, scale: 1.03, x: -24, y: 17 }, 0)
        .to(cape, { autoAlpha: .72, duration: .2, ease: "power2.out", rotation: 6, scaleX: .72, skewY: -5 }, .06)
        .to(penguin, { duration: .58, ease: "power2.inOut", filter: "drop-shadow(-18px 19px 11px rgba(35, 75, 47, .11))", rotation: 3, scale: .95, x: strikePoint.approachX, y: strikePoint.approachY }, .2)
        .to(cape, { autoAlpha: 1, duration: .58, ease: "sine.inOut", rotation: -5, scaleX: 1.08, skewY: 5 }, .2)
        .to(penguin, { duration: .16, ease: "power3.in", filter: "drop-shadow(-24px 22px 9px rgba(35, 75, 47, .08))", rotation: 11, scale: .92, x: strikePoint.impactX, y: strikePoint.impactY }, .78)
        .to(cape, { duration: .16, ease: "power2.in", rotation: 7, scaleX: .94, skewY: -6 }, .78)
        .addLabel("impact", .94)
        .set(face, { autoAlpha: 0 }, "impact")
        .set([leftHalf, rightHalf], { autoAlpha: 1 }, "impact")
        .to(impact, { autoAlpha: 1, duration: .16, ease: "power3.out", rotation: -1, scale: .96 }, "impact")
        .to(arena, { duration: .04, repeat: 3, x: (index) => index % 2 ? -2 : 2, yoyo: true }, "impact")
        .to(leftHalf, { autoAlpha: 0, duration: .68, ease: "power2.in", rotation: -18, x: -46, y: 78 }, "impact")
        .to(rightHalf, { autoAlpha: 0, duration: .68, ease: "power2.in", rotation: 17, x: 48, y: 70 }, "impact")
        .to(hitScore, { autoAlpha: 1, duration: .17, ease: "power3.out", scale: 1.04, x: 38, y: -18 }, "impact")
        .to(hitScore, { autoAlpha: 0, duration: .46, ease: "power1.in", scale: .96, x: 43, y: -58 }, "impact+=.17")
        .to(impact, { autoAlpha: 0, duration: .38, ease: "power1.out", rotation: 3, scale: 1.18 }, "impact+=.16")
        .to(penguin, { autoAlpha: 0, duration: .45, ease: "power2.in", filter: "drop-shadow(-30px 25px 6px rgba(35, 75, 47, 0))", rotation: 19, scale: .78, x: strikePoint.exitX, y: strikePoint.exitY }, "impact+=.1")
        .to(cape, { autoAlpha: 0, duration: .42, ease: "sine.in", rotation: -4, scaleX: .86, skewY: 3 }, "impact+=.1");
    }

    return () => {
      timeline.kill();
      if (strikeTimelineRef.current === timeline) strikeTimelineRef.current = null;
    };
  }, { dependencies: [mode], scope: arenaRef });

  return (
    <main className="learner-dashboard writing-game-dashboard game-immersive-dashboard">
      <div className="writing-page-shell">
        <h1 className="writing-page-title">Luyện chém từ cùng Cánh Cụt</h1>
        <div className="writing-game-layout">
          <section className="writing-arena-column" aria-label="Sân chơi chém từ">
            <div className={`writing-arena writing-gsap-motion is-${mode}`} ref={arenaRef} style={gameStyle}>
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
                ref={wordRef}
              >
                <span className="writing-word-face">
                  <span className="writing-word-whole" lang="zh-CN">{word.hanzi}</span>
                  <small lang="zh-Latn">{word.pinyin}</small>
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

          <aside className="writing-session-aside" aria-label="Thông tin lượt chơi">
            <details className="writing-session-details">
              <summary className="writing-session-summary">
                <span aria-hidden="true" className="writing-session-summary-icon">
                  <Sparkles size={18} />
                </span>
                <span className="writing-session-summary-copy">
                  <small>Thông tin lượt chơi</small>
                  <strong><span lang="zh-CN">{word.hanzi}</span> · {word.pinyin}</strong>
                </span>
                <span className="writing-session-summary-action">
                  Chi tiết <ChevronDown aria-hidden="true" size={17} />
                </span>
              </summary>

              <div className="writing-session-details-content">
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
              </div>
            </details>
          </aside>
        </div>
      </div>
    </main>
  );
}
