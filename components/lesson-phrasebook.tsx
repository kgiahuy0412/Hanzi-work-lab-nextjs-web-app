"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bookmark, Check, ChevronLeft, ChevronRight, Volume2 } from "lucide-react";
import type { DialogueLine, UsageNote, Vocabulary } from "@/lib/content-types";
import { speakMandarin } from "@/lib/client-mandarin-audio";

type MoveDirection = "back" | "forward";

type Phrase = {
  id: string;
  hanzi: string;
  pinyin?: string;
  translation: string;
  purpose: string;
};

function buildPhrases(words: Vocabulary[], dialogue: DialogueLine[], notes: UsageNote[]) {
  const phrases: Phrase[] = [
    ...notes.map((note, index) => ({
      id: `note-${index}-${note.pattern}`,
      hanzi: note.pattern,
      translation: note.explanation,
      purpose: note.title,
    })),
    ...dialogue.map((line, index) => ({
      id: `dialogue-${index}-${line.hanzi}`,
      hanzi: line.hanzi,
      pinyin: line.pinyin,
      translation: line.translation,
      purpose: "Câu dùng trong tình huống",
    })),
    ...words.filter((word) => word.example.trim()).slice(0, 3).map((word) => ({
      id: `word-${word.slug}`,
      hanzi: word.example,
      translation: word.translation,
      purpose: `Mẫu câu với “${word.hanzi}”`,
    })),
  ];

  return phrases.filter((phrase, index) => phrases.findIndex((item) => item.hanzi === phrase.hanzi) === index);
}

export function LessonPhrasebook({
  words,
  dialogue,
  notes,
  onFinished,
}: {
  words: Vocabulary[];
  dialogue: DialogueLine[];
  notes: UsageNote[];
  onFinished: () => void;
}) {
  const phrases = useMemo(() => buildPhrases(words, dialogue, notes), [dialogue, notes, words]);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<MoveDirection>("forward");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioMessage, setAudioMessage] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set());

  const currentPhrase = phrases[index];
  const atStart = index === 0;
  const atEnd = index === phrases.length - 1;
  const saved = currentPhrase ? savedIds.has(currentPhrase.id) : false;

  const stopAudio = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [setIsSpeaking]);

  const moveTo = useCallback((nextIndex: number, nextDirection: MoveDirection) => {
    if (nextIndex < 0 || nextIndex >= phrases.length) return;
    stopAudio();
    setDirection(nextDirection);
    setIndex(nextIndex);
    setAudioMessage("");
    setSaveMessage("");
  }, [phrases.length, setAudioMessage, setDirection, setIndex, setSaveMessage, stopAudio]);

  const moveForward = useCallback(() => {
    if (atEnd) {
      onFinished();
      return;
    }
    moveTo(index + 1, "forward");
  }, [atEnd, index, moveTo, onFinished]);

  const moveBack = useCallback(() => moveTo(index - 1, "back"), [index, moveTo]);

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
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  const playPronunciation = () => {
    if (!currentPhrase || isSpeaking) return;
    stopAudio();
    setIsSpeaking(true);
    setAudioMessage("Đang phát âm…");
    const started = speakMandarin(currentPhrase.hanzi, () => {
      setIsSpeaking(false);
      setAudioMessage("Đã phát âm xong.");
    });
    if (!started) {
      setIsSpeaking(false);
      setAudioMessage("Trình duyệt chưa hỗ trợ phát âm.");
    }
  };

  const saveForReview = () => {
    if (!currentPhrase || saved) return;
    const next = new Set(savedIds);
    next.add(currentPhrase.id);
    setSavedIds(next);
    setSaveMessage("Đã lưu cụm trong phiên học này.");
  };

  if (!currentPhrase) {
    return <div className="lesson-vocab-empty"><h2>Bài này chưa có cụm từ</h2><p>Hãy chuyển sang Nghe & nói hoặc Hội thoại để tiếp tục học.</p></div>;
  }

  return <section aria-label="Bộ thẻ cụm từ" className="lesson-vocab-deck lesson-phrase-deck" data-testid="lesson-phrase-deck">
    <div aria-label={`Tiến độ cụm ${index + 1} trên ${phrases.length}`} aria-valuemax={phrases.length} aria-valuemin={1} aria-valuenow={index + 1} className="lesson-vocab-progress" role="progressbar">
      <strong>{String(index + 1).padStart(2, "0")} / {String(phrases.length).padStart(2, "0")}</strong>
      <div aria-hidden="true" className="lesson-vocab-progress-segments">{phrases.map((phrase, phraseIndex) => <span className={phraseIndex <= index ? "filled" : ""} key={phrase.id} />)}</div>
    </div>

    <div className="lesson-vocab-carousel">
      <button aria-label="Cụm trước" className="lesson-vocab-nav lesson-vocab-nav-prev" disabled={atStart} onClick={moveBack} type="button">
        <span><ChevronLeft size={24} /></span><small>Trước</small>
      </button>

      <div className="lesson-vocab-stack">
        <span aria-hidden="true" className="lesson-vocab-card-back lesson-vocab-card-back-two" />
        <span aria-hidden="true" className="lesson-vocab-card-back lesson-vocab-card-back-one" />
        <article aria-label={`Cụm ${index + 1} trên ${phrases.length}: ${currentPhrase.hanzi}`} className={`lesson-vocab-card lesson-phrase-study-card move-${direction}`} data-phrase-index={index + 1} key={currentPhrase.id} tabIndex={0}>
          <span className="lesson-vocab-order">Cụm {String(index + 1).padStart(2, "0")} / {String(phrases.length).padStart(2, "0")}</span>
          <strong className="lesson-vocab-hanzi lesson-phrase-hanzi" lang="zh-CN">{currentPhrase.hanzi}</strong>
          {currentPhrase.pinyin ? <span className="lesson-vocab-pinyin lesson-phrase-pinyin">{currentPhrase.pinyin}</span> : null}
          <span className="lesson-vocab-meaning lesson-phrase-purpose">{currentPhrase.purpose}</span>

          <button aria-label={`Phát âm cụm ${currentPhrase.hanzi}`} aria-pressed={isSpeaking} className={`lesson-vocab-audio${isSpeaking ? " playing" : ""}`} onClick={playPronunciation} type="button">
            <Volume2 size={27} /><span>Nghe cụm từ</span>
          </button>

          <div className="lesson-vocab-example lesson-phrase-translation">
            <strong>Ý nghĩa</strong>
            <p>{currentPhrase.translation}</p>
          </div>

          <button aria-pressed={saved} className={`lesson-vocab-save${saved ? " saved" : ""}`} disabled={saved} onClick={saveForReview} type="button">
            {saved ? <Check size={17} /> : <Bookmark size={17} />}
            {saved ? "Đã lưu để ôn" : "Lưu cụm"}
          </button>
        </article>
      </div>

      <button aria-label={atEnd ? "Chuyển sang Nghe và nói" : "Cụm tiếp theo"} className="lesson-vocab-nav lesson-vocab-nav-next" onClick={moveForward} type="button">
        <span><ChevronRight size={24} /></span><small>{atEnd ? "Nghe & nói" : "Tiếp theo"}</small>
      </button>
    </div>

    <button className="lesson-vocab-continue" onClick={moveForward} type="button">
      {atEnd ? "Tiếp tục với Nghe & nói" : "Đã hiểu · Tiếp tục"}<ChevronRight size={19} />
    </button>
    <p className="lesson-vocab-keyboard">Nhấn <kbd>Enter</kbd> hoặc dùng <kbd>←</kbd> <kbd>→</kbd> để chuyển cụm</p>
    <p aria-live="polite" className="sr-only">{audioMessage} {saveMessage}</p>
  </section>;
}
