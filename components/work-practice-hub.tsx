"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AudioLines,
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
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
  SlidersHorizontal,
  Store,
  Trophy,
  UtensilsCrossed,
  Volume2,
  Warehouse,
  X,
} from "lucide-react";
import { PracticeBoard } from "@/components/practice-board";
import { HimiSectionBanner } from "@/components/himi-section-banner";
import type { PracticeProgressSnapshot } from "@/lib/activity-progress";
import type { Vocabulary } from "@/lib/content-types";
import { withDailySessionFlow, type DailyRecommendation } from "@/lib/daily-session";
import type {
  PracticeExercise,
  PracticeIndustry,
  PracticeIndustryId,
  PracticeScenarioDto,
} from "@/lib/practice-content";
import { getPracticeListeningStatement, getPracticeMeaningQuestion } from "@/lib/practice-content";
import {
  combineListeningPerformance,
  emptyListeningPerformance,
  HSK_LISTENING_PERFORMANCE_KEY,
  parseListeningPerformance,
  SCENARIO_LISTENING_PERFORMANCE_KEY,
  summarizeListeningPerformance,
  type ListeningPerformanceTotals,
} from "@/lib/listening-performance";
import {
  clampPracticeReactionMs,
  formatPracticeReactionTime,
  PRACTICE_ANSWER_WINDOW_MS,
} from "@/lib/practice-performance";
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
  office: "/assets/courses/himi-concepts/himi-office-administration.png",
  factory: "/assets/courses/himi-concepts/himi-factory-production.png",
  logistics: "/assets/courses/himi-concepts/himi-warehouse-logistics.png",
  sales: "/assets/courses/himi-concepts/himi-sales-customer-care.png",
  restaurant: "/assets/courses/himi-concepts/himi-restaurant-service.png",
  ecommerce: "/assets/courses/himi-concepts/himi-ecommerce-operations.png",
  core: "/assets/courses/himi-concepts/himi-workplace-communication.png",
};

type HubMode = "catalog" | "session" | "complete" | "review";
type ListeningPhase = "idle" | "playing" | "ready";
type SaveState = "idle" | "saving" | "saved" | "error";
type StoredPracticePerformance = {
  attemptCount: number;
  correctAnswers: number;
  totalQuestions: number;
  totalReactionMs: number;
};

function readCompletedScenarios(): string[] {
  try {
    const value = window.localStorage.getItem(COMPLETED_STORAGE_KEY);
    const parsed: unknown = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function readStoredPerformance(): StoredPracticePerformance | null {
  try {
    const value = window.localStorage.getItem(SCENARIO_LISTENING_PERFORMANCE_KEY);
    const parsed: unknown = value ? JSON.parse(value) : null;
    if (!parsed || typeof parsed !== "object") return null;
    const record = parsed as Record<string, unknown>;
    if (![record.attemptCount, record.correctAnswers, record.totalQuestions, record.totalReactionMs]
      .every((item) => Number.isInteger(item) && Number(item) >= 0)) return null;
    const storedPerformance = record as StoredPracticePerformance;
    if (storedPerformance.correctAnswers > storedPerformance.totalQuestions
      || storedPerformance.totalReactionMs > storedPerformance.totalQuestions * PRACTICE_ANSWER_WINDOW_MS) return null;
    return storedPerformance;
  } catch {
    return null;
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
  overviewHeader,
  hasVip,
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
  overviewHeader?: ReactNode;
  hasVip: boolean;
  weeklyChallenge: WeeklyChallenge;
}) {
  const initialScenario = scenarios.find((scenario) => scenario.id === initialScenarioId) ?? scenarios[0];
  const [activeIndustry, setActiveIndustry] = useState<PracticeIndustryId>(initialScenario?.industry ?? industries[0]?.id ?? "office");
  const [selectedScenarioId, setSelectedScenarioId] = useState(initialScenario?.id ?? "");
  const [mode, setMode] = useState<HubMode>("catalog");
  const [step, setStep] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answerExpired, setAnswerExpired] = useState(false);
  const [remainingAnswerMs, setRemainingAnswerMs] = useState(PRACTICE_ANSWER_WINDOW_MS);
  const [reactionTimesMs, setReactionTimesMs] = useState<number[]>([]);
  const [currentReactionMs, setCurrentReactionMs] = useState<number | null>(null);
  const [listeningPhase, setListeningPhase] = useState<ListeningPhase>("idle");
  const [slowPlayback, setSlowPlayback] = useState(false);
  const [audioUnavailable, setAudioUnavailable] = useState(false);
  const [score, setScore] = useState(0);
  const [completedScenarios, setCompletedScenarios] = useState<string[]>(initialProgress.completedScenarioIds);
  const [attemptCount, setAttemptCount] = useState(initialProgress.attemptCount);
  const [scenarioPerformance, setScenarioPerformance] = useState<ListeningPerformanceTotals>({
    correctAnswers: initialProgress.correctAnswers ?? 0,
    totalQuestions: initialProgress.totalQuestions ?? 0,
    totalReactionMs: initialProgress.totalReactionMs ?? 0,
    reactionQuestions: initialProgress.reactionQuestions ?? 0,
  });
  const [hskPerformance, setHskPerformance] = useState<ListeningPerformanceTotals>(emptyListeningPerformance);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [, setAudioDurationSeconds] = useState<number | null>(null);
  const [, setAudioSource] = useState<"file" | "device" | null>(null);
  const [showUpgradeNote, setShowUpgradeNote] = useState(false);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const preloadAudioRef = useRef<HTMLAudioElement | null>(null);
  const playbackIdRef = useRef(0);
  const playbackStartedAtRef = useRef(0);
  const answerStartedAtRef = useRef(0);
  const answerLockedRef = useRef(true);
  const selectedAnswerRef = useRef<number | null>(null);
  const currentReactionRef = useRef<number | null>(null);
  const sessionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        setHskPerformance(parseListeningPerformance(
          window.localStorage.getItem(HSK_LISTENING_PERFORMANCE_KEY),
        ));
      } catch {
        setHskPerformance(emptyListeningPerformance);
      }
      if (authenticated) return;
      setCompletedScenarios(readCompletedScenarios());
      const storedPerformance = readStoredPerformance();
      if (!storedPerformance) return;
      setAttemptCount(storedPerformance.attemptCount);
      setScenarioPerformance({
        correctAnswers: storedPerformance.correctAnswers,
        totalQuestions: storedPerformance.totalQuestions,
        totalReactionMs: storedPerformance.totalReactionMs,
        reactionQuestions: storedPerformance.totalQuestions,
      });
    }, 0);
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
  const meaningQuestion = useMemo(
    () => exercise ? getPracticeMeaningQuestion(exercise) : null,
    [exercise],
  );
  const listeningStatement = exercise && selectedScenario
    ? getPracticeListeningStatement(exercise, selectedScenario)
    : null;
  const currentIndustry = industries.find((industry) => industry.id === activeIndustry);
  const currentIndustryPhoto = currentIndustry?.imageUrl
    ?? industryPhotos[activeIndustry]
    ?? industryPhotos.core;
  const answerRevealed = answerExpired;
  const answerWasCorrect = answerRevealed
    && selectedAnswer !== null
    && meaningQuestion !== null
    && selectedAnswer === meaningQuestion.correctOption;
  const answerCountdownSeconds = Math.max(0, Math.ceil(remainingAnswerMs / 1_000));
  const answerCountdownProgress = Math.max(0, Math.min(1, remainingAnswerMs / PRACTICE_ANSWER_WINDOW_MS));
  const answeredQuestions = reactionTimesMs.length;
  const sessionPerformance: ListeningPerformanceTotals = {
    correctAnswers: score,
    totalQuestions: answeredQuestions,
    totalReactionMs: reactionTimesMs.reduce((total, milliseconds) => total + milliseconds, 0),
    reactionQuestions: answeredQuestions,
  };
  const {
    accuracyPercent: sessionAccuracyPercent,
    averageReactionMs: sessionAverageReactionMs,
  } = summarizeListeningPerformance(sessionPerformance);
  const combinedPerformance = combineListeningPerformance(
    scenarioPerformance,
    hskPerformance,
    mode === "session" ? sessionPerformance : emptyListeningPerformance,
  );
  const { accuracyPercent, averageReactionMs } = summarizeListeningPerformance(combinedPerformance);
  const dailyNextHref = dailyNextStep ? withDailySessionFlow(dailyNextStep.href) : "/games?session=today";
  const dailyNextIsSummary = dailyNextStep?.href.includes("#today-summary") ?? false;

  const chooseListeningAnswer = useCallback((answerIndex: number) => {
    if (answerLockedRef.current || answerRevealed || listeningPhase !== "ready" || !meaningQuestion) return;
    answerLockedRef.current = true;
    const reactionMs = clampPracticeReactionMs(window.performance.now() - answerStartedAtRef.current);
    setRemainingAnswerMs(Math.max(0, PRACTICE_ANSWER_WINDOW_MS - reactionMs));
    setCurrentReactionMs(reactionMs);
    currentReactionRef.current = reactionMs;
    selectedAnswerRef.current = answerIndex;
    setSelectedAnswer(answerIndex);
  }, [answerRevealed, listeningPhase, meaningQuestion]);

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
    if (mode !== "session" || listeningPhase !== "ready" || answerRevealed || !meaningQuestion) return;
    const optionCount = meaningQuestion.options.length;

    function handleKeyboardAnswer(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const answerIndex = Number(event.key) - 1;
      if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex >= optionCount) return;
      chooseListeningAnswer(answerIndex);
    }

    window.addEventListener("keydown", handleKeyboardAnswer);
    return () => window.removeEventListener("keydown", handleKeyboardAnswer);
  }, [answerRevealed, chooseListeningAnswer, listeningPhase, meaningQuestion, mode]);

  useEffect(() => {
    if (mode !== "session" || listeningPhase !== "ready" || answerRevealed) return;

    const updateCountdown = () => {
      const elapsed = window.performance.now() - answerStartedAtRef.current;
      setRemainingAnswerMs(Math.max(0, PRACTICE_ANSWER_WINDOW_MS - elapsed));
    };
    const expireAnswer = () => {
      answerLockedRef.current = true;
      setRemainingAnswerMs(0);
      const reactionMs = currentReactionRef.current ?? PRACTICE_ANSWER_WINDOW_MS;
      setCurrentReactionMs(reactionMs);
      setReactionTimesMs((values) => [...values, reactionMs]);
      if (selectedAnswerRef.current === meaningQuestion?.correctOption) {
        setScore((value) => value + 1);
      }
      setAnswerExpired(true);
    };
    const elapsed = window.performance.now() - answerStartedAtRef.current;
    const remaining = Math.max(0, PRACTICE_ANSWER_WINDOW_MS - elapsed);
    updateCountdown();
    const interval = window.setInterval(updateCountdown, 100);
    const timeout = window.setTimeout(expireAnswer, remaining);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [answerRevealed, listeningPhase, meaningQuestion, mode, step]);

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

  function playExerciseAudio(targetExercise: PracticeExercise, slow = false, opensAnswerWindow = false) {
    stopCurrentAudio();
    const playbackId = playbackIdRef.current;
    const statement = getPracticeListeningStatement(targetExercise, selectedScenario);
    setAudioUnavailable(false);
    setAudioDurationSeconds(null);
    setAudioSource(null);
    setListeningPhase("playing");
    answerLockedRef.current = true;
    playbackStartedAtRef.current = window.performance.now();

    const finishPlayback = () => {
      if (playbackId !== playbackIdRef.current) return;
      const elapsedSeconds = (window.performance.now() - playbackStartedAtRef.current) / 1_000;
      if (Number.isFinite(elapsedSeconds) && elapsedSeconds > 0) setAudioDurationSeconds(elapsedSeconds);
      if (opensAnswerWindow) {
        answerStartedAtRef.current = window.performance.now();
        answerLockedRef.current = false;
        setRemainingAnswerMs(PRACTICE_ANSWER_WINDOW_MS);
      }
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
    selectedAnswerRef.current = null;
    setAnswerExpired(false);
    setRemainingAnswerMs(PRACTICE_ANSWER_WINDOW_MS);
    setReactionTimesMs([]);
    setCurrentReactionMs(null);
    setSlowPlayback(false);
    currentReactionRef.current = null;
    setSaveState("idle");
    setShowUpgradeNote(false);
    playExerciseAudio(selectedScenario.exercises[0], false, true);
    setMode("session");
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
          totalReactionMs: reactionTimesMs.reduce((total, milliseconds) => total + milliseconds, 0),
        }),
        keepalive: true,
    }).then(async (response) => {
      if (!response.ok) throw new Error("Practice attempt save failed");
      const payload = await response.json() as { progress?: PracticeProgressSnapshot };
      if (payload.progress) {
        setCompletedScenarios(payload.progress.completedScenarioIds);
        setAttemptCount(payload.progress.attemptCount);
        setScenarioPerformance({
          correctAnswers: payload.progress.correctAnswers,
          totalQuestions: payload.progress.totalQuestions,
          totalReactionMs: payload.progress.totalReactionMs,
          reactionQuestions: payload.progress.reactionQuestions,
        });
      }
      setSaveState("saved");
    }).catch(() => setSaveState("error"));
  }

  function completeScenario() {
    if (!selectedScenario) return;
    const nextCompleted = Array.from(new Set([...completedScenarios, selectedScenario.id]));
    const completedAttempt: ListeningPerformanceTotals = {
      correctAnswers: score,
      totalQuestions: exercises.length,
      totalReactionMs: reactionTimesMs.reduce((total, milliseconds) => total + milliseconds, 0),
      reactionQuestions: exercises.length,
    };
    setCompletedScenarios(nextCompleted);
    setAttemptCount((value) => value + 1);

    if (authenticated) {
      setScenarioPerformance((current) => combineListeningPerformance(current, completedAttempt));
      syncScenarioProgress();
    } else {
      try {
        window.localStorage.setItem(COMPLETED_STORAGE_KEY, JSON.stringify(nextCompleted));
        const storedPerformance = readStoredPerformance() ?? {
          attemptCount: 0,
          correctAnswers: 0,
          totalQuestions: 0,
          totalReactionMs: 0,
        };
        const nextPerformance: StoredPracticePerformance = {
          attemptCount: storedPerformance.attemptCount + 1,
          correctAnswers: storedPerformance.correctAnswers + score,
          totalQuestions: storedPerformance.totalQuestions + exercises.length,
          totalReactionMs: storedPerformance.totalReactionMs
            + reactionTimesMs.reduce((total, milliseconds) => total + milliseconds, 0),
        };
      window.localStorage.setItem(SCENARIO_LISTENING_PERFORMANCE_KEY, JSON.stringify(nextPerformance));
        setScenarioPerformance({
          correctAnswers: nextPerformance.correctAnswers,
          totalQuestions: nextPerformance.totalQuestions,
          totalReactionMs: nextPerformance.totalReactionMs,
          reactionQuestions: nextPerformance.totalQuestions,
        });
      } catch {
        // The exercise remains usable when private browsing blocks local storage.
      }
      setSaveState("saved");
    }
    setMode("complete");
  }

  function nextExercise() {
    if (!answerRevealed) return;
    if (step >= exercises.length - 1) {
      stopCurrentAudio();
      completeScenario();
      return;
    }
    const nextStep = step + 1;
    setStep(nextStep);
    setSelectedAnswer(null);
    selectedAnswerRef.current = null;
    setAnswerExpired(false);
    setRemainingAnswerMs(PRACTICE_ANSWER_WINDOW_MS);
    setCurrentReactionMs(null);
    setSlowPlayback(false);
    currentReactionRef.current = null;
    playExerciseAudio(exercises[nextStep], false, true);
  }

  function returnToCatalog() {
    stopCurrentAudio();
    setMode("catalog");
    setStep(0);
    setSelectedAnswer(null);
    selectedAnswerRef.current = null;
    setAnswerExpired(false);
    setRemainingAnswerMs(PRACTICE_ANSWER_WINDOW_MS);
    setReactionTimesMs([]);
    setCurrentReactionMs(null);
    setSlowPlayback(false);
    currentReactionRef.current = null;
    setListeningPhase("idle");
  }

  return (
    <div className={`work-practice-layout ${mode === "catalog" ? "is-catalog" : ""} ${mode === "review" ? "is-review" : ""} ${mode === "session" || mode === "complete" ? "is-focused" : ""}`.trim()}>
      <section className="work-practice-main" aria-labelledby={mode === "catalog" ? "practice-title" : undefined}>
        {mode === "catalog" ? (
          <>
            {overviewHeader}
            <div className="practice-banner-shell">
              <HimiSectionBanner
                description="Nghe audio theo tình huống, chọn đúng nghĩa và cải thiện tốc độ hiểu tiếng Trung."
                titleId="practice-title"
                titleLines={["Nghe đúng ý.", "Phản xạ nhanh hơn."]}
                variant="practice"
              />
            </div>

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

        {mode === "session" && selectedScenario && exercise && listeningStatement && meaningQuestion ? (
          <section
            className="practice-session-card practice-listening-card practice-meaning-session"
            ref={sessionRef}
            tabIndex={-1}
          >
            <div className="practice-meaning-session-nav">
              <span>{String(step + 1).padStart(2, "0")} / {String(exercises.length).padStart(2, "0")}</span>
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

            {answerRevealed ? (
              <div className="practice-meaning-outcome-shell">
                <div
                  className={`practice-listening-outcome ${answerWasCorrect ? "is-correct" : "is-review"}`}
                  role="status"
                >
                  <span className="practice-listening-outcome-icon">
                    {answerWasCorrect
                      ? <Trophy size={34} strokeWidth={1.8} />
                      : selectedAnswer === null
                        ? <Clock3 size={34} strokeWidth={1.8} />
                        : <X size={34} strokeWidth={1.8} />}
                  </span>
                  <span className="practice-listening-outcome-kicker">
                    {answerWasCorrect ? "Chúc mừng" : selectedAnswer === null ? "Hết thời gian" : "Cùng xem lại"}
                  </span>
                  <h2>
                    {answerWasCorrect
                      ? "Bạn đã chọn đúng!"
                      : selectedAnswer === null
                        ? "Đáp án đúng của câu này"
                        : "Chưa đúng — đây là đáp án"}
                  </h2>
                  <p>
                    {answerWasCorrect
                      ? `Bạn phản xạ trong ${formatPracticeReactionTime(currentReactionMs)} và đã bắt đúng ý chính.`
                      : selectedAnswer === null
                        ? "Bạn chưa chọn đáp án trong 8 giây. Hãy nghe lại và ghi nhớ cách diễn đạt này."
                        : `Phản xạ của bạn là ${formatPracticeReactionTime(currentReactionMs)}. Hãy đối chiếu lại ý nghĩa bên dưới.`}
                  </p>
                  <div className="practice-listening-outcome-answer">
                    <span>Bạn vừa nghe</span>
                    <strong lang="zh">{listeningStatement.text}</strong>
                    <span>{answerWasCorrect ? "Ý nghĩa bạn đã chọn" : "Đáp án đúng"}</span>
                    <strong>{meaningQuestion.options[meaningQuestion.correctOption]}</strong>
                  </div>
                  {!answerWasCorrect ? <p className="practice-listening-outcome-explanation">{exercise.explanation}</p> : null}
                  <div className="practice-listening-outcome-controls">
                    <button onClick={() => playExerciseAudio(exercise)} type="button">
                      <Volume2 size={16} /> Nghe lại
                    </button>
                    <button onClick={() => playExerciseAudio(exercise, true)} type="button">
                      <Gauge size={16} /> Nghe chậm 0.8×
                    </button>
                  </div>
                  <button className="practice-listening-next" onClick={nextExercise} type="button">
                    {step === exercises.length - 1 ? "Xem kết quả" : "Lượt tiếp theo"} <ArrowRight size={17} />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="practice-meaning-audio" aria-live="polite">
                  <span className="practice-meaning-prompt">
                    {listeningPhase === "playing"
                      ? "Nghe câu tiếng Trung"
                      : selectedAnswer === null
                        ? "Chọn ý nghĩa câu bạn vừa nghe"
                        : "Đáp án đã được ghi nhận"}
                  </span>
                  <div className="practice-meaning-audio-row">
                    <button
                      aria-label={listeningPhase === "playing" ? "Audio đang phát" : "Nghe lại câu vừa rồi"}
                      className={`practice-meaning-replay ${listeningPhase === "playing" ? "is-playing" : ""}`.trim()}
                      disabled={listeningPhase === "playing" || selectedAnswer !== null}
                      onClick={() => playExerciseAudio(exercise, slowPlayback, true)}
                      type="button"
                    >
                      <Volume2 size={36} strokeWidth={2.1} />
                    </button>
                    {listeningPhase === "playing" ? (
                      <AudioLines aria-hidden="true" className="practice-meaning-wave" size={38} strokeWidth={2.4} />
                    ) : (
                      <span
                        aria-label={selectedAnswer === null
                          ? `Còn ${answerCountdownSeconds} giây để trả lời`
                          : `Đã chốt đáp án, còn ${answerCountdownSeconds} giây để xem kết quả`}
                        className="listening-countdown practice-meaning-countdown"
                        role="timer"
                      >
                        <svg aria-hidden="true" className="listening-countdown-ring" viewBox="0 0 100 100">
                          <circle className="listening-countdown-ring-track" cx="50" cy="50" pathLength="100" r="46" />
                          <circle
                            className="listening-countdown-ring-value"
                            cx="50"
                            cy="50"
                            pathLength="100"
                            r="46"
                            strokeDasharray="100"
                            strokeDashoffset={(answerCountdownProgress * 100) - 100}
                          />
                        </svg>
                        <strong aria-hidden="true">{answerCountdownSeconds}</strong>
                      </span>
                    )}
                  </div>
                  <strong className="practice-meaning-replay-label">
                    {listeningPhase === "playing" ? "Đang phát audio" : "Bấm để nghe lại"}
                  </strong>
                  <button
                    aria-pressed={slowPlayback}
                    className="practice-meaning-speed"
                    disabled={listeningPhase === "playing" || selectedAnswer !== null}
                    onClick={() => {
                      const nextSlowPlayback = !slowPlayback;
                      setSlowPlayback(nextSlowPlayback);
                      playExerciseAudio(exercise, nextSlowPlayback, true);
                    }}
                    type="button"
                  >
                    <SlidersHorizontal aria-hidden="true" size={17} />
                    {slowPlayback ? "Tốc độ chậm" : "Tốc độ thường"}
                  </button>
                  {audioUnavailable ? <small className="is-warning">Thiết bị chưa phát được giọng đọc.</small> : null}
                </div>

                <div className="practice-meaning-answer-area">
                  <div className="scenario-options listening-meaning-options">
                    {meaningQuestion.options.map((option, optionIndex) => {
                      const selected = selectedAnswer === optionIndex;
                      return (
                        <button
                          aria-label={`Đáp án ${String.fromCharCode(65 + optionIndex)}: ${option}`}
                          aria-pressed={selected}
                          className={selected ? "selected" : ""}
                          disabled={listeningPhase !== "ready" || selectedAnswer !== null}
                          key={`${exercise.id}-${optionIndex}`}
                          onClick={() => chooseListeningAnswer(optionIndex)}
                          type="button"
                        >
                          <span>{String.fromCharCode(65 + optionIndex)}</span>
                          <strong>{option}</strong>
                        </button>
                      );
                    })}
                  </div>
                  <small className="practice-meaning-helper">
                    {listeningPhase === "playing"
                      ? "Đáp án sẽ mở ngay khi audio kết thúc"
                      : selectedAnswer === null
                        ? "Chọn một đáp án trước khi vòng thời gian kết thúc"
                        : "Đã ghi nhận lựa chọn và tốc độ phản xạ của bạn"}
                  </small>
                </div>
              </>
            )}
          </section>
        ) : null}

        {mode === "complete" && selectedScenario ? (
          <section className="practice-case-card scenario-complete-card" aria-live="polite">
            <span className="scenario-complete-icon"><Trophy size={31} /></span>
            <span className="practice-hub-kicker">Đã nghe xong ca</span>
            <h2>{selectedScenario.title}</h2>
            <p>Bạn chọn đúng ý nghĩa <strong>{score}/{exercises.length}</strong> câu. Himi đã ghi lại cả độ chính xác và tốc độ phản xạ của phiên này.</p>
            <div className="practice-result-metrics">
              <div><CheckCircle2 size={20} /><span><strong>{sessionAccuracyPercent ?? 0}%</strong><small>Độ chính xác</small></span></div>
              <div><Gauge size={20} /><span><strong>{formatPracticeReactionTime(sessionAverageReactionMs)}</strong><small>Phản xạ trung bình</small></span></div>
            </div>
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
                  <span><Headphones size={16} /> Nghe · Chọn nghĩa · 8 giây</span>
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
              <span><CheckCircle2 size={20} /><strong>{accuracyPercent === null ? "—" : `${accuracyPercent}%`}</strong> chính xác</span>
              <span><Gauge size={20} /><strong>{formatPracticeReactionTime(averageReactionMs)}</strong> phản xạ TB</span>
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
