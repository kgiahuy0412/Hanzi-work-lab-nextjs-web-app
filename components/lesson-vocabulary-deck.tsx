"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bookmark, Check, ChevronLeft, ChevronRight, LoaderCircle, Volume2 } from "lucide-react";
import type { Vocabulary } from "@/lib/content-types";

type MoveDirection = "back" | "forward";

export function LessonVocabularyDeck({
  words,
  authenticated,
  onFinished,
}: {
  words: Vocabulary[];
  authenticated: boolean;
  onFinished: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<MoveDirection>("forward");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioMessage, setAudioMessage] = useState("");
  const [savePending, setSavePending] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [savedSlugs, setSavedSlugs] = useState<Set<string>>(() => new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentWord = words[index];
  const atStart = index === 0;
  const atEnd = index === words.length - 1;
  const saved = currentWord ? savedSlugs.has(currentWord.slug) : false;

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const moveTo = useCallback((nextIndex: number, nextDirection: MoveDirection) => {
    if (nextIndex < 0 || nextIndex >= words.length) return;
    stopAudio();
    setDirection(nextDirection);
    setIndex(nextIndex);
    setAudioMessage("");
    setSaveMessage("");
  }, [stopAudio, words.length]);

  const moveForward = useCallback(() => {
    if (atEnd) {
      onFinished();
      return;
    }
    moveTo(index + 1, "forward");
  }, [atEnd, index, moveTo, onFinished]);

  const moveBack = useCallback(() => {
    moveTo(index - 1, "back");
  }, [index, moveTo]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("button, a, input, textarea, select, [contenteditable='true']")) return;

      if (event.key === "ArrowLeft" && !atStart) {
        event.preventDefault();
        moveBack();
      }
      if (event.key === "ArrowRight" || event.key === "Enter") {
        event.preventDefault();
        moveForward();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [atStart, moveBack, moveForward]);

  useEffect(() => () => {
    if (audioRef.current) audioRef.current.pause();
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  const playPronunciation = async () => {
    if (!currentWord || isSpeaking) return;
    stopAudio();
    setAudioMessage("Đang phát âm…");
    setIsSpeaking(true);

    if (currentWord.audioUrl) {
      try {
        const audio = new Audio(currentWord.audioUrl);
        audioRef.current = audio;
        audio.addEventListener("ended", () => {
          audioRef.current = null;
          setIsSpeaking(false);
          setAudioMessage("Đã phát âm xong.");
        }, { once: true });
        audio.addEventListener("error", () => {
          audioRef.current = null;
          setIsSpeaking(false);
          setAudioMessage("Không thể phát tệp âm thanh này.");
        }, { once: true });
        await audio.play();
        return;
      } catch {
        audioRef.current = null;
      }
    }

    if (!("speechSynthesis" in window)) {
      setIsSpeaking(false);
      setAudioMessage("Trình duyệt chưa hỗ trợ phát âm.");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(currentWord.hanzi);
    utterance.lang = "zh-CN";
    utterance.rate = 0.82;
    utterance.pitch = 1;
    utterance.onend = () => {
      setIsSpeaking(false);
      setAudioMessage("Đã phát âm xong.");
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setAudioMessage("Không thể phát âm trên thiết bị này.");
    };
    window.speechSynthesis.speak(utterance);
  };

  const saveForReview = async () => {
    if (!currentWord || saved || savePending) return;
    setSavePending(true);
    setSaveMessage("");

    try {
      if (authenticated) {
        const response = await fetch("/api/progress/review", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ vocabularySlug: currentWord.slug, remembered: false }),
        });
        if (!response.ok) throw new Error("save_failed");
      }

      setSavedSlugs((current) => {
        const next = new Set(current);
        next.add(currentWord.slug);
        return next;
      });
      setSaveMessage(authenticated ? "Đã thêm vào lịch ôn." : "Đã đánh dấu trong phiên học này.");
    } catch {
      setSaveMessage("Chưa thể lưu từ. Hãy thử lại.");
    } finally {
      setSavePending(false);
    }
  };

  if (!currentWord) {
    return <div className="lesson-vocab-empty"><h2>Bài này chưa có từ vựng</h2><p>Hãy chuyển sang Hội thoại hoặc Ghi chú để tiếp tục học.</p></div>;
  }

  return <section aria-label="Bộ thẻ từ vựng" className="lesson-vocab-deck" data-testid="lesson-vocabulary-deck">
    <div aria-label={`Tiến độ từ ${index + 1} trên ${words.length}`} className="lesson-vocab-progress" role="progressbar" aria-valuemax={words.length} aria-valuemin={1} aria-valuenow={index + 1}>
      <strong>{String(index + 1).padStart(2, "0")} / {String(words.length).padStart(2, "0")}</strong>
      <div className="lesson-vocab-progress-segments" aria-hidden="true">{words.map((word, wordIndex) => <span className={wordIndex <= index ? "filled" : ""} key={word.slug} />)}</div>
    </div>

    <div className="lesson-vocab-carousel">
      <button aria-label="Từ trước" className="lesson-vocab-nav lesson-vocab-nav-prev" disabled={atStart} onClick={moveBack} type="button">
        <span><ChevronLeft size={24} /></span><small>Trước</small>
      </button>

      <div className="lesson-vocab-stack">
        <span aria-hidden="true" className="lesson-vocab-card-back lesson-vocab-card-back-two" />
        <span aria-hidden="true" className="lesson-vocab-card-back lesson-vocab-card-back-one" />
        <article aria-label={`Từ ${index + 1} trên ${words.length}: ${currentWord.hanzi}`} className={`lesson-vocab-card move-${direction}`} data-word-index={index + 1} key={currentWord.slug} tabIndex={0}>
          <span className="lesson-vocab-order">Từ {String(index + 1).padStart(2, "0")} / {String(words.length).padStart(2, "0")}</span>
          <strong className="lesson-vocab-hanzi" lang="zh">{currentWord.hanzi}</strong>
          <span className="lesson-vocab-pinyin">{currentWord.pinyin}</span>
          <span className="lesson-vocab-meaning">{currentWord.meaning}</span>

          <button aria-label={`Phát âm từ ${currentWord.hanzi}`} aria-pressed={isSpeaking} className={`lesson-vocab-audio${isSpeaking ? " playing" : ""}`} onClick={playPronunciation} type="button">
            <Volume2 size={27} /><span>Nghe phát âm</span>
          </button>

          {currentWord.example ? <div className="lesson-vocab-example">
            <strong lang="zh">{currentWord.example}</strong>
            <p>{currentWord.translation}</p>
          </div> : null}

          <button aria-pressed={saved} className={`lesson-vocab-save${saved ? " saved" : ""}`} disabled={savePending || saved} onClick={saveForReview} type="button">
            {savePending ? <LoaderCircle className="lesson-vocab-spinner" size={17} /> : saved ? <Check size={17} /> : <Bookmark size={17} />}
            {saved ? "Đã lưu để ôn" : "Lưu từ"}
          </button>
        </article>
      </div>

      <button aria-label={atEnd ? "Chuyển sang Cụm từ" : "Từ tiếp theo"} className="lesson-vocab-nav lesson-vocab-nav-next" onClick={moveForward} type="button">
        <span><ChevronRight size={24} /></span><small>{atEnd ? "Cụm từ" : "Tiếp theo"}</small>
      </button>
    </div>

    <button className="lesson-vocab-continue" onClick={moveForward} type="button">
      {atEnd ? "Tiếp tục với Cụm từ" : "Đã hiểu · Tiếp tục"}<ChevronRight size={19} />
    </button>
    <p className="lesson-vocab-keyboard">Nhấn <kbd>Enter</kbd> hoặc dùng <kbd>←</kbd> <kbd>→</kbd> để chuyển từ</p>
    <p aria-live="polite" className="sr-only">{audioMessage} {saveMessage}</p>
  </section>;
}
