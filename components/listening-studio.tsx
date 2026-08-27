"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  AudioLines,
  Check,
  ChevronRight,
  Headphones,
  Keyboard,
  RotateCcw,
  SlidersHorizontal,
  Volume2,
  X,
} from "lucide-react";
import { HimiSectionBanner } from "@/components/himi-section-banner";
import {
  listeningLevels as LEVELS,
  listeningWords,
  type ListeningWord,
} from "@/lib/listening-content";

type ListeningView = "intro" | "session" | "complete";
type ListeningMode = "hanzi" | "meaning" | "pinyin" | "dictation";
type AnswerStatus = "idle" | "correct" | "wrong";

const ROUND_LENGTH = 10;
const MODE_SEQUENCE: ListeningMode[] = ["hanzi", "meaning", "pinyin", "dictation"];

const MODE_CONTENT: Record<ListeningMode, { label: string; prompt: string }> = {
  hanzi: { label: "Nghe chọn chữ", prompt: "Chọn Hán tự bạn vừa nghe" },
  meaning: { label: "Nghe đoán nghĩa", prompt: "Chọn nghĩa tiếng Việt phù hợp" },
  pinyin: { label: "Nghe gõ pinyin", prompt: "Gõ lại pinyin, có dấu hoặc không dấu" },
  dictation: { label: "Chép câu", prompt: "Gõ lại câu vừa nghe bằng Hán tự" },
};

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

function createRound(levelId: string): ListeningWord[] {
  const level = LEVELS.find((item) => item.id === levelId) ?? LEVELS[0];
  const shuffled = shuffle(level.words);
  return Array.from({ length: ROUND_LENGTH }, (_, index) => shuffled[index % shuffled.length]);
}

function normalizePinyin(value: string): string {
  return value
    .toLocaleLowerCase("vi-VN")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .replace(/ü/gu, "v")
    .replace(/[^a-z0-9]/gu, "");
}

function normalizeHanzi(value: string): string {
  return value.replace(/[\s，。！？、,.!?]/gu, "");
}

function createChoices(words: ListeningWord[], current: ListeningWord, key: "hanzi" | "meaning"): string[] {
  const values = [current[key], ...shuffle([...words, ...listeningWords]).map((word) => word[key])];
  return shuffle(Array.from(new Set(values)).slice(0, 4));
}

export function ListeningStudio() {
  const [view, setView] = useState<ListeningView>("intro");
  const [selectedLevel, setSelectedLevel] = useState<string>(LEVELS[0].id);
  const [round, setRound] = useState<ListeningWord[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState<AnswerStatus>("idle");
  const [slowPlayback, setSlowPlayback] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioSupported, setAudioSupported] = useState(true);

  const currentWord = round[questionIndex];
  const currentMode = MODE_SEQUENCE[questionIndex % MODE_SEQUENCE.length];
  const choiceKey = currentMode === "hanzi" ? "hanzi" : "meaning";
  const choices = useMemo(
    () => currentWord && (currentMode === "hanzi" || currentMode === "meaning")
      ? createChoices(round, currentWord, choiceKey)
      : [],
    [choiceKey, currentMode, currentWord, round],
  );
  const currentLevel = LEVELS.find((item) => item.id === selectedLevel) ?? LEVELS[0];

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const playWord = (word = currentWord, mode = currentMode, slower = slowPlayback) => {
    if (!word || typeof window === "undefined" || !("speechSynthesis" in window)) {
      setAudioSupported(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(mode === "dictation" ? word.example : word.hanzi);
    utterance.lang = "zh-CN";
    utterance.rate = slower ? 0.58 : 0.76;
    const voice = window.speechSynthesis.getVoices().find((item) => item.lang.toLocaleLowerCase().startsWith("zh"));
    if (voice) utterance.voice = voice;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const startRound = () => {
    const nextRound = createRound(selectedLevel);
    setRound(nextRound);
    setQuestionIndex(0);
    setScore(0);
    setAnswer("");
    setStatus("idle");
    setView("session");
    window.setTimeout(() => playWord(nextRound[0], MODE_SEQUENCE[0], slowPlayback), 120);
  };

  const commitAnswer = (isCorrect: boolean, submittedAnswer: string) => {
    if (status !== "idle") return;
    setAnswer(submittedAnswer);
    setStatus(isCorrect ? "correct" : "wrong");
    if (isCorrect) setScore((value) => value + 1);
  };

  const selectChoice = (value: string) => {
    if (!currentWord) return;
    commitAnswer(value === currentWord[choiceKey], value);
  };

  const checkTypedAnswer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentWord || !answer.trim()) return;
    const correct = currentMode === "pinyin"
      ? normalizePinyin(answer) === normalizePinyin(currentWord.pinyin)
      : normalizeHanzi(answer) === normalizeHanzi(currentWord.example);
    commitAnswer(correct, answer);
  };

  const nextQuestion = () => {
    if (questionIndex === round.length - 1) {
      window.speechSynthesis?.cancel();
      setView("complete");
      return;
    }

    const nextIndex = questionIndex + 1;
    const nextMode = MODE_SEQUENCE[nextIndex % MODE_SEQUENCE.length];
    setQuestionIndex(nextIndex);
    setAnswer("");
    setStatus("idle");
    window.setTimeout(() => playWord(round[nextIndex], nextMode, slowPlayback), 100);
  };

  if (view === "intro") {
    return (
      <main className="learner-dashboard listening-studio">
        <div className="listening-banner-shell">
          <HimiSectionBanner
            actions={
              <div className="listening-banner-actions">
                <div className="listening-intro-facts" aria-label="Thông tin lượt luyện">
                  <span><strong>10</strong> câu mỗi lượt</span>
                  <span><strong>4</strong> dạng luyện tai</span>
                  <span><strong>5–7</strong> phút</span>
                </div>
                <button className="listening-primary-action" onClick={startRound} type="button">
                  <Volume2 aria-hidden="true" size={20} /> Bắt đầu nghe <ChevronRight aria-hidden="true" size={19} />
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
            <div><h2 id="listening-level-title">Chọn cấp độ luyện nghe</h2><p>Từ nền tảng HSK 1 đến khả năng theo dõi lập luận chuyên sâu HSK 7–9.</p></div>
            <span>{currentLevel.words.length} từ trong bộ · 10 câu/lượt</span>
          </div>
          <div className="listening-level-picker" role="group" aria-label="Chọn cấp độ luyện nghe">
            {LEVELS.map((level) => (
              <button
                aria-label={`${level.label}: ${level.title}, ${level.words.length} từ trong bộ`}
                aria-pressed={selectedLevel === level.id}
                className={selectedLevel === level.id ? "is-active" : ""}
                key={level.id}
                onClick={() => setSelectedLevel(level.id)}
                type="button"
              >
                <span className="listening-level-symbol"><Headphones aria-hidden="true" size={20} /></span>
                <strong>{level.label}</strong>
                <small>{level.title}</small>
                <span className="listening-level-count">{level.words.length} từ</span>
                {selectedLevel === level.id ? <Check aria-hidden="true" className="listening-level-check" size={17} /> : null}
              </button>
            ))}
          </div>
        </section>

        <section className="listening-mode-section" aria-labelledby="listening-mode-title">
          <div className="listening-section-heading"><div><h2 id="listening-mode-title">Một lượt, bốn cách nghe</h2><p>Câu hỏi thay đổi liên tục để tai không học theo một kiểu duy nhất.</p></div></div>
          <ol className="listening-mode-list">
            <li><span>1</span><AudioLines aria-hidden="true" size={21} /><div><strong>Nghe chọn chữ</strong><small>Nhận ra âm và mặt chữ.</small></div></li>
            <li><span>2</span><Headphones aria-hidden="true" size={21} /><div><strong>Nghe đoán nghĩa</strong><small>Hiểu từ mà không cần nhìn.</small></div></li>
            <li><span>3</span><Keyboard aria-hidden="true" size={21} /><div><strong>Gõ pinyin</strong><small>Phân biệt âm đầu và thanh điệu.</small></div></li>
            <li><span>4</span><SlidersHorizontal aria-hidden="true" size={21} /><div><strong>Chép câu</strong><small>Nghe trọn câu rồi tái tạo.</small></div></li>
          </ol>
        </section>
      </main>
    );
  }

  if (view === "complete") {
    const percentage = Math.round((score / ROUND_LENGTH) * 100);
    return (
      <main className="learner-dashboard listening-studio listening-complete-page">
        <section className="listening-complete" aria-labelledby="listening-complete-title">
          <Image alt="Himi vui mừng khi bạn hoàn thành lượt nghe" height={300} src="/assets/home/himi-current-static.webp" unoptimized width={300} />
          <span className="listening-complete-score">{score}/{ROUND_LENGTH}</span>
          <h1 id="listening-complete-title">Bạn đã hoàn thành một lượt nghe.</h1>
          <p>{percentage >= 80 ? "Tai nghe đang bắt nhịp rất tốt. Hãy thử lại với tốc độ thường để giữ phản xạ." : "Hãy nghe lại một lượt ở tốc độ chậm. Những từ chưa chắc sẽ trở nên quen hơn."}</p>
          <div className="listening-complete-actions">
            <button onClick={startRound} type="button"><RotateCcw aria-hidden="true" size={18} /> Luyện lại bộ này</button>
            <button className="is-secondary" onClick={() => setView("intro")} type="button">Chọn bộ khác</button>
          </div>
        </section>
      </main>
    );
  }

  if (!currentWord) return null;

  const answerLabel = currentMode === "pinyin" ? currentWord.pinyin : currentWord.example;
  const progress = ((questionIndex + 1) / ROUND_LENGTH) * 100;

  return (
    <main className="learner-dashboard listening-studio listening-session-page">
      <section className="listening-session" aria-labelledby="listening-question-title">
        <header className="listening-session-header">
          <button aria-label="Rời lượt nghe" className="listening-back" onClick={() => setView("intro")} type="button"><ArrowLeft aria-hidden="true" size={20} /></button>
          <div className="listening-progress-block">
            <div><strong>{currentLevel.label} · {MODE_CONTENT[currentMode].label}</strong><span>Câu {questionIndex + 1}/{ROUND_LENGTH}</span></div>
            <div aria-label={`Tiến độ ${questionIndex + 1} trên ${ROUND_LENGTH}`} className="listening-progress"><span style={{ transform: `scaleX(${progress / 100})` }} /></div>
          </div>
          <div className="listening-score"><Check aria-hidden="true" size={17} /><strong>{score}</strong><span>đúng</span></div>
        </header>

        <div className="listening-question-stage">
          <p id="listening-question-title">{MODE_CONTENT[currentMode].prompt}</p>
          <button
            aria-label={isSpeaking ? "Đang phát câu tiếng Trung" : "Phát câu tiếng Trung"}
            className={`listening-play-button ${isSpeaking ? "is-speaking" : ""}`.trim()}
            onClick={() => playWord()}
            type="button"
          >
            <Volume2 aria-hidden="true" size={34} />
            <span aria-hidden="true"><i /><i /><i /><i /></span>
          </button>
          <strong>{isSpeaking ? "Đang phát…" : "Bấm để nghe lại"}</strong>
          <button aria-pressed={slowPlayback} className="listening-speed" onClick={() => setSlowPlayback((value) => !value)} type="button">
            <SlidersHorizontal aria-hidden="true" size={16} /> {slowPlayback ? "Tốc độ chậm" : "Tốc độ thường"}
          </button>
          {!audioSupported ? <small role="status">Trình duyệt chưa hỗ trợ giọng đọc. Bạn vẫn có thể luyện với đáp án hiển thị sau mỗi câu.</small> : null}
        </div>

        {(currentMode === "hanzi" || currentMode === "meaning") ? (
          <div className="listening-choice-grid">
            {choices.map((choice, index) => {
              const isCorrect = choice === currentWord[choiceKey];
              const isSelected = answer === choice;
              const stateClass = status === "idle" ? "" : isCorrect ? "is-correct" : isSelected ? "is-wrong" : "is-muted";
              return (
                <button className={stateClass} disabled={status !== "idle"} key={choice} onClick={() => selectChoice(choice)} type="button">
                  <span>{String.fromCharCode(65 + index)}</span><strong lang={currentMode === "hanzi" ? "zh-CN" : undefined}>{choice}</strong>
                  {status !== "idle" && isCorrect ? <Check aria-hidden="true" size={18} /> : status === "wrong" && isSelected ? <X aria-hidden="true" size={18} /> : null}
                </button>
              );
            })}
          </div>
        ) : (
          <form className="listening-typing-form" onSubmit={checkTypedAnswer}>
            <label htmlFor="listening-answer">{currentMode === "pinyin" ? "Pinyin bạn nghe được" : "Câu bằng Hán tự"}</label>
            <div>
              <input
                autoComplete="off"
                disabled={status !== "idle"}
                id="listening-answer"
                lang={currentMode === "dictation" ? "zh-CN" : undefined}
                onChange={(event) => setAnswer(event.target.value)}
                placeholder={currentMode === "pinyin" ? "Ví dụ: ni hao hoặc nǐ hǎo" : "Dùng bộ gõ tiếng Trung của thiết bị"}
                spellCheck={false}
                value={answer}
              />
              <button disabled={!answer.trim() || status !== "idle"} type="submit"><Check aria-hidden="true" size={19} /><span>Kiểm tra</span></button>
            </div>
          </form>
        )}

        {status !== "idle" ? (
          <div aria-live="polite" className={`listening-feedback is-${status}`} role="status">
            <div>{status === "correct" ? <Check aria-hidden="true" size={20} /> : <X aria-hidden="true" size={20} />}</div>
            <span><strong>{status === "correct" ? "Nghe đúng rồi!" : "Chưa khớp, nghe lại câu này nhé."}</strong><small><b lang="zh-CN">{currentMode === "dictation" ? currentWord.example : currentWord.hanzi}</b> · {currentWord.pinyin} · {currentWord.meaning}{status === "wrong" && (currentMode === "pinyin" || currentMode === "dictation") ? ` · Đáp án: ${answerLabel}` : ""}</small></span>
            <button onClick={nextQuestion} type="button">{questionIndex === ROUND_LENGTH - 1 ? "Xem kết quả" : "Câu tiếp theo"}<ChevronRight aria-hidden="true" size={18} /></button>
          </div>
        ) : null}
      </section>
    </main>
  );
}
