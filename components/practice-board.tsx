"use client";

import { useState } from "react";
import { RotateCcw, Trophy } from "lucide-react";
import { officeVocabulary } from "@/lib/course-data";

export function PracticeBoard() {
  const [index, setIndex] = useState(0); const [flipped, setFlipped] = useState(false); const [known, setKnown] = useState(0);
  const finished = index >= officeVocabulary.length; const word = officeVocabulary[Math.min(index, officeVocabulary.length - 1)];
  function answer(isKnown: boolean) { if (isKnown) setKnown((value) => value + 1); setIndex((value) => value + 1); setFlipped(false); }
  function restart() { setIndex(0); setKnown(0); setFlipped(false); }
  return <section className="practice-board" aria-live="polite">{!finished ? <>
    <div className="practice-top"><span>Ôn tập · Văn phòng</span><span>{index + 1} / {officeVocabulary.length}</span></div><div className="practice-progress"><span style={{ width: `${((index + 1) / officeVocabulary.length) * 100}%` }} /></div>
    <button className="flashcard" onClick={() => setFlipped(!flipped)} type="button"><span className="flashcard-label">{flipped ? "Đáp án" : "Nhìn từ và nhớ nghĩa"}</span><span className="flashcard-hanzi" lang="zh">{word.hanzi}</span><span className="flashcard-pinyin">{word.pinyin}</span>{flipped && <span className="flashcard-meaning">{word.meaning}</span>}<span className="flashcard-hint">Chạm vào thẻ để {flipped ? "ẩn" : "xem"} nghĩa</span></button>
    <div className="answer-actions"><button className="answer-button hard" disabled={!flipped} onClick={() => answer(false)} type="button">Cần ôn lại</button><button className="answer-button known" disabled={!flipped} onClick={() => answer(true)} type="button">Tôi đã nhớ</button></div>
  </> : <div className="practice-finish"><div><div className="practice-finish-icon"><Trophy size={34} /></div><h2>Đã xong lượt ôn!</h2><p>Bạn nhớ chắc {known}/{officeVocabulary.length} từ. Những từ khó sẽ xuất hiện lại ở lượt sau.</p><button className="button button-primary" onClick={restart} type="button"><RotateCcw size={17} /> Ôn lại từ đầu</button></div></div>}</section>;
}
