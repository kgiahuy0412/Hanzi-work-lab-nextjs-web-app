"use client";

import { FormEvent, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Captions,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Eye,
  EyeOff,
  Headphones,
  Languages,
  Maximize2,
  PenLine,
  Play,
  RotateCcw,
  ScrollText,
  Sparkles,
  Volume2,
} from "lucide-react";
import type { LearningVideo, VideoTranscriptLine } from "@/lib/video-library";

type LearningMediaController = {
  destroy: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  pauseVideo: () => void;
  playVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
};

type YouTubePlayer = LearningMediaController;
type YouTubePlayerEvent = { target: YouTubePlayer };

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string,
        options: {
          videoId: string;
          playerVars: Record<string, number | string>;
          events: { onReady: (event: YouTubePlayerEvent) => void };
        },
      ) => YouTubePlayer;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<void> | null = null;

function loadYouTubeApi() {
  if (typeof window === "undefined") return Promise.reject(new Error("YouTube API chỉ chạy trong trình duyệt."));
  if (window.YT?.Player) return Promise.resolve();
  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = new Promise<void>((resolve, reject) => {
    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      resolve();
    };

    const existing = document.querySelector<HTMLScriptElement>('script[src="https://www.youtube.com/iframe_api"]');
    if (existing) {
      existing.addEventListener("error", () => reject(new Error("Không tải được YouTube Player API.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.addEventListener("error", () => reject(new Error("Không tải được YouTube Player API.")), { once: true });
    document.head.appendChild(script);
  });

  return youtubeApiPromise;
}

function progressKey(slug: string) {
  return `himi-video-progress:${slug}`;
}

function findActiveLine(transcript: VideoTranscriptLine[], milliseconds: number) {
  if (!transcript.length) return 0;
  let active = 0;
  for (let index = 0; index < transcript.length; index += 1) {
    if (transcript[index].startMs <= milliseconds) active = index;
    else break;
  }
  return active;
}

function normalizeAnswer(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\u3400-\u9fff]/g, "");
}

function dictationHint(line: VideoTranscriptLine, difficulty: "easy" | "normal" | "hard") {
  const syllables = line.pinyin.replace(/[,.!?;:“”"']/g, "").split(/\s+/).filter(Boolean);
  if (difficulty === "easy") return syllables.map((syllable) => `${syllable.slice(0, 1)}${"•".repeat(Math.max(1, syllable.length - 1))}`);
  if (difficulty === "normal") return syllables.map((syllable) => "•".repeat(Math.max(2, Math.min(5, syllable.length))));
  return Array.from(line.hanzi.replace(/[^\u3400-\u9fff]/g, "")).map(() => "•");
}

function Toggle({ checked, label, onChange }: { checked: boolean; label: string; onChange: () => void }) {
  return <button aria-pressed={checked} className="youtube-study-switch" onClick={onChange} type="button">
    <span aria-hidden="true"><i /></span>{label}
  </button>;
}

export function YouTubeLearningStudio({ video }: { video: LearningVideo }) {
  const transcript = useMemo(() => video.transcript ?? [], [video.transcript]);
  const mountId = `youtube-study-${useId().replace(/:/g, "")}`;
  const playerRef = useRef<LearningMediaController | null>(null);
  const htmlVideoRef = useRef<HTMLVideoElement>(null);
  const pollingRef = useRef<number | null>(null);
  const transcriptPanelRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef(new Map<number, HTMLButtonElement>());
  const repeatIndexRef = useRef<number | null>(null);
  const autoPauseRef = useRef(false);
  const pausedLineRef = useRef<number | null>(null);
  const pendingScrollRef = useRef<number | null>(null);

  const [playerReady, setPlayerReady] = useState(false);
  const [playerError, setPlayerError] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showPinyin, setShowPinyin] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);
  const [showTranscript, setShowTranscript] = useState(true);
  const [coverVideo, setCoverVideo] = useState(false);
  const [repeatIndex, setRepeatIndex] = useState<number | null>(null);
  const [autoPause, setAutoPause] = useState(false);
  const [largeVideo, setLargeVideo] = useState(false);
  const [typingMode, setTypingMode] = useState(false);
  const [typingIndex, setTypingIndex] = useState(0);
  const [difficulty, setDifficulty] = useState<"easy" | "normal" | "hard">("easy");
  const [answer, setAnswer] = useState("");
  const [answerState, setAnswerState] = useState<"idle" | "correct" | "incorrect">("idle");
  const [showAnswer, setShowAnswer] = useState(false);
  const [showMeaning, setShowMeaning] = useState(false);
  const [completed, setCompleted] = useState<number[]>([]);

  const activeLine = transcript[activeIndex] ?? transcript[0];
  const typingLine = transcript[typingIndex] ?? transcript[0];
  const completion = transcript.length ? Math.round((completed.length / transcript.length) * 100) : 0;

  useEffect(() => {
    repeatIndexRef.current = repeatIndex;
  }, [repeatIndex]);

  useEffect(() => {
    autoPauseRef.current = autoPause;
    pausedLineRef.current = null;
  }, [autoPause]);

  useLayoutEffect(() => {
    const target = pendingScrollRef.current;
    if (target === null) return;

    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;
    const restore = () => window.scrollTo({ left: window.scrollX, top: target, behavior: "auto" });
    let secondFrame = 0;

    root.style.scrollBehavior = "auto";
    restore();
    const firstFrame = window.requestAnimationFrame(() => {
      restore();
      secondFrame = window.requestAnimationFrame(() => {
        restore();
        pendingScrollRef.current = null;
        root.style.scrollBehavior = previousBehavior;
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      if (secondFrame) window.cancelAnimationFrame(secondFrame);
      root.style.scrollBehavior = previousBehavior;
    };
  }, [typingMode]);

  useEffect(() => {
    const saved = Number(window.localStorage.getItem(progressKey(video.slug)) ?? "0");
    if (!Number.isFinite(saved)) return;
    const handle = window.setTimeout(() => setProgress(Math.min(100, Math.max(0, saved))), 0);
    return () => window.clearTimeout(handle);
  }, [video.slug]);

  useEffect(() => {
    let cancelled = false;
    let localPlayer: LearningMediaController | null = null;
    let detachHtmlVideo = () => {};

    const beginSync = (player: LearningMediaController) => {
      if (cancelled) return;
      playerRef.current = player;
      setPlayerReady(true);
      setPlayerError(false);
      if (pollingRef.current !== null) window.clearInterval(pollingRef.current);
      pollingRef.current = window.setInterval(() => {
        const currentPlayer = playerRef.current;
        if (!currentPlayer) return;
        const currentMs = currentPlayer.getCurrentTime() * 1000;
        const duration = currentPlayer.getDuration();
        const nextIndex = findActiveLine(transcript, currentMs);
        setActiveIndex((current) => current === nextIndex ? current : nextIndex);

        const repeating = repeatIndexRef.current;
        if (repeating !== null) {
          const line = transcript[repeating];
          if (line && currentMs >= line.endMs - 80) {
            currentPlayer.seekTo(line.startMs / 1000, true);
            currentPlayer.playVideo();
          }
        } else if (autoPauseRef.current) {
          const line = transcript[nextIndex];
          if (line && pausedLineRef.current !== nextIndex && currentMs >= line.endMs - 90) {
            pausedLineRef.current = nextIndex;
            currentPlayer.pauseVideo();
          }
        }

        if (duration > 0) {
          const nextProgress = Math.min(100, Math.round((currentPlayer.getCurrentTime() / duration) * 100));
          setProgress((current) => current === nextProgress ? current : nextProgress);
          window.localStorage.setItem(progressKey(video.slug), String(nextProgress));
        }
      }, 220);
    };

    if (video.source === "himi") {
      const media = htmlVideoRef.current;
      if (!media || !video.videoUrl) {
        setPlayerError(true);
        return;
      }

      let readyStarted = false;
      localPlayer = {
        destroy: () => media.pause(),
        getCurrentTime: () => media.currentTime || 0,
        getDuration: () => Number.isFinite(media.duration) ? media.duration : 0,
        pauseVideo: () => media.pause(),
        playVideo: () => { void media.play().catch(() => undefined); },
        seekTo: (seconds) => { media.currentTime = seconds; },
      };

      const handleReady = () => {
        if (readyStarted || !localPlayer) return;
        readyStarted = true;
        beginSync(localPlayer);
      };
      const handleError = () => setPlayerError(true);
      media.addEventListener("loadedmetadata", handleReady);
      media.addEventListener("canplay", handleReady);
      media.addEventListener("error", handleError);
      if (media.readyState >= 1) handleReady();
      detachHtmlVideo = () => {
        media.removeEventListener("loadedmetadata", handleReady);
        media.removeEventListener("canplay", handleReady);
        media.removeEventListener("error", handleError);
      };
    } else {
      void loadYouTubeApi()
        .then(() => {
          if (cancelled || !window.YT?.Player || !video.youtubeId) return;
          localPlayer = new window.YT.Player(mountId, {
            videoId: video.youtubeId,
            playerVars: { autoplay: 0, controls: 1, playsinline: 1, rel: 0, modestbranding: 1 },
            events: { onReady: (event) => beginSync(event.target) },
          });
        })
        .catch(() => setPlayerError(true));
    }

    return () => {
      cancelled = true;
      detachHtmlVideo();
      if (pollingRef.current !== null) window.clearInterval(pollingRef.current);
      pollingRef.current = null;
      playerRef.current = null;
      localPlayer?.destroy();
    };
  }, [mountId, transcript, video.slug, video.source, video.videoUrl, video.youtubeId]);

  useEffect(() => {
    const node = lineRefs.current.get(activeIndex);
    const panel = transcriptPanelRef.current;
    if (!node || !panel || !showTranscript) return;
    panel.scrollTo({
      behavior: "smooth",
      top: Math.max(0, node.offsetTop - panel.clientHeight / 2 + node.clientHeight / 2),
    });
  }, [activeIndex, showTranscript]);

  const playLine = (index: number) => {
    const line = transcript[index];
    if (!line || !playerRef.current) return;
    pausedLineRef.current = null;
    setActiveIndex(index);
    playerRef.current.seekTo(line.startMs / 1000, true);
    playerRef.current.playVideo();
  };

  const toggleRepeat = () => {
    const next = repeatIndex === activeIndex ? null : activeIndex;
    setRepeatIndex(next);
    if (next !== null) playLine(next);
  };

  const toggleTypingMode = () => {
    pendingScrollRef.current = 0;
    setTypingMode((value) => !value);
    setTypingIndex(activeIndex);
  };

  const changeTypingLine = (next: number) => {
    const bounded = Math.max(0, Math.min(transcript.length - 1, next));
    setTypingIndex(bounded);
    setAnswer("");
    setAnswerState("idle");
    setShowAnswer(false);
    setShowMeaning(false);
    playLine(bounded);
  };

  const submitAnswer = (event: FormEvent) => {
    event.preventDefault();
    if (!typingLine || !answer.trim()) return;
    const candidate = normalizeAnswer(answer);
    const correct = candidate === normalizeAnswer(typingLine.hanzi) || candidate === normalizeAnswer(typingLine.pinyin);
    setAnswerState(correct ? "correct" : "incorrect");
    if (correct) setCompleted((current) => current.includes(typingIndex) ? current : [...current, typingIndex]);
  };

  return <section className={`youtube-study-studio${video.source === "himi" ? " is-himi-source" : ""}${typingMode ? " has-dictation" : ""}${showTranscript ? "" : " transcript-is-hidden"}${largeVideo ? " is-large-video" : ""}`}>
    <div className="youtube-study-media-column">
      <div className="youtube-study-frame">
        {video.source === "himi"
          ? <video aria-label={`Video ${video.title}`} controls controlsList="nodownload" playsInline poster={video.posterUrl} preload="metadata" ref={htmlVideoRef} src={video.videoUrl}>Trình duyệt của bạn chưa hỗ trợ video HTML5.</video>
          : <div id={mountId} />}
        {!playerReady && !playerError ? <div className="youtube-player-loading"><span /><p>Đang chuẩn bị phòng luyện nghe…</p></div> : null}
        {playerError ? <div className="youtube-player-error"><CircleHelp aria-hidden="true" /><strong>Chưa tải được trình phát</strong>{video.youtubeId ? <a href={`https://www.youtube.com/watch?v=${video.youtubeId}`} rel="noreferrer" target="_blank">Mở video trên YouTube</a> : <span>Hãy tải lại trang để thử lại video Himi.</span>}</div> : null}
        {coverVideo ? <button className="youtube-video-cover" onClick={() => setCoverVideo(false)} type="button"><Headphones aria-hidden="true" size={31} /><strong>Tập trung vào âm thanh</strong><span>Video đang được che. Chạm để hiện lại.</span></button> : null}
      </div>

      <div className="youtube-study-toolstrip" aria-label="Công cụ luyện nghe">
        <button aria-label={showTranslation ? "Ẩn bản dịch" : "Hiện bản dịch"} aria-pressed={showTranslation} onClick={() => setShowTranslation((value) => !value)} type="button"><Languages aria-hidden="true" /><span>Dịch</span></button>
        <button aria-label={showTranscript ? "Ẩn bản chép" : "Hiện bản chép"} aria-pressed={showTranscript} onClick={() => setShowTranscript((value) => !value)} type="button"><ScrollText aria-hidden="true" /><span>Bản chép</span></button>
        <button aria-label="Phát lại câu hiện tại" onClick={() => playLine(activeIndex)} type="button"><RotateCcw aria-hidden="true" /><span>Phát lại</span></button>
        <button aria-label={coverVideo ? "Hiện video" : "Che video"} aria-pressed={coverVideo} onClick={() => setCoverVideo((value) => !value)} type="button">{coverVideo ? <Eye aria-hidden="true" /> : <EyeOff aria-hidden="true" />}<span>Che video</span></button>
        <button aria-label="Luyện gõ nghe" aria-pressed={typingMode} className="is-accent" onClick={toggleTypingMode} type="button"><PenLine aria-hidden="true" /><span>Luyện gõ</span></button>
      </div>

      <div className="youtube-study-switches">
        <Toggle checked={autoPause} label="Tự động dừng" onChange={() => setAutoPause((value) => !value)} />
        <Toggle checked={repeatIndex !== null} label="Lặp câu" onChange={toggleRepeat} />
        <Toggle checked={largeVideo} label="Video lớn" onChange={() => setLargeVideo((value) => !value)} />
      </div>

      {activeLine ? <section className="youtube-shadow-card" aria-live="polite">
        <div><span>Luyện nói theo câu</span><strong>Câu {activeIndex + 1} / {transcript.length}</strong></div>
        {showPinyin ? <p className="youtube-shadow-pinyin">{activeLine.pinyin}</p> : null}
        <p className="youtube-shadow-hanzi" lang="zh">{activeLine.hanzi}</p>
        {showTranslation ? <p className="youtube-shadow-translation">{activeLine.translation}</p> : null}
        <button onClick={() => playLine(activeIndex)} type="button"><Volume2 aria-hidden="true" size={16} /> Nghe lại câu</button>
      </section> : null}

      <div className="youtube-source-row">
        <span>Nguồn: {video.authorUrl ? <a href={video.authorUrl} rel="noreferrer" target="_blank">{video.authorName}</a> : <strong>{video.authorName ?? "Himi Chinese"}</strong>}</span>
        <span>{progress}% đã xem</span>
      </div>
    </div>

    {typingMode && typingLine ? <section className="youtube-dictation-panel" aria-label="Luyện gõ nghe">
      <div className="dictation-level-tabs" role="tablist" aria-label="Độ khó">
        {(["easy", "normal", "hard"] as const).map((level) => <button aria-selected={difficulty === level} key={level} onClick={() => setDifficulty(level)} role="tab" type="button">{{ easy: "Dễ", normal: "Thường", hard: "Khó" }[level]}</button>)}
      </div>
      <div className="dictation-navigation">
        <button aria-label="Câu trước" disabled={typingIndex === 0} onClick={() => changeTypingLine(typingIndex - 1)} type="button"><ChevronLeft aria-hidden="true" /></button>
        <strong>Câu {typingIndex + 1} <span>/ {transcript.length}</span></strong>
        <button aria-label="Nghe lại câu" onClick={() => playLine(typingIndex)} type="button"><RotateCcw aria-hidden="true" /></button>
        <button aria-label="Câu tiếp theo" disabled={typingIndex === transcript.length - 1} onClick={() => changeTypingLine(typingIndex + 1)} type="button"><ChevronRight aria-hidden="true" /></button>
      </div>

      <div className="dictation-prompt">
        <span>Gõ những gì bạn nghe được</span>
        <button onClick={() => playLine(typingIndex)} type="button"><Play aria-hidden="true" size={15} /> Nghe câu</button>
      </div>

      <div className="dictation-hint-grid" aria-label="Gợi ý số âm tiết">
        {dictationHint(typingLine, difficulty).map((item, index) => <span key={`${item}-${index}`}>{item}</span>)}
      </div>

      <form onSubmit={submitAnswer}>
        <label htmlFor={`${mountId}-answer`}>Pinyin không dấu, có dấu hoặc chữ Hán</label>
        <div className={`dictation-input${answerState !== "idle" ? ` is-${answerState}` : ""}`}>
          <input autoComplete="off" id={`${mountId}-answer`} onChange={(event) => { setAnswer(event.target.value); setAnswerState("idle"); }} placeholder="Ví dụ: da jia hao" value={answer} />
          <button aria-label="Kiểm tra câu trả lời" type="submit"><Check aria-hidden="true" /></button>
        </div>
        {answerState === "correct" ? <p className="dictation-feedback is-correct"><Sparkles aria-hidden="true" /> Chính xác! Bạn bắt âm rất tốt.</p> : null}
        {answerState === "incorrect" ? <p className="dictation-feedback is-incorrect">Chưa khớp hoàn toàn. Nghe lại chậm hơn nhé.</p> : null}
      </form>

      <div className="dictation-actions">
        <button aria-pressed={showAnswer} onClick={() => setShowAnswer((value) => !value)} type="button"><Eye aria-hidden="true" /> {showAnswer ? "Ẩn đáp án" : "Hiện đáp án"}</button>
        <button aria-pressed={showMeaning} onClick={() => setShowMeaning((value) => !value)} type="button"><CircleHelp aria-hidden="true" /> Gợi ý nghĩa</button>
      </div>
      {showAnswer ? <div className="dictation-reveal"><strong lang="zh">{typingLine.hanzi}</strong><span>{typingLine.pinyin}</span></div> : null}
      {showMeaning ? <p className="dictation-meaning">{typingLine.translation}</p> : null}
      <div className="dictation-progress"><span>Tiến độ luyện gõ</span><strong>{completed.length}/{transcript.length} · {completion}%</strong></div>
    </section> : null}

    {showTranscript ? <aside className={`youtube-transcript-panel${typingMode ? " is-masked" : ""}`} aria-label="Bản chép đồng bộ">
      <header>
        <div><span>Bản chép</span><strong>{activeIndex + 1} / {transcript.length}</strong></div>
        <div className="youtube-transcript-toggles">
          <button aria-pressed={showPinyin} onClick={() => setShowPinyin((value) => !value)} type="button"><Eye aria-hidden="true" /> Pinyin</button>
          <button aria-pressed={showTranslation} onClick={() => setShowTranslation((value) => !value)} type="button"><Eye aria-hidden="true" /> Dịch</button>
        </div>
      </header>
      <div className="youtube-transcript-progress" aria-label={`Đã xem ${progress}%`}><span style={{ width: `${progress}%` }} /></div>
      <div className="youtube-transcript-scroll" ref={transcriptPanelRef}>
        {transcript.map((line, index) => <button
          aria-current={index === activeIndex ? "true" : undefined}
          className="youtube-transcript-line"
          key={line.id}
          onClick={() => { setTypingIndex(index); playLine(index); }}
          ref={(node) => { if (node) lineRefs.current.set(index, node); else lineRefs.current.delete(index); }}
          type="button"
        >
          <span>#{index + 1}</span>
          {showPinyin ? <small>{line.pinyin}</small> : null}
          <strong lang="zh">{line.hanzi}</strong>
          {showTranslation ? <p>{line.translation}</p> : null}
        </button>)}
      </div>
      {typingMode ? <div className="youtube-transcript-mask-note"><PenLine aria-hidden="true" /><strong>Đang luyện gõ</strong><span>Bản chép được làm mờ để bạn nghe chủ động hơn.</span></div> : null}
    </aside> : null}

    <button className="youtube-mobile-transcript-button" onClick={() => setShowTranscript((value) => !value)} type="button"><Captions aria-hidden="true" /> {showTranscript ? "Ẩn bản chép" : "Mở bản chép"}</button>
    {largeVideo ? <span className="youtube-large-video-status"><Maximize2 aria-hidden="true" /> Chế độ video lớn</span> : null}
  </section>;
}
