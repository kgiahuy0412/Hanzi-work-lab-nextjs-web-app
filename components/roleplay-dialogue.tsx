"use client";

import { useMemo, useState } from "react";
import { Bot, CheckCircle2, Headphones, Keyboard, Lightbulb, RotateCcw, Send, UserRound, Volume2 } from "lucide-react";
import { PronunciationEvaluator, type PronunciationResult } from "@/components/pronunciation-evaluator";
import { speakMandarin } from "@/lib/client-mandarin-audio";
import type { DialogueLine } from "@/lib/content-types";
import { evaluateTypedDialogueResponse, type TypedDialogueEvaluation } from "@/lib/dialogue-evaluation";

type TurnFeedback = TypedDialogueEvaluation & { mode: "typing" | "voice" };

export function RoleplayDialogue({
  courseTitle,
  situation,
  lines,
}: {
  courseTitle: string;
  situation: string;
  lines: DialogueLine[];
}) {
  const pairs = useMemo(() => {
    const result: { system: DialogueLine; learner: DialogueLine }[] = [];
    for (let index = 0; index + 1 < lines.length; index += 2) result.push({ system: lines[index], learner: lines[index + 1] });
    return result;
  }, [lines]);
  const [pairIndex, setPairIndex] = useState(0);
  const [mode, setMode] = useState<"typing" | "voice">("voice");
  const [input, setInput] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<TurnFeedback | null>(null);
  const [completed, setCompleted] = useState(false);
  const current = pairs[pairIndex];

  const submitTyped = () => {
    if (!current) return;
    setFeedback({ ...evaluateTypedDialogueResponse(input, current.learner.hanzi), mode: "typing" });
  };

  const receivePronunciation = (result: PronunciationResult) => {
    setFeedback({
      accepted: result.totalScore >= 70,
      score: result.totalScore,
      feedback: result.feedback,
      mode: "voice",
    });
  };

  const continueTurn = () => {
    if (!current || !feedback?.accepted) return;
    const nextAnswers = [...answers, feedback.mode === "typing" ? input.trim() : current.learner.hanzi];
    setAnswers(nextAnswers);
    setInput("");
    setFeedback(null);
    if (pairIndex === pairs.length - 1) setCompleted(true);
    else setPairIndex((index) => index + 1);
  };

  const retry = () => {
    setFeedback(null);
    if (mode === "voice") setInput("");
  };

  const restart = () => {
    setPairIndex(0);
    setAnswers([]);
    setInput("");
    setFeedback(null);
    setCompleted(false);
  };

  if (!current) return <div className="lesson-vocab-empty"><h2>Bài này chưa có hội thoại</h2><p>Nội dung nhập vai sẽ xuất hiện khi hội thoại được biên soạn.</p></div>;

  const visiblePairs = pairs.slice(0, completed ? pairs.length : pairIndex + 1);

  return <section className="roleplay-dialogue" aria-labelledby="roleplay-title">
    <header className="roleplay-header">
      <div><span className="section-kicker">Tình huống · {courseTitle}</span><h2 id="roleplay-title">Nhập vai: {situation}</h2><p>Hệ thống đóng vai người đối thoại. Bạn nghe câu hỏi rồi nói hoặc gõ câu trả lời bằng tiếng Trung.</p></div>
      <div className="roleplay-live"><span /> Đang luyện cùng AI</div>
    </header>

    <div className="roleplay-stage">
      <div className="roleplay-conversation" aria-live="polite">{visiblePairs.flatMap((pair, index) => {
        const learnerVisible = index < answers.length;
        return [
          <article className="roleplay-message is-system" key={`system-${index}`}>
            <span className="roleplay-avatar"><Bot size={19} /></span>
            <div><small>Người đối thoại</small><strong lang="zh-CN">{pair.system.hanzi}</strong><span>{pair.system.pinyin}</span><p>{pair.system.translation}</p></div>
            <button aria-label={`Nghe câu ${pair.system.hanzi}`} onClick={() => speakMandarin(pair.system.hanzi)} type="button"><Volume2 size={17} /></button>
          </article>,
          learnerVisible ? <article className="roleplay-message is-learner" key={`learner-${index}`}>
            <span className="roleplay-avatar"><UserRound size={19} /></span>
            <div><small>Bạn</small><strong lang="zh-CN">{answers[index]}</strong><p>{pair.learner.translation}</p></div>
          </article> : null,
        ];
      })}</div>

      {!completed ? <div className="roleplay-response-panel">
        <div className="roleplay-instruction"><Headphones size={18} /><span><strong>Lượt của bạn</strong>Nghe câu phía trên rồi trả lời.</span></div>
        <div className="roleplay-mode-switch" role="tablist" aria-label="Cách trả lời">
          <button aria-selected={mode === "voice"} className={mode === "voice" ? "is-active" : ""} onClick={() => { setMode("voice"); setFeedback(null); }} role="tab" type="button"><Volume2 size={16} /> Nói</button>
          <button aria-selected={mode === "typing"} className={mode === "typing" ? "is-active" : ""} onClick={() => { setMode("typing"); setFeedback(null); }} role="tab" type="button"><Keyboard size={16} /> Gõ</button>
        </div>

        {mode === "voice" ? <PronunciationEvaluator compact key={`${pairIndex}-voice`} onEvaluated={receivePronunciation} showListen={false} targetText={current.learner.hanzi} /> : <div className="roleplay-typing">
          <label htmlFor="roleplay-answer">Câu trả lời tiếng Trung</label>
          <div><textarea id="roleplay-answer" onChange={(event) => { setInput(event.target.value); setFeedback(null); }} placeholder="Nhập câu trả lời của bạn…" rows={2} value={input} /><button disabled={!input.trim()} onClick={submitTyped} type="button"><Send size={18} /> Kiểm tra</button></div>
        </div>}

        {feedback ? <div className={`roleplay-feedback ${feedback.accepted ? "is-correct" : "is-retry"}`}>
          <span>{feedback.accepted ? <CheckCircle2 size={21} /> : <Lightbulb size={21} />}</span>
          <div><strong>{feedback.feedback}</strong><p>Điểm lượt này: {feedback.score}/100</p>
            <div className="roleplay-natural"><small>Cách nói tự nhiên hơn</small><strong lang="zh-CN">{current.learner.hanzi}</strong><span>{current.learner.pinyin}</span><p>{current.learner.translation}</p></div>
          </div>
          {feedback.accepted ? <button onClick={continueTurn} type="button">{pairIndex === pairs.length - 1 ? "Hoàn thành" : "Tiếp tục"}</button> : <button onClick={retry} type="button"><RotateCcw size={15} /> Thử lại</button>}
        </div> : <div className="roleplay-hint"><Lightbulb size={16} /><span>Gợi ý: {current.learner.translation}</span></div>}
      </div> : <div className="roleplay-complete">
        <CheckCircle2 size={35} /><span className="section-kicker">Hoàn thành tình huống</span><h3>Bạn đã đi hết cuộc hội thoại</h3><p>Hãy luyện lại và thử nói liền mạch hơn ở lượt tiếp theo.</p><button onClick={restart} type="button"><RotateCcw size={17} /> Luyện lại từ đầu</button>
      </div>}
    </div>
  </section>;
}
