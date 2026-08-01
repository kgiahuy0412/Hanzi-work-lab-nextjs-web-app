"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
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
import { LearnerPageHeader } from "@/components/learner-page-header";
import { PracticeBoard } from "@/components/practice-board";
import type { Vocabulary } from "@/lib/content-types";
import type {
  PracticeExercise,
  PracticeIndustry,
  PracticeIndustryId,
  PracticeScenarioDto,
} from "@/lib/practice-content";
import { getPracticeListeningStatement } from "@/lib/practice-content";
import type { WeeklyChallenge } from "@/lib/weekly-challenges";

const COMPLETED_STORAGE_KEY = "hanziwork.practice.completed.v1";

const industryIcons = {
  office: BriefcaseBusiness,
  factory: Factory,
  logistics: Warehouse,
  sales: ShoppingBag,
  restaurant: UtensilsCrossed,
  ecommerce: Store,
  core: MessagesSquare,
} satisfies Record<PracticeIndustryId, typeof BriefcaseBusiness>;

type HubMode = "catalog" | "session" | "complete" | "review";
type ListeningPhase = "idle" | "playing" | "ready";

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
  hasVip,
  weeklyChallenge,
}: {
  industries: PracticeIndustry[];
  scenarios: PracticeScenarioDto[];
  vocabulary: Vocabulary[];
  authenticated: boolean;
  hasVip: boolean;
  weeklyChallenge: WeeklyChallenge;
}) {
  const [activeIndustry, setActiveIndustry] = useState<PracticeIndustryId>(industries[0]?.id ?? "office");
  const [selectedScenarioId, setSelectedScenarioId] = useState(scenarios[0]?.id ?? "");
  const [mode, setMode] = useState<HubMode>("catalog");
  const [step, setStep] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const [listeningPhase, setListeningPhase] = useState<ListeningPhase>("idle");
  const [audioUnavailable, setAudioUnavailable] = useState(false);
  const [score, setScore] = useState(0);
  const [completedScenarios, setCompletedScenarios] = useState<string[]>([]);
  const [showUpgradeNote, setShowUpgradeNote] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playbackIdRef = useRef(0);
  const sessionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setCompletedScenarios(readCompletedScenarios()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const industryScenarios = useMemo(
    () => scenarios.filter((scenario) => scenario.industry === activeIndustry),
    [activeIndustry, scenarios],
  );
  const selectedScenario = scenarios.find((scenario) => scenario.id === selectedScenarioId)
    ?? industryScenarios[0]
    ?? scenarios[0];
  const exercises = selectedScenario?.exercises ?? [];
  const exercise = exercises[step];
  const listeningStatement = exercise && selectedScenario
    ? getPracticeListeningStatement(exercise, selectedScenario)
    : null;
  const currentIndustry = industries.find((industry) => industry.id === activeIndustry);
  const answerWasCorrect = selectedAnswer !== null
    && listeningStatement !== null
    && selectedAnswer === listeningStatement.isCorrect;

  useEffect(() => () => {
    playbackIdRef.current += 1;
    audioRef.current?.pause();
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  }, []);

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
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    window.speechSynthesis?.cancel();
  }

  function playExerciseAudio(targetExercise: PracticeExercise, slow = false) {
    stopCurrentAudio();
    const playbackId = playbackIdRef.current;
    const statement = getPracticeListeningStatement(targetExercise, selectedScenario);
    setAudioUnavailable(false);
    setListeningPhase("playing");

    const finishPlayback = () => {
      if (playbackId === playbackIdRef.current) setListeningPhase("ready");
    };

    const speakWithDeviceVoice = () => {
      if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
        setAudioUnavailable(true);
        finishPlayback();
        return;
      }

      const utterance = new window.SpeechSynthesisUtterance(statement.text);
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
      audioRef.current = audio;
      audio.playbackRate = slow ? 0.78 : 1;
      audio.onended = finishPlayback;
      audio.onerror = speakWithDeviceVoice;
      void audio.play().catch(speakWithDeviceVoice);
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
    setShowUpgradeNote(false);
    playExerciseAudio(selectedScenario.exercises[0]);
    setMode("session");
  }

  function chooseListeningAnswer(answer: boolean) {
    if (selectedAnswer !== null || listeningPhase !== "ready" || !listeningStatement) return;
    setSelectedAnswer(answer);
    if (answer === listeningStatement.isCorrect) setScore((value) => value + 1);
  }

  function completeScenario() {
    if (!selectedScenario) return;
    const nextCompleted = Array.from(new Set([...completedScenarios, selectedScenario.id]));
    setCompletedScenarios(nextCompleted);
    try {
      window.localStorage.setItem(COMPLETED_STORAGE_KEY, JSON.stringify(nextCompleted));
    } catch {
      // The exercise remains usable when private browsing blocks local storage.
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
    <div className={`work-practice-layout ${mode === "session" || mode === "complete" ? "is-focused" : ""}`}>
      <section className="work-practice-main" aria-labelledby="practice-title">
        {mode !== "session" && mode !== "complete" ? (
          <>
            <LearnerPageHeader
              className="practice-page-intro"
              description="Chọn một ca làm, nghe cách phản hồi và phán đoán như trong tình huống thật."
              eyebrow="Phòng luyện công việc"
              eyebrowIcon={BriefcaseBusiness}
              meta={<><span><BriefcaseBusiness size={16} /><strong>{industries.length}</strong> nhóm ngành</span><span><Headphones size={16} />Nghe trước · Đúng/Sai</span></>}
              title="Luyện tai trước khi vào ca."
              titleId="practice-title"
            />

            <div className="practice-industry-tabs" role="tablist" aria-label="Chọn ngành để luyện">
              {industries.map((industry) => {
                const Icon = industryIcons[industry.id];
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
            className="practice-case-card practice-session-card practice-listening-card"
            ref={sessionRef}
            tabIndex={-1}
          >
            <div className="practice-session-topline">
              <button className="practice-back-button" onClick={returnToCatalog} type="button">
                <X size={17} /> Thoát ca
              </button>
              <span>Lượt nghe {step + 1} / {exercises.length}</span>
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

            <div className="listening-session-context">
              <span>Tình huống đang luyện</span>
              <p>{selectedScenario.context}</p>
            </div>

            <div className={`practice-audio-stage ${listeningPhase}`} role="status">
              <span aria-hidden="true" className="practice-audio-orb">
                <Headphones size={34} strokeWidth={1.8} />
              </span>
              <span className="practice-audio-state">
                {listeningPhase === "playing" ? "Đang phát audio" : "Đã nghe xong"}
              </span>
              <h2>Nghe cách nhân viên phản hồi</h2>
              <p>{listeningPhase === "playing" ? "Tập trung vào ý chính và thái độ của câu nói." : "Bây giờ hãy phán đoán câu vừa nghe, chưa cần nhớ từng chữ."}</p>
              <div className="practice-audio-controls">
                <button disabled={listeningPhase === "playing"} onClick={() => playExerciseAudio(exercise)} type="button">
                  <Volume2 size={17} /> Nghe lại
                </button>
                <button disabled={listeningPhase === "playing"} onClick={() => playExerciseAudio(exercise, true)} type="button">
                  <Gauge size={17} /> Nghe chậm 0.8×
                </button>
              </div>
              {audioUnavailable ? <small>Thiết bị chưa phát được giọng đọc. Bản chép sẽ hiện sau khi bạn chọn.</small> : null}
            </div>

            {listeningPhase === "ready" ? (
              <div className="listening-answer-panel">
                <span>Phán đoán sau khi nghe</span>
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
              <span>Ca: {selectedScenario.title}</span>
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
            <div className="scenario-quote">
              <strong lang="zh">{selectedScenario.sentenceZh}</strong>
              <span>{selectedScenario.translation}</span>
            </div>
            <div className="scenario-complete-actions">
              <button onClick={startScenario} type="button"><RotateCcw size={17} /> Luyện lại ca này</button>
              <button className="primary" onClick={returnToCatalog} type="button">Chọn ca khác <ArrowRight size={17} /></button>
            </div>
          </section>
        ) : null}

        {mode === "catalog" && selectedScenario ? (
          <>
            <article className={`practice-case-card ${selectedScenario.locked ? "is-locked" : ""}`}>
              <div className="practice-case-meta">
                <span><Clock3 size={15} /> {selectedScenario.durationMinutes} phút</span>
                <span>{selectedScenario.level}</span>
                <span className={selectedScenario.isFree ? "free" : "vip"}>
                  {selectedScenario.isFree ? <PackageCheck size={14} /> : <Crown size={14} />}
                  {selectedScenario.isFree ? "Mẫu miễn phí" : "Dành cho VIP"}
                </span>
              </div>
              <div className="practice-case-title-row">
                <div>
                  <span>{currentIndustry?.label}</span>
                  <h2>{selectedScenario.title}</h2>
                  <p>{selectedScenario.brief}</p>
                </div>
                {selectedScenario.locked ? <span className="practice-lock-mark"><LockKeyhole size={20} /></span> : null}
              </div>

              <div className="practice-case-situation">
                <span>Tình huống</span>
                <p>{selectedScenario.context}</p>
              </div>

              <div className="practice-case-language">
                <span>Câu nói trọng tâm</span>
                <strong lang="zh">{selectedScenario.sentenceZh}</strong>
                <p>{selectedScenario.pinyin}</p>
                <small>{selectedScenario.translation}</small>
              </div>

              <div className="practice-case-focus" aria-label="Kỹ năng trong ca">
                {selectedScenario.focus.map((item) => <span key={item}><Check size={14} /> {item}</span>)}
              </div>

              {showUpgradeNote && selectedScenario.locked ? (
                <div className="practice-inline-upgrade" role="status">
                  <Crown size={18} />
                  <p><strong>Ca này thuộc kho VIP.</strong> Bạn vẫn xem được bối cảnh và câu mẫu; phần xử lý từng lượt sẽ mở sau khi nâng cấp.</p>
                  <Link href="/vip">Xem quyền lợi</Link>
                </div>
              ) : null}

              <div className="practice-case-actions">
                <button className="practice-start-button" onClick={startScenario} type="button">
                  {selectedScenario.locked ? <LockKeyhole size={17} /> : <Play size={17} fill="currentColor" />}
                  {selectedScenario.locked ? "Mở khóa ca này" : "Bắt đầu ca nghe"}
                  <ArrowRight size={18} />
                </button>
                <span>{selectedScenario.exercises?.length ?? 3} lượt nghe · Đúng/Sai · Có giải thích</span>
              </div>
            </article>

            <section className="related-practice-cases" aria-labelledby="related-cases-title">
              <div className="related-cases-heading">
                <div>
                  <span>Tiếp tục trong ngành</span>
                  <h2 id="related-cases-title">Ca làm liên quan</h2>
                </div>
                <span>{industryScenarios.length} tình huống</span>
              </div>
              <div className="related-cases-list">
                {industryScenarios.filter((scenario) => scenario.id !== selectedScenario.id).map((scenario) => (
                  <button key={scenario.id} onClick={() => chooseScenario(scenario)} type="button">
                    <span className={`related-case-icon ${scenario.locked ? "locked" : ""}`}>
                      {scenario.locked ? <LockKeyhole size={17} /> : <CheckCircle2 size={17} />}
                    </span>
                    <span className="related-case-copy">
                      <strong>{scenario.title}</strong>
                      <small>{scenario.durationMinutes} phút · {scenario.level}</small>
                    </span>
                    <span className={scenario.isFree ? "related-access free" : "related-access"}>
                      {scenario.isFree ? "Miễn phí" : "VIP"}
                    </span>
                    <ChevronRight size={18} />
                  </button>
                ))}
              </div>
            </section>
          </>
        ) : null}
      </section>

      {mode !== "session" && mode !== "complete" ? <aside className="work-practice-aside" aria-label="Tóm tắt luyện tập">
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
          <p>{authenticated ? "Lịch ôn từ được đồng bộ với tài khoản của bạn." : "Ca đã luyện được giữ trên thiết bị này. Đăng nhập để lưu lịch ôn từ."}</p>
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
          <span className="practice-vip-label">{hasVip ? "VIP đang hoạt động" : "HanziWork VIP"}</span>
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
