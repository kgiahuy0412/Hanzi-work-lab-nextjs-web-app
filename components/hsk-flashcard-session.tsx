"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Footprints,
  Lightbulb,
  RotateCcw,
  Sparkles,
  Star,
  Target,
  Trophy,
  Volume2,
  X,
} from "lucide-react";
import { speakChinese } from "@/lib/game-content";
import type { HskLessonContent } from "@/lib/hsk-lesson-content";
import {
  getHskLessonProgressStorageKey,
  parseHskLessonProgress,
} from "@/lib/hsk-lesson-progress";

function saveRememberedWord(lessonId: string, wordId: string): void {
  try {
    const storageKey = getHskLessonProgressStorageKey(lessonId);
    const progress = parseHskLessonProgress(window.localStorage.getItem(storageKey));
    if (progress.vocabulary.includes(wordId)) return;
    window.localStorage.setItem(storageKey, JSON.stringify({
      ...progress,
      vocabulary: [...progress.vocabulary, wordId],
    }));
  } catch {
    // The flashcard session remains usable when browser storage is unavailable.
  }
}

export function HskFlashcardSession({ lesson, backHref }: {
  lesson: HskLessonContent;
  backHref: string;
}) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [rememberedIds, setRememberedIds] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  const word = lesson.vocabulary[index];
  const score = rememberedIds.length * 160;

  const rate = (remembered: boolean) => {
    if (!flipped) return;

    if (remembered) {
      saveRememberedWord(lesson.id, word.id);
      setRememberedIds((current) => current.includes(word.id) ? current : [...current, word.id]);
    }

    if (index === lesson.vocabulary.length - 1) {
      setFinished(true);
      return;
    }

    setIndex((current) => current + 1);
    setFlipped(false);
  };

  const restart = () => {
    setIndex(0);
    setFlipped(false);
    setRememberedIds([]);
    setFinished(false);
  };

  return <main className="learner-dashboard game-center-dashboard game-session-dashboard game-immersive-dashboard hsk-flashcard-session">
    <div className="game-center-shell game-session-shell">
      <section aria-label={`Flashcard ${lesson.levelLabel}: ${lesson.title}`} className="game-session-world">
        <div className="game-session-sr-copy">
          <h1>Flashcard {lesson.levelLabel}</h1>
          <p>Lật thẻ để xem nghĩa, nghe phát âm rồi tự đánh giá mức nhớ.</p>
        </div>

        <div className="game-session-hud">
          <Link aria-label="Quay lại bài học" className="game-back-button" href={backHref}>
            <ArrowLeft aria-hidden="true" size={17} />
            <span>Quay lại bài học</span>
          </Link>
          <div aria-label="Tiến độ học flashcard" className="game-session-metrics">
            <span><Target aria-hidden="true" size={22} /><span><small>TIẾN ĐỘ</small><strong>{Math.min(index + 1, lesson.vocabulary.length)} / {lesson.vocabulary.length}</strong></span></span>
            <span><Star aria-hidden="true" size={22} /><span><small>ĐIỂM</small><strong>{score}</strong></span></span>
            <span><Footprints aria-hidden="true" size={22} /><span><small>NHỚ</small><strong>{rememberedIds.length}</strong></span></span>
          </div>
        </div>

        <Image
          alt="Cánh Cụt Himi đang lật bộ flashcard nhiều màu"
          className="game-session-mascot"
          height={640}
          priority
          src="/assets/games/flashcard-penguin-cutout.png"
          width={960}
        />

        <section className="game-play-card flash-game-stage">
          {finished ? <div className="game-result" role="status">
            <span><Trophy aria-hidden="true" size={28} /></span>
            <small>HOÀN THÀNH BỘ FLASHCARD</small>
            <h2>Bạn nhớ chắc {rememberedIds.length}/{lesson.vocabulary.length} từ.</h2>
            <strong>{score} điểm</strong>
            <div>
              <button onClick={restart} type="button"><RotateCcw aria-hidden="true" size={16} /> Học lại</button>
              <Link href={backHref}>Về bài học <ArrowRight aria-hidden="true" size={16} /></Link>
            </div>
          </div> : <>
            <button
              aria-label={flipped ? "Xem mặt Hán tự" : "Lật thẻ xem nghĩa"}
              className={`flashcard-3d${flipped ? " is-flipped" : ""}`}
              onClick={() => setFlipped((current) => !current)}
              type="button"
            >
              <span className="flashcard-3d-inner">
                <span className="flashcard-face flashcard-front">
                  <small>HÁN TỰ</small>
                  <strong lang="zh-CN">{word.hanzi}</strong>
                  <em>Bấm để lật thẻ</em>
                </span>
                <span className="flashcard-face flashcard-back">
                  <small>NGHĨA &amp; PHIÊN ÂM</small>
                  <strong>{word.meaning}</strong>
                  <b>{word.pinyin}</b>
                  <em lang="zh-CN">{word.example}</em>
                </span>
              </span>
            </button>

            <div className="flash-audio-row">
              <button onClick={() => speakChinese(word.hanzi)} type="button"><Volume2 aria-hidden="true" size={18} /> Nghe phát âm</button>
              <span><Sparkles aria-hidden="true" size={15} /> Lật thẻ trước khi tự chấm</span>
            </div>
            <div className="flash-rating-actions">
              <button disabled={!flipped} onClick={() => rate(false)} type="button"><X aria-hidden="true" size={17} /> Cần ôn lại</button>
              <button disabled={!flipped} onClick={() => rate(true)} type="button"><Check aria-hidden="true" size={17} /> Đã nhớ</button>
            </div>
          </>}
        </section>

        <aside className="game-session-tip">
          <Lightbulb aria-hidden="true" size={18} />
          <span><strong>Gợi ý:</strong> Bình tĩnh quan sát, mỗi lượt chơi là một bước tiến.</span>
        </aside>
      </section>
    </div>
  </main>;
}
