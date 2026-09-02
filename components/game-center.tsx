"use client";

/* eslint-disable @next/next/no-img-element */
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import NextLink from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  Check,
  CircleHelp,
  Footprints,
  Headphones,
  Keyboard,
  Layers3,
  Lightbulb,
  Link2,
  Play,
  RotateCcw,
  Sparkles,
  Star,
  Target,
  Timer,
  Trophy,
  Volume2,
  X,
  Zap,
} from "lucide-react";
import {
  useCallback,
  createContext,
  useEffect,
  useContext,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { WritingSliceGame } from "@/components/writing-slice-game";
import {
  isGameId,
  xpForGameScore,
  type GameId,
  type GameProgressSnapshot,
} from "@/lib/activity-progress";
import { gameRoundWords, gameWords, speakChinese, type GameWord } from "@/lib/game-content";

gsap.registerPlugin(useGSAP, MotionPathPlugin);

type GameSyncState = "idle" | "saving" | "saved" | "error";

const DailyGameFlowContext = createContext<{
  enabled: boolean;
  syncState: GameSyncState;
}>({ enabled: false, syncState: "idle" });

type CatalogGame = {
  id: GameId;
  title: string;
  description: string;
  duration: string;
  skill: string;
  image: string;
  imageAlt: string;
  tone: "teal" | "coral" | "blue" | "gold" | "violet" | "rose";
  icon: typeof BrainCircuit;
};

const STORAGE_KEY = "hanziwork.games.record.v1";

function parseStoredProgress(value: string): GameProgressSnapshot | null {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object") return null;
    const data = parsed as Record<string, unknown>;
    const completed = Array.isArray(data.completed) ? data.completed.filter(isGameId) : [];
    return {
      completed,
      totalXp: typeof data.totalXp === "number" && Number.isFinite(data.totalXp) ? Math.max(0, data.totalXp) : 0,
      bestScore: typeof data.bestScore === "number" && Number.isFinite(data.bestScore) ? Math.max(0, data.bestScore) : 0,
      attemptCount: typeof data.attemptCount === "number" && Number.isFinite(data.attemptCount)
        ? Math.max(0, Math.round(data.attemptCount))
        : completed.length,
    };
  } catch {
    return null;
  }
}

const catalogGames: CatalogGame[] = [
  { id: "memory", title: "Ghép cặp siêu tốc", description: "Lật và ghép Hán tự với nghĩa tiếng Việt trước khi hết lượt.", duration: "3 phút", skill: "Trí nhớ", image: "/assets/games/memory-penguin-cutout.png", imageAlt: "Cánh Cụt Himi đang chơi ghép cặp thẻ", tone: "coral", icon: Layers3 },
  { id: "connect", title: "Nối nhanh chữ – âm", description: "Nối Hán tự với pinyin tương ứng theo đúng nhịp của video mẫu.", duration: "2 phút", skill: "Liên kết", image: "/assets/games/connect-penguin-cutout.png", imageAlt: "Cánh Cụt Himi nối thẻ chữ với thẻ âm thanh", tone: "blue", icon: Link2 },
  { id: "listen", title: "Nghe và chọn đúng", description: "Nghe giọng Trung rồi chọn nghĩa chính xác trong bốn đáp án.", duration: "4 phút", skill: "Nghe hiểu", image: "/assets/games/listen-penguin-cutout.png", imageAlt: "Cánh Cụt Himi đeo tai nghe và chọn đáp án", tone: "gold", icon: Headphones },
  { id: "write", title: "Viết chữ theo nghĩa", description: "Nhìn nghĩa tiếng Việt và nhập đúng Hán tự cần dùng.", duration: "4 phút", skill: "Gợi nhớ", image: "/assets/games/write-penguin-cutout.png", imageAlt: "Cánh Cụt Himi tập viết bằng bút trên bảng", tone: "violet", icon: Keyboard },
  { id: "flash", title: "Flashcard 3D", description: "Lật thẻ, nghe phát âm và tự chấm mức độ ghi nhớ của bạn.", duration: "3 phút", skill: "Ôn nhanh", image: "/assets/games/flashcard-penguin-cutout.png", imageAlt: "Cánh Cụt Himi đang lật bộ flashcard nhiều màu", tone: "rose", icon: BrainCircuit },
  { id: "quiz", title: "Thử thách tổng hợp", description: "Trộn chữ, pinyin và nghĩa thành một lượt kiểm tra ngắn.", duration: "5 phút", skill: "Tổng hợp", image: "/assets/games/quiz-penguin-cutout.png", imageAlt: "Cánh Cụt Himi tham gia thử thách chọn đáp án", tone: "teal", icon: CircleHelp },
];

function JourneyTraveler({ targetGameId }: { targetGameId: GameId | null }) {
  const travelerRef = useRef<HTMLImageElement>(null);

  useGSAP(() => {
    const traveler = travelerRef.current;
    const stage = traveler?.closest<HTMLElement>(".game-journey-stage");
    const source = stage?.querySelector<HTMLElement>(".game-journey-guide");
    const target = targetGameId ? stage?.querySelector<HTMLElement>(`[data-game-id="${targetGameId}"]`) : null;
    if (!traveler || !stage || !source || !target) return;

    const stageRect = stage.getBoundingClientRect();
    const sourceRect = source.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const travelerRect = traveler.getBoundingClientRect();
    const startX = sourceRect.left - stageRect.left + sourceRect.width * .52 - travelerRect.width / 2;
    const startY = sourceRect.top - stageRect.top + sourceRect.height * .45 - travelerRect.height / 2;
    const endX = targetRect.left - stageRect.left + targetRect.width / 2 - travelerRect.width / 2;
    const endY = targetRect.top - stageRect.top + targetRect.height * .42 - travelerRect.height / 2;
    const horizontalDistance = endX - startX;
    const verticalDistance = endY - startY;
    const media = gsap.matchMedia();

    media.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set(traveler, { autoAlpha: 1, rotation: 0, scale: .72, x: endX, y: endY });
    });
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.set(traveler, { autoAlpha: 0, rotation: -5, scale: .7, x: startX, y: startY });
      const timeline = gsap.timeline({ delay: .28 });
      timeline
        .to(traveler, { autoAlpha: 1, duration: .18, ease: "power2.out", scale: .76 })
        .to(traveler, {
          duration: 1.08,
          ease: "power2.inOut",
          motionPath: {
            curviness: 1.35,
            path: [
              { x: startX, y: startY },
              { x: startX + horizontalDistance * .34, y: startY + verticalDistance * .2 - 34 },
              { x: startX + horizontalDistance * .72, y: startY + verticalDistance * .72 + 18 },
              { x: endX, y: endY },
            ],
          },
          rotation: 4,
          scale: .68,
        })
        .to(traveler, { duration: .16, ease: "power3.out", rotation: -2, scale: .76, y: endY - 8 })
        .to(traveler, { duration: .22, ease: "power2.out", rotation: 0, scale: .72, y: endY });
      return () => timeline.kill();
    });

    return () => media.revert();
  }, { dependencies: [targetGameId] });

  if (!targetGameId) return null;
  return <img alt="" aria-hidden="true" className="game-journey-traveler" height={1254} ref={travelerRef} src="/assets/writing/penguin-bamboo-warrior.png" width={1254} />;
}

function GameFrame({
  gameId,
  title,
  description,
  progress,
  score,
  roundLabel = "lượt",
  roundValue = 0,
  mascotSrc,
  mascotAlt,
  onExit,
  children,
}: {
  gameId: Exclude<GameId, "slice">;
  title: string;
  description: string;
  progress: string;
  score: number;
  roundLabel?: string;
  roundValue?: number;
  mascotSrc: string;
  mascotAlt: string;
  onExit: () => void;
  children: ReactNode;
}) {
  return (
    <main className="learner-dashboard game-center-dashboard game-session-dashboard game-immersive-dashboard">
      <div className="game-center-shell game-session-shell">
        <section aria-label={title} className={`game-session-world is-${gameId}`} data-session-game={gameId}>
          <div className="game-session-sr-copy">
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          <div className="game-session-hud">
            <button aria-label="Quay lại tất cả trò chơi" className="game-back-button" onClick={onExit} type="button"><ArrowLeft size={17} /><span>Tất cả trò chơi</span></button>
            <div className="game-session-metrics" aria-label="Tiến độ trò chơi">
              <span><Target aria-hidden="true" size={22} /><span><small>TIẾN ĐỘ</small><strong>{progress}</strong></span></span>
              <span><Star aria-hidden="true" size={22} /><span><small>ĐIỂM</small><strong>{score}</strong></span></span>
              <span><Footprints aria-hidden="true" size={22} /><span><small>{roundLabel.toLocaleUpperCase("vi-VN")}</small><strong>{roundValue}</strong></span></span>
            </div>
          </div>
          <img alt={mascotAlt} className="game-session-mascot" height={640} src={mascotSrc} width={960} />
          {children}
          <aside className="game-session-tip"><Lightbulb aria-hidden="true" size={18} /><span><strong>Gợi ý:</strong> Bình tĩnh quan sát, mỗi lượt chơi là một bước tiến.</span></aside>
        </section>
      </div>
    </main>
  );
}

function GameResult({ score, label, onRestart, onExit }: { score: number; label: string; onRestart: () => void; onExit: () => void }) {
  return (
    <div className="game-result" role="status">
      <span><Trophy size={28} /></span>
      <small>HOÀN THÀNH LƯỢT CHƠI</small>
      <h2>{label}</h2>
      <strong>{score} điểm</strong>
      <div>
        <button onClick={onRestart} type="button"><RotateCcw size={16} /> Chơi lại</button>
        <button onClick={onExit} type="button">Chọn trò khác <ArrowRight size={16} /></button>
        <DailyGameCompletionAction />
      </div>
    </div>
  );
}

function DailyGameCompletionAction() {
  const { enabled, syncState } = useContext(DailyGameFlowContext);
  if (!enabled) return null;
  if (syncState === "idle" || syncState === "saving") {
    return <button className="daily-game-flow-action" disabled type="button">Đang lưu kết quả…</button>;
  }
  return <NextLink
    className={`daily-game-flow-action${syncState === "error" ? " is-secondary" : ""}`}
    href="/?session=today#today-summary"
    prefetch
  >
    {syncState === "error" ? "Về phiên hôm nay" : "Xem tổng kết 4/4"} <ArrowRight size={16} />
  </NextLink>;
}

function MemoryGame({ onExit, onComplete }: { onExit: () => void; onComplete: (score: number) => void }) {
  const words = gameRoundWords.slice(0, 4);
  const tiles = useMemo(() => {
    const paired = words.flatMap((word) => [
      { id: `${word.id}-hanzi`, wordId: word.id, kind: "hanzi" as const, label: word.hanzi },
      { id: `${word.id}-meaning`, wordId: word.id, kind: "meaning" as const, label: word.meaning },
    ]);
    return [paired[0], paired[5], paired[2], paired[7], paired[4], paired[1], paired[6], paired[3]];
  }, [words]);
  const [selected, setSelected] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [finished, setFinished] = useState(false);

  const score = Math.max(240, 1000 - Math.max(0, moves - 4) * 70);

  const chooseTile = (tile: (typeof tiles)[number]) => {
    if (selected.length >= 2 || selected.includes(tile.id) || matched.includes(tile.wordId)) return;
    if (selected.length === 0) {
      setSelected([tile.id]);
      return;
    }

    const first = tiles.find((item) => item.id === selected[0]);
    setMoves((value) => value + 1);
    setSelected([selected[0], tile.id]);
    if (first?.wordId === tile.wordId && first.kind !== tile.kind) {
      window.setTimeout(() => {
        const nextMatched = [...matched, tile.wordId];
        setMatched(nextMatched);
        setSelected([]);
        if (nextMatched.length === words.length) {
          const finalScore = Math.max(240, 1000 - Math.max(0, moves + 1 - 4) * 70);
          setFinished(true);
          onComplete(finalScore);
        }
      }, 360);
    } else {
      window.setTimeout(() => setSelected([]), 620);
    }
  };

  const restart = () => {
    setSelected([]);
    setMatched([]);
    setMoves(0);
    setFinished(false);
  };

  return (
    <GameFrame description="Lật từng thẻ và tìm đúng cặp Hán tự – nghĩa Việt." gameId="memory" mascotAlt="Cánh Cụt Himi cổ vũ trò ghép cặp" mascotSrc="/assets/games/memory-penguin-cutout.png" onExit={onExit} progress={`${matched.length} / ${words.length}`} roundValue={moves} score={score} title="Ghép cặp siêu tốc">
      <section className="game-play-card memory-game-stage">
        {finished ? <GameResult label="Bạn đã tìm đủ bốn cặp!" onExit={onExit} onRestart={restart} score={score} /> : (
          <>
            <div className="game-instruction"><Layers3 size={18} /><span>Hai thẻ đúng sẽ được giữ sáng. Càng ít lượt lật, điểm càng cao.</span><b>{moves} lượt</b></div>
            <div className="memory-grid" aria-label="Bàn ghép cặp">
              {tiles.map((tile) => {
                const revealed = selected.includes(tile.id) || matched.includes(tile.wordId);
                return (
                  <button aria-label={revealed ? `${tile.kind === "hanzi" ? "Hán tự" : "Nghĩa"}: ${tile.label}` : "Lật thẻ ghi nhớ"} aria-pressed={revealed} className={`${revealed ? "is-revealed" : ""} ${matched.includes(tile.wordId) ? "is-matched" : ""}`.trim()} data-tile-id={tile.id} disabled={matched.includes(tile.wordId)} key={tile.id} onClick={() => chooseTile(tile)} type="button">
                    <span aria-hidden={!revealed} lang={tile.kind === "hanzi" ? "zh-CN" : undefined}>{revealed ? tile.label : "?"}</span>
                    {matched.includes(tile.wordId) ? <Check size={16} /> : null}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </section>
    </GameFrame>
  );
}

function ConnectGame({ onExit, onComplete }: { onExit: () => void; onComplete: (score: number) => void }) {
  const words = gameRoundWords.slice(0, 5);
  const rightWords = [words[2], words[4], words[0], words[3], words[1]];
  const [left, setLeft] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [wrong, setWrong] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const score = Math.max(300, 1000 - mistakes * 100);

  const chooseRight = (word: GameWord) => {
    if (!left || matched.includes(word.id) || wrong) return;
    if (left === word.id) {
      const nextMatched = [...matched, word.id];
      setMatched(nextMatched);
      setLeft(null);
      if (nextMatched.length === words.length) {
        setFinished(true);
        onComplete(score);
      }
      return;
    }
    setMistakes((value) => value + 1);
    setWrong(word.id);
    window.setTimeout(() => {
      setWrong(null);
      setLeft(null);
    }, 460);
  };

  const restart = () => {
    setLeft(null);
    setMatched([]);
    setMistakes(0);
    setWrong(null);
    setFinished(false);
  };

  return (
    <GameFrame description="Chọn một Hán tự bên trái, sau đó nối với pinyin đúng bên phải." gameId="connect" mascotAlt="Cánh Cụt Himi đang nối chữ với âm" mascotSrc="/assets/games/connect-penguin-cutout.png" onExit={onExit} progress={`${matched.length} / ${words.length}`} roundLabel="lỗi" roundValue={mistakes} score={score} title="Nối nhanh chữ – âm">
      <section className="game-play-card connect-game-stage">
        {finished ? <GameResult label="Các liên kết đã khớp hoàn toàn!" onExit={onExit} onRestart={restart} score={score} /> : (
          <>
            <div className="game-instruction"><Link2 size={18} /><span>Mỗi cặp đúng sẽ khóa lại. Chọn sai trừ 100 điểm.</span><b>{mistakes} lỗi</b></div>
            <div className="connect-board">
              <div>
                <span className="connect-column-label">HÁN TỰ</span>
                {words.map((word) => <button aria-label={`Chọn Hán tự ${word.hanzi}`} aria-pressed={left === word.id} className={`${left === word.id ? "is-selected" : ""} ${matched.includes(word.id) ? "is-matched" : ""}`.trim()} disabled={matched.includes(word.id)} key={word.id} onClick={() => setLeft(word.id)} type="button"><strong lang="zh-CN">{word.hanzi}</strong>{matched.includes(word.id) ? <Check size={16} /> : null}</button>)}
              </div>
              <div className="connect-line-column" aria-hidden="true"><Link2 size={22} /></div>
              <div>
                <span className="connect-column-label">PINYIN</span>
                {rightWords.map((word) => <button aria-label={`Chọn pinyin ${word.pinyin}`} className={`${matched.includes(word.id) ? "is-matched" : ""} ${wrong === word.id ? "is-wrong" : ""}`.trim()} disabled={matched.includes(word.id)} key={word.id} onClick={() => chooseRight(word)} type="button"><span>{word.pinyin}</span>{wrong === word.id ? <X size={16} /> : matched.includes(word.id) ? <Check size={16} /> : null}</button>)}
              </div>
            </div>
          </>
        )}
      </section>
    </GameFrame>
  );
}

function optionMeanings(index: number): string[] {
  const current = gameRoundWords[index];
  const offsets = [2, 4, 1];
  const wrong = offsets.map((offset) => gameWords[(index + offset) % gameWords.length].meaning);
  return index % 2 === 0 ? [wrong[0], current.meaning, wrong[1], wrong[2]] : [current.meaning, wrong[0], wrong[2], wrong[1]];
}

function ListenGame({ onExit, onComplete }: { onExit: () => void; onComplete: (score: number) => void }) {
  const words = gameRoundWords.slice(0, 5);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [finished, setFinished] = useState(false);
  const word = words[index];
  const options = optionMeanings(index);
  const score = correct * 200;

  const choose = (option: string) => {
    if (selected) return;
    setSelected(option);
    if (option === word.meaning) setCorrect((value) => value + 1);
  };

  const next = () => {
    if (!selected) return;
    if (index === words.length - 1) {
      const finalScore = correct * 200;
      setFinished(true);
      onComplete(finalScore);
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

  return (
    <GameFrame description="Nghe từ tiếng Trung, sau đó chọn nghĩa tiếng Việt chính xác." gameId="listen" mascotAlt="Cánh Cụt Himi luyện nghe" mascotSrc="/assets/games/listen-penguin-cutout.png" onExit={onExit} progress={`${index + 1} / ${words.length}`} roundLabel="đúng" roundValue={correct} score={score} title="Nghe và chọn đúng">
      <section className="game-play-card listen-game-stage">
        {finished ? <GameResult label={`Bạn nghe đúng ${correct}/${words.length} từ.`} onExit={onExit} onRestart={restart} score={correct * 200} /> : (
          <>
            <div className="listen-prompt">
              <span>NGHE TỪ SỐ {String(index + 1).padStart(2, "0")}</span>
              <button aria-label="Phát âm từ tiếng Trung" onClick={() => speakChinese(word.hanzi)} type="button"><Volume2 size={28} /></button>
              <h2>Bấm để nghe</h2>
              <p>Có thể nghe lại nhiều lần trước khi chọn.</p>
            </div>
            <div className="listen-options">
              {options.map((option, optionIndex) => {
                const state = selected ? option === word.meaning ? "is-correct" : selected === option ? "is-wrong" : "" : "";
                return <button className={state} key={option} onClick={() => choose(option)} type="button"><span>{String.fromCharCode(65 + optionIndex)}</span>{option}{state === "is-correct" ? <Check size={17} /> : state === "is-wrong" ? <X size={17} /> : null}</button>;
              })}
            </div>
            <button className="game-next-button" disabled={!selected} onClick={next} type="button">{index === words.length - 1 ? "Xem kết quả" : "Câu tiếp theo"}<ArrowRight size={17} /></button>
          </>
        )}
      </section>
    </GameFrame>
  );
}

function WriteGame({ onExit, onComplete }: { onExit: () => void; onComplete: (score: number) => void }) {
  const words = gameRoundWords.slice(1, 6);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const [correct, setCorrect] = useState(0);
  const [finished, setFinished] = useState(false);
  const word = words[index];
  const score = correct * 200;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!answer.trim() || status === "correct") return;
    if (answer.trim() === word.hanzi) {
      setStatus("correct");
      setCorrect((value) => value + 1);
    } else {
      setStatus("wrong");
    }
  };

  const next = () => {
    if (status !== "correct") return;
    if (index === words.length - 1) {
      const finalScore = correct * 200;
      setFinished(true);
      onComplete(finalScore);
      return;
    }
    setIndex((value) => value + 1);
    setAnswer("");
    setStatus("idle");
  };

  const restart = () => {
    setIndex(0);
    setAnswer("");
    setStatus("idle");
    setCorrect(0);
    setFinished(false);
  };

  return (
    <GameFrame description="Nhìn nghĩa tiếng Việt và nhập đúng Hán tự tương ứng." gameId="write" mascotAlt="Cánh Cụt Himi tập viết Hán tự" mascotSrc="/assets/games/write-penguin-cutout.png" onExit={onExit} progress={`${index + 1} / ${words.length}`} roundLabel="đúng" roundValue={correct} score={score} title="Viết chữ theo nghĩa">
      <section className="game-play-card write-game-stage">
        {finished ? <GameResult label="Bạn đã gọi lại đủ năm từ!" onExit={onExit} onRestart={restart} score={correct * 200} /> : (
          <>
            <div className="write-prompt">
              <span>NGHĨA TIẾNG VIỆT</span>
              <h2>{word.meaning}</h2>
              <p>Gợi ý pinyin: <b>{word.pinyin.replace(/[a-zà-ỹ]/giu, "•")}</b></p>
            </div>
            <form className={`write-answer-form is-${status}`} onSubmit={submit}>
              <label htmlFor="game-hanzi-answer">Nhập Hán tự tại đây</label>
              <div>
                <input autoComplete="off" id="game-hanzi-answer" lang="zh-CN" onChange={(event) => { setAnswer(event.target.value); if (status === "wrong") setStatus("idle"); }} placeholder="Ví dụ: 谢谢" spellCheck={false} value={answer} />
                <button disabled={!answer.trim()} type="submit">Kiểm tra <Check size={17} /></button>
              </div>
              <span aria-live="polite">{status === "correct" ? <><Check size={15} /> Chính xác: {word.hanzi} · {word.pinyin}</> : status === "wrong" ? <><X size={15} /> Chưa đúng, thử nhìn lại nghĩa và pinyin.</> : "Bạn có thể dùng bộ gõ tiếng Trung của thiết bị."}</span>
            </form>
            <button className="game-next-button" disabled={status !== "correct"} onClick={next} type="button">{index === words.length - 1 ? "Hoàn thành" : "Từ tiếp theo"}<ArrowRight size={17} /></button>
          </>
        )}
      </section>
    </GameFrame>
  );
}

function FlashcardGame({ onExit, onComplete }: { onExit: () => void; onComplete: (score: number) => void }) {
  const words = gameRoundWords;
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [finished, setFinished] = useState(false);
  const word = words[index];
  const score = known * 160;

  const rate = (remembered: boolean) => {
    const nextKnown = known + (remembered ? 1 : 0);
    if (index === words.length - 1) {
      const finalScore = nextKnown * 160;
      setKnown(nextKnown);
      setFinished(true);
      onComplete(finalScore);
      return;
    }
    setKnown(nextKnown);
    setIndex((value) => value + 1);
    setFlipped(false);
  };

  const restart = () => {
    setIndex(0);
    setFlipped(false);
    setKnown(0);
    setFinished(false);
  };

  return (
    <GameFrame description="Lật thẻ để xem nghĩa, nghe phát âm rồi tự đánh giá mức nhớ." gameId="flash" mascotAlt="Cánh Cụt Himi ôn tập cùng flashcard" mascotSrc="/assets/games/flashcard-penguin-cutout.png" onExit={onExit} progress={`${index + 1} / ${words.length}`} roundLabel="nhớ" roundValue={known} score={score} title="Flashcard 3D">
      <section className="game-play-card flash-game-stage">
        {finished ? <GameResult label={`Bạn nhớ chắc ${known}/${words.length} từ.`} onExit={onExit} onRestart={restart} score={known * 160} /> : (
          <>
            <button aria-label={flipped ? "Xem mặt Hán tự" : "Lật thẻ xem nghĩa"} className={`flashcard-3d ${flipped ? "is-flipped" : ""}`} onClick={() => setFlipped((value) => !value)} type="button">
              <span className="flashcard-3d-inner">
                <span className="flashcard-face flashcard-front"><small>HÁN TỰ</small><strong lang="zh-CN">{word.hanzi}</strong><em>Bấm để lật thẻ</em></span>
                <span className="flashcard-face flashcard-back"><small>NGHĨA & PHIÊN ÂM</small><strong>{word.meaning}</strong><b>{word.pinyin}</b><em lang="zh-CN">{word.example}</em></span>
              </span>
            </button>
            <div className="flash-audio-row"><button onClick={() => speakChinese(word.hanzi)} type="button"><Volume2 size={18} /> Nghe phát âm</button><span><Sparkles size={15} /> Lật thẻ trước khi tự chấm</span></div>
            <div className="flash-rating-actions"><button disabled={!flipped} onClick={() => rate(false)} type="button"><X size={17} /> Cần ôn lại</button><button disabled={!flipped} onClick={() => rate(true)} type="button"><Check size={17} /> Đã nhớ</button></div>
          </>
        )}
      </section>
    </GameFrame>
  );
}

function quizOptions(index: number): string[] {
  const word = gameRoundWords[index];
  const values = [word.meaning, gameWords[(index + 2) % gameWords.length].meaning, gameWords[(index + 4) % gameWords.length].meaning, gameWords[(index + 7) % gameWords.length].meaning];
  return index % 2 ? [values[2], values[0], values[3], values[1]] : [values[1], values[3], values[0], values[2]];
}

function QuizGame({ onExit, onComplete }: { onExit: () => void; onComplete: (score: number) => void }) {
  const words = gameRoundWords.slice(0, 5);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [finished, setFinished] = useState(false);
  const word = words[index];
  const options = quizOptions(index);
  const score = correct * 200;

  const choose = (option: string) => {
    if (selected) return;
    setSelected(option);
    if (option === word.meaning) setCorrect((value) => value + 1);
  };

  const next = () => {
    if (!selected) return;
    if (index === words.length - 1) {
      const finalScore = correct * 200;
      setFinished(true);
      onComplete(finalScore);
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

  return (
    <GameFrame description="Một lượt kiểm tra ngắn kết hợp nhận diện chữ, nghĩa và phát âm." gameId="quiz" mascotAlt="Cánh Cụt Himi tham gia thử thách tổng hợp" mascotSrc="/assets/games/quiz-penguin-cutout.png" onExit={onExit} progress={`${index + 1} / ${words.length}`} roundLabel="đúng" roundValue={correct} score={score} title="Thử thách tổng hợp">
      <section className="game-play-card quiz-game-stage">
        {finished ? <GameResult label={`Bạn trả lời đúng ${correct}/${words.length} câu.`} onExit={onExit} onRestart={restart} score={correct * 200} /> : (
          <>
            <div className="quiz-question"><span>CÂU {String(index + 1).padStart(2, "0")}</span><small>Chọn nghĩa đúng của từ</small><h2 lang="zh-CN">{word.hanzi}</h2><button aria-label="Nghe phát âm" onClick={() => speakChinese(word.hanzi)} type="button"><Volume2 size={18} /></button></div>
            <div className="quiz-options">
              {options.map((option, optionIndex) => {
                const state = selected ? option === word.meaning ? "is-correct" : selected === option ? "is-wrong" : "" : "";
                return <button className={state} key={option} onClick={() => choose(option)} type="button"><b>{String.fromCharCode(65 + optionIndex)}</b><span>{option}</span>{state === "is-correct" ? <Check size={17} /> : state === "is-wrong" ? <X size={17} /> : null}</button>;
              })}
            </div>
            <button className="game-next-button" disabled={!selected} onClick={next} type="button">{index === words.length - 1 ? "Xem kết quả" : "Câu tiếp theo"}<ArrowRight size={17} /></button>
          </>
        )}
      </section>
    </GameFrame>
  );
}

export function GameCenter({
  authenticated,
  dailyFlow,
  initialGameId,
  initialProgress,
}: {
  authenticated: boolean;
  dailyFlow: boolean;
  initialGameId: GameId | null;
  initialProgress: GameProgressSnapshot;
}) {
  const [activeGame, setActiveGame] = useState<GameId | null>(initialGameId);
  const [record, setRecord] = useState<GameProgressSnapshot>(initialProgress);
  const [syncState, setSyncState] = useState<GameSyncState>("idle");
  const recommendedGameId = record.completed.includes("slice")
    ? catalogGames.find((game) => !record.completed.includes(game.id))?.id ?? null
    : null;

  useEffect(() => {
    if (authenticated) return;
    const handle = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        const parsed = saved ? parseStoredProgress(saved) : null;
        if (parsed) setRecord(parsed);
      } catch {
        // The game center still works when private browsing blocks local storage.
      }
    }, 0);
    return () => window.clearTimeout(handle);
  }, [authenticated]);

  useEffect(() => {
    // The game catalog is tall on mobile. Start every selected game at its
    // heading instead of inheriting the catalog's previous scroll position.
    window.scrollTo(0, 0);
  }, [activeGame]);

  const completeGame = useCallback((id: GameId, score: number) => {
    setRecord((current) => {
      const next = {
        completed: current.completed.includes(id) ? current.completed : [...current.completed, id],
        totalXp: current.totalXp + xpForGameScore(score),
        bestScore: Math.max(current.bestScore, score),
        attemptCount: current.attemptCount + 1,
      };
      if (!authenticated) {
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // Keep the in-memory result when storage is unavailable.
        }
      }
      return next;
    });

    if (!authenticated) {
      setSyncState("saved");
      return;
    }

    setSyncState("saving");
    void fetch("/api/progress/game", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ gameId: id, score }),
      keepalive: true,
    }).then(async (response) => {
      if (!response.ok) throw new Error("Game attempt save failed");
      const payload = await response.json() as { progress?: GameProgressSnapshot };
      if (payload.progress) setRecord(payload.progress);
      setSyncState("saved");
    }).catch(() => setSyncState("error"));
  }, [authenticated]);

  const exitGame = () => setActiveGame(null);

  let activeGameView: ReactNode = null;
  if (activeGame === "slice") activeGameView = <WritingSliceGame completionAction={<DailyGameCompletionAction />} onComplete={(score) => completeGame("slice", score)} onExit={exitGame} />;
  if (activeGame === "memory") activeGameView = <MemoryGame onComplete={(score) => completeGame("memory", score)} onExit={exitGame} />;
  if (activeGame === "connect") activeGameView = <ConnectGame onComplete={(score) => completeGame("connect", score)} onExit={exitGame} />;
  if (activeGame === "listen") activeGameView = <ListenGame onComplete={(score) => completeGame("listen", score)} onExit={exitGame} />;
  if (activeGame === "write") activeGameView = <WriteGame onComplete={(score) => completeGame("write", score)} onExit={exitGame} />;
  if (activeGame === "flash") activeGameView = <FlashcardGame onComplete={(score) => completeGame("flash", score)} onExit={exitGame} />;
  if (activeGame === "quiz") activeGameView = <QuizGame onComplete={(score) => completeGame("quiz", score)} onExit={exitGame} />;
  if (activeGameView) return <DailyGameFlowContext.Provider value={{ enabled: dailyFlow, syncState }}>
    {activeGameView}
  </DailyGameFlowContext.Provider>;

  return (
    <main className="learner-dashboard game-center-dashboard">
      <h1 className="sr-only">Trung tâm trò chơi Himi</h1>
      <div className="game-center-shell game-journey-shell">
        <section className="game-journey-stage" aria-label="Hành trình trò chơi">
          <picture className="game-journey-background">
            <source media="(max-width: 960px)" srcSet="/assets/games/journey-map-mobile-long.webp" />
            <img alt="" height={1067} src="/assets/games/journey-map-desktop.webp" width={1600} />
          </picture>

          <JourneyTraveler targetGameId={recommendedGameId} />

          <div className="game-journey-status">
            <div className="game-journey-progress" aria-label={`${record.completed.length} trên 7 trò đã hoàn thành`}>
              <Sparkles size={16} />
              <strong>{record.completed.length} / 7</strong>
              <span>trò chơi</span>
            </div>
            <small className={`game-progress-sync is-${syncState}`} role="status">
              {syncState === "saving" ? "Đang đồng bộ kết quả…"
                : syncState === "error" ? "Chưa đồng bộ được kết quả gần nhất"
                  : authenticated ? `${record.totalXp} XP · đồng bộ tài khoản` : `${record.totalXp} XP · lưu trên thiết bị`}
            </small>
          </div>

          <section className={`game-journey-featured ${record.completed.includes("slice") ? "is-complete" : ""}`.trim()} aria-label="Trạm hiện tại: Luyện chém từ">
            <div className="game-journey-featured-card">
              <span className="game-journey-featured-number">01</span>
              {record.completed.includes("slice") ? <span className="game-journey-done"><Check size={13} /> Đã hoàn thành</span> : null}
              <small>PHẢN XẠ PINYIN · CÁNH CỤT MODE</small>
              <h2>Luyện chém từ</h2>
              <p>Nhìn chữ đang rơi, gõ pinyin trước khi chạm đất. Cánh Cụt sẽ lao lên chém gọn đáp án đúng và giữ combo cho bạn.</p>
              <div className="game-journey-featured-meta">
                <span><Timer size={14} /> 4 phút</span>
                <span><Zap size={14} /> 12 từ</span>
              </div>
              <button onClick={() => setActiveGame("slice")} type="button">
                <Play fill="currentColor" size={17} /> Tiếp tục chơi
              </button>
            </div>
            <img alt="Cánh Cụt Himi cầm gậy tre chỉ về thử thách tiếp theo" className="game-journey-guide" height={1254} src="/assets/writing/penguin-bamboo-warrior.png" width={1254} />
          </section>

          <div className="game-journey-stations" aria-label="Các trạm trò chơi">
            {catalogGames.map((game, index) => {
              const Icon = game.icon;
              const completed = record.completed.includes(game.id);
              const stationNumber = index + 2;
              return (
                <button
                  aria-label={`Trạm ${stationNumber}: Chơi ${game.title}`}
                  className={`game-journey-station station-${stationNumber} ${completed ? "is-complete" : ""}`.trim()}
                  data-game-id={game.id}
                  key={game.id}
                  onClick={() => setActiveGame(game.id)}
                  type="button"
                >
                  <span className="game-journey-station-number">{String(stationNumber).padStart(2, "0")}</span>
                  <span className="game-journey-station-visual">
                    <img alt={game.imageAlt} height={640} loading="lazy" src={game.image} width={960} />
                    <span className={`game-journey-station-icon tone-${game.tone}`}><Icon size={18} /></span>
                  </span>
                  <span className="game-journey-station-copy">
                    <strong>{game.title}</strong>
                  </span>
                  {completed ? <span className="game-journey-station-complete"><Check size={13} /> Đã chơi</span> : null}
                </button>
              );
            })}
          </div>

          <aside className="game-journey-skills" aria-label="Kỹ năng bạn đang rèn">
            <strong><Sparkles size={14} /> Kỹ năng bạn đang rèn</strong>
            <div>
              <span><Zap size={17} /><small>Phản xạ</small></span>
              <span><Trophy size={17} /><small>Chính xác</small></span>
              <span><BrainCircuit size={17} /><small>Ghi nhớ</small></span>
            </div>
          </aside>
        </section>

        <footer className="game-center-footer-note"><Sparkles size={17} /><span><strong>Từ thật trong công việc.</strong> Nội dung trò chơi dùng chung bộ từ Văn phòng & hành chính và sẽ mở rộng theo chuyên ngành bạn học.</span></footer>
      </div>
    </main>
  );
}
