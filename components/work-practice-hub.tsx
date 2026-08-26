"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Crown,
  Factory,
  Gauge,
  Headphones,
  LockKeyhole,
  MessagesSquare,
  PackageCheck,
  Play,
  RotateCcw,
  ShoppingBag,
  Store,
  Trophy,
  UtensilsCrossed,
  Volume2,
  Warehouse,
  X,
} from "lucide-react";
import { PracticeBoard } from "@/components/practice-board";
import type { PracticeProgressSnapshot } from "@/lib/activity-progress";
import type { Vocabulary } from "@/lib/content-types";
import { withDailySessionFlow, type DailyRecommendation } from "@/lib/daily-session";
import type {
  PracticeExercise,
  PracticeIndustry,
  PracticeIndustryId,
  PracticeScenarioDto,
} from "@/lib/practice-content";
import { getPracticeListeningStatement } from "@/lib/practice-content";
import type { WeeklyChallenge } from "@/lib/weekly-challenges";

const COMPLETED_STORAGE_KEY = "hanziwork.practice.completed.v1";
const EMPTY_EXERCISES: PracticeExercise[] = [];

const industryIcons: Record<string, typeof BriefcaseBusiness> = {
  office: BriefcaseBusiness,
  factory: Factory,
  logistics: Warehouse,
  sales: ShoppingBag,
  restaurant: UtensilsCrossed,
  ecommerce: Store,
  core: MessagesSquare,
};

const industryPhotos: Record<string, string> = {
  office: "/assets/practice/office-progress-meeting.webp",
  factory: "/assets/courses/factory-production.webp",
  logistics: "/assets/courses/warehouse-logistics.webp",
  sales: "/assets/courses/sales-customer-care.webp",
  restaurant: "/assets/courses/restaurant-service.webp",
  ecommerce: "/assets/courses/ecommerce-operations.webp",
  core: "/assets/courses/workplace-communication.webp",
};

type HubMode = "catalog" | "session" | "complete" | "review";
type ListeningPhase = "idle" | "playing" | "ready";
type SaveState = "idle" | "saving" | "saved" | "error";

function formatAudioDuration(seconds: number | null): string {
  if (seconds === null) return "--:--";
  const safeSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  return `${minutes}:${String(safeSeconds % 60).padStart(2, "0")}`;
}

function readCompletedScenarios(): string[] {
  try {
    const value = window.localStorage.getItem(COMPLETED_STORAGE_KEY);
    const parsed: unknown = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function WorkPracticeHub({
  industries,
  scenarios,
  vocabulary,
  authenticated,
  dailyFlow,
  dailyNextStep,
  initialProgress,
  initialScenarioId,
  hasVip,
  todayLabel,
  weeklyChallenge,
}: {
  industries: PracticeIndustry[];
  scenarios: PracticeScenarioDto[];
  vocabulary: Vocabulary[];
  authenticated: boolean;
  dailyFlow: boolean;
  dailyNextStep: DailyRecommendation | null;
  initialProgress: PracticeProgressSnapshot;
  initialScenarioId: string | null;
  hasVip: boolean;
  todayLabel: string;
  weeklyChallenge: WeeklyChallenge;
}) {
  const initialScenario = scenarios.find((scenario) => scenario.id === initialScenarioId) ?? scenarios[0];
  const [activeIndustry, setActiveIndustry] = useState<PracticeIndustryId>(initialScenario?.industry ?? industries[0]?.id ?? "office");
  const [selectedScenarioId, setSelectedScenarioId] = useState(initialScenario?.id ?? "");
  const [mode, setMode] = useState<HubMode>("catalog");
  const [step, setStep] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const [listeningPhase, setListeningPhase] = useState<ListeningPhase>("idle");
  const [audioUnavailable, setAudioUnavailable] = useState(false);
  const [score, setScore] = useState(0);
  const [completedScenarios, setCompletedScenarios] = useState<string[]>(initialProgress.completedScenarioIds);
  const [attemptCount, setAttemptCount] = useState(initialProgress.attemptCount);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [audioDurationSeconds, setAudioDurationSeconds] = useState<number | null>(null);
  const [audioSource, setAudioSource] = useState<"file" | "device" | null>(null);
  const [showUpgradeNote, setShowUpgradeNote] = useState(false);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const preloadAudioRef = useRef<HTMLAudioElement | null>(null);
  const playbackIdRef = useRef(0);
  const playbackStartedAtRef = useRef(0);
  const sessionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (authenticated) return;
    const timer = window.setTimeout(() => setCompletedScenarios(readCompletedScenarios()), 0);
    return () => window.clearTimeout(timer);
  }, [authenticated]);

  const industryScenarios = useMemo(
    () => scenarios.filter((scenario) => scenario.industry === activeIndustry),
    [activeIndustry, scenarios],
  );
  const selectedScenario = scenarios.find((scenario) => scenario.id === selectedScenarioId)
    ?? industryScenarios[0]
    ?? scenarios[0];
  const exercises = selectedScenario?.exercises ?? EMPTY_EXERCISES;
  const exercise = exercises[step];
  const listeningStatement = exercise && selectedScenario
    ? getPracticeListeningStatement(exercise, selectedScenario)
    : null;
  const currentIndustry = industries.find((industry) => industry.id === activeIndustry);
  const currentIndustryPhoto = currentIndustry?.imageUrl
    ?? industryPhotos[activeIndustry]
    ?? industryPhotos.core;
  const answerWasCorrect = selectedAnswer !== null
    && listeningStatement !== null
    && selectedAnswer === listeningStatement.isCorrect;
  const dailyNextHref = dailyNextStep ? withDailySessionFlow(dailyNextStep.href) : "/games?session=today";
  const dailyNextIsSummary = dailyNextStep?.href.includes("#today-summary") ?? false;

  useEffect(() => () => {
    playbackIdRef.current += 1;
    audioRef.current?.pause();
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    preloadAudioRef.current = null;
  }, []);

  useEffect(() => {
    if (mode !== "session") {
      preloadAudioRef.current = null;
      return;
    }
    const nextAudioUrl = exercises[step + 1]?.audioUrl;
    if (!nextAudioUrl) {
      preloadAudioRef.current = null;
      return;
    }
    const preloadAudio = new Audio();
    preloadAudio.preload = "auto";
    preloadAudio.src = nextAudioUrl;
    preloadAudio.load();
    preloadAudioRef.current = preloadAudio;
    return () => {
      if (preloadAudioRef.current === preloadAudio) preloadAudioRef.current = null;
      preloadAudio.removeAttribute("src");
    };
  }, [exercises, mode, step]);

  useEffect(() => {
    if (mode !== "session") return;
    const frame = window.requestAnimationFrame(() => sessionRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [mode, step]);

  useEffect(() => {
    if (mode !== "session" || listeningPhase !== "ready" || selectedAnswer !== null || !listeningStatement) return;

    function handleKeyboardAnswer(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const key = event.key.toLocaleLowerCase("vi");
      if (key !== "d" && key !== "s") return;
      const answer = key === "d";
      setSelectedAnswer(answer);
      if (answer === listeningStatement?.isCorrect) setScore((value) => value + 1);
    }

    window.addEventListener("keydown", handleKeyboardAnswer);
    return () => window.removeEventListener("keydown", handleKeyboardAnswer);
  }, [listeningPhase, listeningStatement, mode, selectedAnswer]);

  function chooseIndustry(industryId: PracticeIndustryId) {
    const firstScenario = scenarios.find((scenario) => scenario.industry === industryId);
    setActiveIndustry(industryId);
    if (firstScenario) setSelectedScenarioId(firstScenario.id);
    setMode("catalog");
    setShowUpgradeNote(false);
  }

  function chooseScenario(scenario: PracticeScenarioDto) {
    setSelectedScenarioId(scenario.id);
    setActiveIndustry(scenario.industry);
    setMode("catalog");
    setShowUpgradeNote(scenario.locked);
  }

  function stopCurrentAudio() {
    playbackIdRef.current += 1;
    setPreviewPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    window.speechSynthesis?.cancel();
  }

  function playScenarioPreview() {
    stopCurrentAudio();
    if (typeof window === "undefined" || !("speechSynthesis" in window) || !selectedScenario) {
      setAudioUnavailable(true);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(selectedScenario.sentenceZh);
    utterance.lang = "zh-CN";
    utterance.rate = 0.82;
    utterance.onend = () => setPreviewPlaying(false);
    utterance.onerror = () => {
      setPreviewPlaying(false);
      setAudioUnavailable(true);
    };
    setAudioUnavailable(false);
    setPreviewPlaying(true);
    window.speechSynthesis.speak(utterance);
  }

  function playExerciseAudio(targetExercise: PracticeExercise, slow = false) {
    stopCurrentAudio();
    const playbackId = playbackIdRef.current;
    const statement = getPracticeListeningStatement(targetExercise, selectedScenario);
    setAudioUnavailable(false);
    setAudioDurationSeconds(null);
    setAudioSource(null);
    setListeningPhase("playing");
    playbackStartedAtRef.current = window.performance.now();

    const finishPlayback = () => {
      if (playbackId !== playbackIdRef.current) return;
      const elapsedSeconds = (window.performance.now() - playbackStartedAtRef.current) / 1_000;
      if (Number.isFinite(elapsedSeconds) && elapsedSeconds > 0) setAudioDurationSeconds(elapsedSeconds);
      setListeningPhase("ready");
    };

    const speakWithDeviceVoice = () => {
      if (playbackId !== playbackIdRef.current) return;
      if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
        setAudioUnavailable(true);
        finishPlayback();
        return;
      }

      const utterance = new window.SpeechSynthesisUtterance(statement.text);
      setAudioSource("device");
      const isChinese = /[㐀-鿿]/u.test(statement.text);
      utterance.lang = isChinese ? "zh-CN" : "vi-VN";
      utterance.rate = slow ? 0.72 : 0.9;
      utterance.pitch = 1;
      const matchingVoice = window.speechSynthesis
        .getVoices()
        .find((voice) => voice.lang.toLowerCase().startsWith(isChinese ? "zh" : "vi"));
      if (matchingVoice) utterance.voice = matchingVoice;
      utterance.onend = finishPlayback;
      utterance.onerror = () => {
        setAudioUnavailable(true);
        finishPlayback();
      };
      window.speechSynthesis.speak(utterance);
    };

    if (targetExercise.audioUrl) {
      const audio = new Audio(targetExercise.audioUrl);
      let fallbackStarted = false;
      audioRef.current = audio;
      audio.preload = "auto";
      audio.playbackRate = slow ? 0.78 : 1;
      setAudioSource("file");
      audio.onloadedmetadata = () => {
        if (Number.isFinite(audio.duration)) setAudioDurationSeconds(audio.duration / audio.playbackRate);
      };
      audio.onended = finishPlayback;
      const fallbackToDeviceVoice = () => {
        if (fallbackStarted || playbackId !== playbackIdRef.current) return;
        fallbackStarted = true;
        audio.pause();
        audio.removeAttribute("src");
        if (audioRef.current === audio) audioRef.current = null;
        speakWithDeviceVoice();
      };
      audio.onerror = fallbackToDeviceVoice;
      void audio.play().catch(fallbackToDeviceVoice);
      return;
    }

    speakWithDeviceVoice();
  }

  function startScenario() {
    if (!selectedScenario) return;
    if (selectedScenario.locked || !selectedScenario.exercises) {
      setShowUpgradeNote(true);
      return;
    }
    setStep(0);
    setScore(0);
    setSelectedAnswer(null);
    setSaveState("idle");
    setShowUpgradeNote(false);
    playExerciseAudio(selectedScenario.exercises[0]);
    setMode("session");
  }

  function chooseListeningAnswer(answer: boolean) {
    if (selectedAnswer !== null || listeningPhase !== "ready" || !listeningStatement) return;
    setSelectedAnswer(answer);
    if (answer === listeningStatement.isCorrect) setScore((value) => value + 1);
  }

  function syncScenarioProgress() {
    if (!selectedScenario || !authenticated) return;
    setSaveState("saving");
    void fetch("/api/progress/practice", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          scenarioId: selectedScenario.id,
          correctAnswers: score,
          totalQuestions: exercises.length,
        }),
        keepalive: true,
    }).then(async (response) => {
      if (!response.ok) throw new Error("Practice attempt save failed");
      const payload = await response.json() as { progress?: PracticeProgressSnapshot };
      if (payload.progress) {
        setCompletedScenarios(payload.progress.completedScenarioIds);
        setAttemptCount(payload.progress.attemptCount);
      }
      setSaveState("saved");
    }).catch(() => setSaveState("error"));
  }

  function completeScenario() {
    if (!selectedScenario) return;
    const nextCompleted = Array.from(new Set([...completedScenarios, selectedScenario.id]));
    setCompletedScenarios(nextCompleted);
    setAttemptCount((value) => value + 1);

    if (authenticated) {
      syncScenarioProgress();
    } else {
      try {
        window.localStorage.setItem(COMPLETED_STORAGE_KEY, JSON.stringify(nextCompleted));
      } catch {
        // The exercise remains usable when private browsing blocks local storage.
      }
      setSaveState("saved");
    }
    setMode("complete");
  }

  function nextExercise() {
    if (selectedAnswer === null) return;
    if (step >= exercises.length - 1) {
      stopCurrentAudio();
      completeScenario();
      return;
    }
    const nextStep = step + 1;
    setStep(nextStep);
    setSelectedAnswer(null);
    playExerciseAudio(exercises[nextStep]);
  }

  function returnToCatalog() {
    stopCurrentAudio();
    setMode("catalog");
    setStep(0);
    setSelectedAnswer(null);
    setListeningPhase("idle");
  }

  return (
    <div className={`work-practice-layout ${mode === "catalog" ? "is-catalog" : ""} ${mode === "review" ? "is-review" : ""} ${mode === "session" || mode === "complete" ? "is-focused" : ""}`.trim()}>
      <section className="work-practice-main" aria-labelledby={mode === "catalog" ? "practice-title" : undefined}>
        {mode === "catalog" ? (
          <>
            <header className="practice-catalog-header">
              <div>
                <span>Kho ca làm</span>
                <h1 id="practice-title">Luyện cách nói trước khi vào ca</h1>
                <p>Chọn tình huống, nghe cách phản hồi và phán đoán như trong công việc thật.</p>
              </div>
              <div className="practice-catalog-today">
                <CalendarDays size={18} />
                <span>
                  <strong>{todayLabel}</strong>
                  <small>Một ca ngắn cũng là tiến bộ.</small>
                </span>
              </div>
            </header>

            <div className="practice-industry-tabs" role="tablist" aria-label="Chọn ngành để luyện">
              {industries.map((industry) => {
                const Icon = industryIcons[industry.id] ?? BriefcaseBusiness;
                const active = industry.id === activeIndustry;
                return (
                  <button
                    aria-selected={active}
                    className={active ? "active" : ""}
                    key={industry.id}
                    onClick={() => chooseIndustry(industry.id)}
                    role="tab"
                    type="button"
                  >
                    <Icon size={17} />
                    <span>{industry.label}</span>
                  </button>
                );
              })}
            </div>
          </>
        ) : null}

        {mode === "review" ? (
          <section className="practice-review-session">
            <div className="practice-session-heading">
              <button className="practice-back-button" onClick={returnToCatalog} type="button">
                <ArrowLeft size={17} /> Kho ca làm
              </button>
              <div>
                <span>Ôn nhanh theo lịch</span>
                <h2>Những từ cần gặp lại hôm nay</h2>
              </div>
            </div>
            <PracticeBoard authenticated={authenticated} vocabulary={vocabulary} />
          </section>
        ) : null}

        {mode === "session" && selectedScenario && exercise && listeningStatement ? (
          <section
            aria-live="polite"
            className="practice-session-card practice-listening-card"
            ref={sessionRef}
            tabIndex={-1}
          >
            <div className="practice-session-topline">
              <span>Lượt nghe {step + 1} / {exercises.length}</span>
              <button aria-label="Thoát ca" className="practice-back-button" onClick={returnToCatalog} type="button">
                <X size={17} />
              </button>
            </div>
            <div
              aria-label={`Tiến độ ${step + 1} trên ${exercises.length}`}
              aria-valuemax={exercises.length}
              aria-valuemin={1}
              aria-valuenow={step + 1}
              className="scenario-progress"
              role="progressbar"
            >
              <span style={{ width: `${((step + 1) / exercises.length) * 100}%` }} />
            </div>

            <div className="practice-listening-layout">
              <aside className="listening-session-context">
                <span>Ca {String(step + 1).padStart(2, "0")}</span>
                <h2>{selectedScenario.title}</h2>
                <p>{selectedScenario.context}</p>
              </aside>

              <div className={`practice-audio-stage ${listeningPhase}`} role="status">
                <h2>Nghe cách nhân viên phản hồi</h2>
                <span className="practice-audio-state">
                  {listeningPhase === "playing" ? "Đang phát audio" : "Đã nghe xong"}
                </span>
                <button
                  aria-label={listeningPhase === "playing" ? "Audio đang phát" : "Nghe lại câu vừa rồi"}
                  className="practice-audio-orb"
                  disabled={listeningPhase === "playing"}
                  onClick={() => playExerciseAudio(exercise)}
                  type="button"
                >
                  {listeningPhase === "playing"
                    ? <Headphones size={42} strokeWidth={1.8} />
                    : <RotateCcw size={50} strokeWidth={1.7} />}
                </button>
                <span
                  className="practice-audio-time"
                  aria-label={audioDurationSeconds === null ? "Đang đo thời lượng audio" : `Thời lượng audio ${Math.round(audioDurationSeconds)} giây`}
                >
                  {audioDurationSeconds === null && listeningPhase === "playing"
                    ? "Đang đo thời lượng"
                    : `0:00 — ${formatAudioDuration(audioDurationSeconds)}`}
                </span>
                <div className="practice-audio-controls">
                  <button disabled={listeningPhase === "playing"} onClick={() => playExerciseAudio(exercise)} type="button">
                    <Volume2 size={17} /> Nghe lại
                  </button>
                  <button disabled={listeningPhase === "playing"} onClick={() => playExerciseAudio(exercise, true)} type="button">
                    <Gauge size={17} /> Nghe chậm 0.8×
                  </button>
                </div>
                <small className={audioUnavailable ? "is-warning" : ""}>
                  {audioUnavailable
                    ? "Thiết bị chưa phát được giọng đọc. Bản chép sẽ hiện sau khi bạn chọn."
                    : audioSource === "device"
                      ? "Đang dùng giọng đọc trên thiết bị. Bản chép sẽ mở sau khi trả lời."
                      : "Bản chép lời sẽ mở sau khi trả lời."}
                </small>
              </div>
            </div>

            {listeningPhase === "ready" ? (
              <div className="listening-answer-panel">
                <h3>Câu vừa nghe có phù hợp với tình huống này không?</h3>
                <div className="binary-answer-grid">
                  <button
                    aria-pressed={selectedAnswer === true}
                    className={`binary-answer-button ${selectedAnswer !== null ? (listeningStatement.isCorrect ? "correct" : selectedAnswer === true ? "incorrect" : "muted") : ""}`.trim()}
                    disabled={selectedAnswer !== null}
                    onClick={() => chooseListeningAnswer(true)}
                    type="button"
                  >
                    <span><Check size={23} /></span>
                    <span><strong>Đúng</strong><small>Phù hợp với tình huống</small></span>
                    <kbd aria-hidden="true">D</kbd>
                  </button>
                  <button
                    aria-pressed={selectedAnswer === false}
                    className={`binary-answer-button ${selectedAnswer !== null ? (!listeningStatement.isCorrect ? "correct" : selectedAnswer === false ? "incorrect" : "muted") : ""}`.trim()}
                    disabled={selectedAnswer !== null}
                    onClick={() => chooseListeningAnswer(false)}
                    type="button"
                  >
                    <span><X size={23} /></span>
                    <span><strong>Sai</strong><small>Chưa phù hợp với tình huống</small></span>
                    <kbd aria-hidden="true">S</kbd>
                  </button>
                </div>
              </div>
            ) : (
              <div className="listening-answer-lock"><Headphones size={17} /> Đáp án mở sau khi audio kết thúc</div>
            )}

            {selectedAnswer !== null ? (
              <div className={`listening-feedback ${answerWasCorrect ? "correct" : ""}`} role="status">
                <div className="listening-feedback-title">
                  {answerWasCorrect ? <CheckCircle2 size={21} /> : <X size={21} />}
                  <strong>{answerWasCorrect ? "Chính xác — bạn bắt đúng ý." : "Chưa đúng — nghe lại điểm mấu chốt."}</strong>
                </div>
                <div className="listening-transcript">
                  <span>Bạn vừa nghe</span>
                  <strong lang="zh">{listeningStatement.text}</strong>
                </div>
                {!listeningStatement.isCorrect ? (
                  <div className="listening-correction">
                    <span>Cách phù hợp hơn</span>
                    <strong lang="zh">{listeningStatement.correctText}</strong>
                  </div>
                ) : null}
                <div>
                  <p>{listeningStatement.explanation}</p>
                </div>
              </div>
            ) : null}
            <div className="practice-session-actions">
              <button disabled={selectedAnswer === null} onClick={nextExercise} type="button">
                {step === exercises.length - 1 ? "Xem kết quả" : "Lượt tiếp theo"} <ArrowRight size={17} />
              </button>
            </div>
          </section>
        ) : null}

        {mode === "complete" && selectedScenario ? (
          <section className="practice-case-card scenario-complete-card" aria-live="polite">
            <span className="scenario-complete-icon"><Trophy size={31} /></span>
            <span className="practice-hub-kicker">Đã nghe xong ca</span>
            <h2>{selectedScenario.title}</h2>
            <p>Bạn nghe và phán đoán đúng <strong>{score}/{exercises.length}</strong> lượt. Câu mẫu trọng tâm đã sẵn sàng để dùng khi gặp tình huống thật.</p>
            <p className={`practice-sync-status is-${saveState}`} role="status">
              {saveState === "saving" ? "Đang đồng bộ kết quả với tài khoản…"
                : saveState === "saved" ? authenticated ? "Đã đồng bộ với tài khoản của bạn." : "Đã lưu kết quả trên thiết bị này."
                  : saveState === "error" ? "Chưa thể đồng bộ. Kết quả vẫn được giữ trong phiên này."
                    : "Kết quả của phiên vừa hoàn thành."}
            </p>
            <div className="scenario-quote">
              <strong lang="zh">{selectedScenario.sentenceZh}</strong>
              <span>{selectedScenario.translation}</span>
            </div>
            <div className="scenario-complete-actions">
              <button onClick={startScenario} type="button"><RotateCcw size={17} /> Luyện lại ca này</button>
              {dailyFlow && dailyNextStep
                ? saveState === "saving"
                  ? <button className="primary" disabled type="button">Đang lưu kết quả…</button>
                  : saveState === "error"
                    ? <button className="primary" onClick={syncScenarioProgress} type="button"><RotateCcw size={17} /> Thử đồng bộ lại</button>
                    : <Link className="primary" href={dailyNextHref} prefetch>
                      {dailyNextIsSummary ? "Xem tổng kết 4/4" : "03/04 · Phản xạ 1 phút"} <ArrowRight size={17} />
                    </Link>
                : <button className="primary" onClick={returnToCatalog} type="button">Chọn ca khác <ArrowRight size={17} /></button>}
            </div>
          </section>
        ) : null}

        {mode === "catalog" && selectedScenario ? (
          <>
            <article className={`practice-feature ${selectedScenario.locked ? "is-locked" : ""}`}>
              <div className="practice-feature-copy">
                <span className="practice-feature-kicker">Ca đề xuất <i /></span>
                <h2>{selectedScenario.title}</h2>
                <p className="practice-feature-brief">{selectedScenario.brief}</p>
                <div className="practice-feature-meta">
                  <span><Clock3 size={16} /> {selectedScenario.durationMinutes} phút</span>
                  <span><Headphones size={16} /> Nghe trước · Đúng/Sai</span>
                  <span className={selectedScenario.isFree ? "free" : "vip"}>
                    {selectedScenario.isFree ? <PackageCheck size={15} /> : <Crown size={15} />}
                    {selectedScenario.isFree ? "Miễn phí" : "VIP"}
                  </span>
                </div>
                <div className="practice-feature-language">
                  <strong lang="zh">{selectedScenario.sentenceZh}</strong>
                  <p>{selectedScenario.pinyin}</p>
                  <small>{selectedScenario.translation}</small>
                </div>

                {showUpgradeNote && selectedScenario.locked ? (
                  <div className="practice-inline-upgrade" role="status">
                    <Crown size={18} />
                    <p><strong>Ca này thuộc kho VIP.</strong> Bạn vẫn xem được câu mẫu; phần luyện từng lượt sẽ mở sau khi nâng cấp.</p>
                    <Link href="/vip">Xem quyền lợi</Link>
                  </div>
                ) : null}

                <div className="practice-feature-actions">
                  <button className="practice-start-button" onClick={startScenario} type="button">
                    {selectedScenario.locked ? <LockKeyhole size={17} /> : <Play size={17} fill="currentColor" />}
                    {selectedScenario.locked ? "Mở khóa ca này" : "Bắt đầu ca nghe"}
                  </button>
                  <button
                    aria-pressed={previewPlaying}
                    className="practice-preview-button"
                    onClick={playScenarioPreview}
                    type="button"
                  >
                    <Volume2 size={18} /> {previewPlaying ? "Đang phát câu ví dụ" : "Nghe câu ví dụ"}
                  </button>
                </div>
                {audioUnavailable ? <small className="practice-preview-warning" role="status">Thiết bị chưa phát được giọng đọc.</small> : null}
              </div>

              <div className="practice-feature-media">
                <Image
                  alt={`Đồng nghiệp trao đổi trong bối cảnh ${currentIndustry?.label.toLocaleLowerCase("vi") ?? "công việc"}`}
                  height={1067}
                  priority
                  sizes="(max-width: 720px) 100vw, 48vw"
                  src={currentIndustryPhoto}
                  unoptimized
                  width={1600}
                />
              </div>
            </article>

            <section className="practice-next-cases" aria-labelledby="related-cases-title">
              <h2 id="related-cases-title">Ca tiếp theo</h2>
              <div>
                {industryScenarios.filter((scenario) => scenario.id !== selectedScenario.id).slice(0, 3).map((scenario, index) => (
                  <button key={scenario.id} onClick={() => chooseScenario(scenario)} type="button">
                    <span className="practice-next-index">{String(index + 2).padStart(2, "0")}</span>
                    <strong>{scenario.title}</strong>
                    <small>{scenario.brief}</small>
                    <span className="practice-next-duration"><Clock3 size={15} /> {scenario.durationMinutes} phút</span>
                    <span className={scenario.isFree ? "practice-next-access free" : "practice-next-access"}>
                      {scenario.isFree ? "Miễn phí" : <><Crown size={15} /> VIP</>}
                    </span>
                    <ChevronRight size={18} />
                  </button>
                ))}
              </div>
            </section>

            <footer className="practice-catalog-footer">
              <span><BriefcaseBusiness size={20} /><strong>{completedScenarios.length}</strong> ca đã luyện</span>
              <button onClick={() => setMode("review")} type="button"><RotateCcw size={20} /><strong>{vocabulary.length}</strong> từ cần ôn</button>
              {hasVip
                ? <span className="practice-catalog-vip active"><CheckCircle2 size={18} /> Kho VIP đã mở</span>
                : <Link className="practice-catalog-vip" href="/vip"><Crown size={19} /> Mở thêm ca VIP <ArrowRight size={18} /></Link>}
            </footer>
          </>
        ) : null}
      </section>

      {mode === "review" ? <aside className="work-practice-aside" aria-label="Tóm tắt luyện tập">
        <section className="practice-progress-panel">
          <div className="practice-aside-title">
            <span>Nhịp luyện của bạn</span>
            <strong>Tiếp tục từ việc nhỏ</strong>
          </div>
          <div className="practice-metric-list">
            <div>
              <span className="metric-icon"><BriefcaseBusiness size={18} /></span>
              <span><strong>{completedScenarios.length}</strong><small>Ca đã luyện</small></span>
            </div>
            <button onClick={() => setMode("review")} type="button">
              <span className="metric-icon warm"><RotateCcw size={18} /></span>
              <span><strong>{vocabulary.length}</strong><small>Từ cần ôn hôm nay</small></span>
              <ChevronRight size={17} />
            </button>
          </div>
          <p>{authenticated ? `${attemptCount} lượt luyện và lịch ôn từ đang được đồng bộ với tài khoản của bạn.` : "Ca đã luyện được giữ trên thiết bị này. Đăng nhập để đồng bộ giữa các thiết bị."}</p>
        </section>

        <section className="practice-weekly-panel">
          <span className="practice-weekly-label">Thử thách tuần này</span>
          <h2>{weeklyChallenge.title}</h2>
          <p>{weeklyChallenge.situation}</p>
          <strong lang="zh">{weeklyChallenge.keyPhrase}</strong>
          <Link href={`/learn/${weeklyChallenge.courseSlug}?lesson=${weeklyChallenge.lessonSlug}`}>Mở bài liên quan <ArrowRight size={15} /></Link>
        </section>

        <section className={`practice-vip-panel ${hasVip ? "is-active" : ""}`}>
          <span className="practice-vip-icon"><Crown size={19} /></span>
          <span className="practice-vip-label">{hasVip ? "VIP đang hoạt động" : "Himi Chinese VIP"}</span>
          <h2>{hasVip ? "Toàn bộ kho ca làm đã mở." : "Luyện trước khi tình huống thật xảy ra."}</h2>
          <p>{hasVip ? "Bạn có thể ôn từ của toàn bộ 168 bài và luyện các ca nâng cao không giới hạn." : "Mở 126 bài chuyên sâu thuộc bảy lộ trình, ôn theo từ yếu và luyện các ca nâng cao."}</p>
          {!hasVip ? <Link href="/vip">Khám phá gói VIP <ArrowRight size={16} /></Link> : <span className="vip-active-note"><CheckCircle2 size={15} /> Đã mở khóa</span>}
        </section>

        <section className="practice-industry-note">
          <span>{currentIndustry?.label}</span>
          <p>{currentIndustry?.description}</p>
          <div>{industryScenarios.map((scenario) => <i className={!scenario.locked ? "available" : ""} key={scenario.id} />)}</div>
        </section>
      </aside> : null}
    </div>
  );
}
