"use client";

import { useEffect, useRef, useState } from "react";
import { Captions, ExternalLink, Gauge, Languages, Repeat2, RotateCcw, Volume2 } from "lucide-react";
import type { LearningVideo, VideoTranscriptLine } from "@/lib/video-library";
import { YouTubeLearningStudio } from "@/components/youtube-learning-studio";

function progressKey(slug: string) {
  return `himi-video-progress:${slug}`;
}

function seekTo(video: HTMLVideoElement | null, milliseconds: number) {
  if (!video) return;
  video.currentTime = milliseconds / 1000;
  void video.play();
}

export function VideoLearningPlayer({ video, compact = false }: { video: LearningVideo; compact?: boolean }) {
  const playerRef = useRef<HTMLVideoElement>(null);
  const lastSavedSecond = useRef(-1);
  const [activeLineId, setActiveLineId] = useState<string | null>(null);
  const [repeatLine, setRepeatLine] = useState<VideoTranscriptLine | null>(null);
  const [showPinyin, setShowPinyin] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);
  const [progress, setProgress] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    if (video.source !== "himi") return;
    const saved = Number(window.localStorage.getItem(progressKey(video.slug)) ?? "0");
    if (!Number.isFinite(saved)) return;
    const handle = window.setTimeout(() => setProgress(Math.min(100, Math.max(0, saved))), 0);
    return () => window.clearTimeout(handle);
  }, [video.slug, video.source]);

  if (!compact && video.transcript?.length) return <YouTubeLearningStudio video={video} />;

  if (video.source === "youtube" && video.youtubeId) {
    const watchUrl = `https://www.youtube.com/watch?v=${video.youtubeId}`;
    return <div className="video-learning-player youtube-learning-player">
      <div className="video-media-frame">
        <iframe
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?rel=0&playsinline=1`}
          title={`${video.title} — video từ ${video.authorName ?? "YouTube"}`}
        />
      </div>
      <div className="youtube-source-note">
        <div><strong>Nguồn video</strong>{video.authorUrl ? <a href={video.authorUrl} rel="noreferrer" target="_blank">{video.authorName}</a> : <span>{video.authorName}</span>}</div>
        <a href={watchUrl} rel="noreferrer" target="_blank">Xem trên YouTube <ExternalLink aria-hidden="true" size={15} /></a>
      </div>
    </div>;
  }

  const transcript = video.transcript ?? [];
  const handleTimeUpdate = () => {
    const player = playerRef.current;
    if (!player || !player.duration) return;
    const milliseconds = player.currentTime * 1000;
    const currentLine = transcript.find((line) => milliseconds >= line.sceneStartMs && milliseconds < line.sceneEndMs);
    setActiveLineId(currentLine?.id ?? null);

    if (repeatLine && milliseconds >= repeatLine.sceneEndMs) {
      player.currentTime = repeatLine.sceneStartMs / 1000;
      void player.play();
      return;
    }

    const currentSecond = Math.floor(player.currentTime);
    if (currentSecond === lastSavedSecond.current) return;
    lastSavedSecond.current = currentSecond;
    const nextProgress = Math.min(100, Math.round((player.currentTime / player.duration) * 100));
    setProgress(nextProgress);
    window.localStorage.setItem(progressKey(video.slug), String(nextProgress));
  };

  const toggleRepeat = (line: VideoTranscriptLine) => {
    const shouldStop = repeatLine?.id === line.id;
    setRepeatLine(shouldStop ? null : line);
    if (!shouldStop) seekTo(playerRef.current, line.sceneStartMs);
  };

  const changeRate = () => {
    const nextRate = playbackRate === 1 ? 0.75 : playbackRate === 0.75 ? 0.9 : 1;
    setPlaybackRate(nextRate);
    if (playerRef.current) playerRef.current.playbackRate = nextRate;
  };

  return <div className={`video-learning-player himi-learning-player${compact ? " is-compact" : ""}`}>
    <div className="video-media-frame himi-video-frame">
      <video
        controls
        controlsList="nodownload"
        onEnded={() => {
          setProgress(100);
          window.localStorage.setItem(progressKey(video.slug), "100");
        }}
        onLoadedMetadata={() => {
          if (playerRef.current) playerRef.current.playbackRate = playbackRate;
        }}
        onTimeUpdate={handleTimeUpdate}
        playsInline
        poster={video.posterUrl}
        preload="metadata"
        ref={playerRef}
        src={video.videoUrl}
      >Trình duyệt của bạn chưa hỗ trợ video HTML5.</video>
    </div>

    <div className="video-player-toolbar" aria-label="Tùy chọn học với video">
      <div className="video-progress-copy"><span>Tiến độ video</span><strong>{progress}%</strong></div>
      <div className="video-progress-track" aria-hidden="true"><span style={{ width: `${progress}%` }} /></div>
      <div className="video-player-options">
        <button aria-pressed={showPinyin} onClick={() => setShowPinyin((value) => !value)} type="button"><Languages aria-hidden="true" size={16} /> Pinyin</button>
        <button aria-pressed={showTranslation} onClick={() => setShowTranslation((value) => !value)} type="button"><Captions aria-hidden="true" size={16} /> Nghĩa Việt</button>
        <button aria-label={`Tốc độ phát ${playbackRate} lần`} onClick={changeRate} type="button"><Gauge aria-hidden="true" size={16} /> {playbackRate}×</button>
      </div>
    </div>

    <section className="interactive-transcript" aria-label="Phụ đề tương tác">
      <div className="interactive-transcript-heading">
        <div><span>Học từng câu</span><h2>Nghe · nói theo · lặp lại</h2></div>
        {repeatLine ? <button className="stop-repeat-button" onClick={() => setRepeatLine(null)} type="button"><RotateCcw aria-hidden="true" size={15} /> Dừng lặp</button> : null}
      </div>
      <div className="transcript-line-list">
        {transcript.map((line, index) => {
          const active = activeLineId === line.id;
          const repeating = repeatLine?.id === line.id;
          return <article className={`transcript-line${active ? " is-active" : ""}`} key={line.id}>
            <button className="transcript-line-main" onClick={() => seekTo(playerRef.current, line.startMs)} type="button">
              <span className="transcript-order">{String(index + 1).padStart(2, "0")}</span>
              <span className="transcript-copy"><small>{line.role}</small><strong lang="zh">{line.hanzi}</strong>{showPinyin ? <span>{line.pinyin}</span> : null}{showTranslation ? <p>{line.translation}</p> : null}</span>
              <Volume2 aria-hidden="true" className="transcript-play-icon" size={18} />
            </button>
            <button aria-pressed={repeating} className="transcript-repeat" onClick={() => toggleRepeat(line)} type="button"><Repeat2 aria-hidden="true" size={15} /> {repeating ? "Đang lặp" : "Lặp & nói theo"}</button>
          </article>;
        })}
      </div>
    </section>
  </div>;
}
