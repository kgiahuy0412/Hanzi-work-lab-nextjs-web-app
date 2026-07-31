import type { Metadata } from "next";
import { BrainCircuit } from "lucide-react";
import { PracticeBoard } from "@/components/practice-board";

export const metadata: Metadata = { title: "Luyện tập từ vựng" };

export default function PracticePage() {
  return <main className="practice-section"><div className="section-shell practice-layout">
    <div className="practice-info"><div className="eyebrow"><BrainCircuit size={16} /> Ôn tập thông minh</div><h1>Nhớ lâu hơn, không cần học lâu hơn.</h1><p>Ôn lại những từ bạn thấy khó trong bài học. Bản MVP dùng flashcard và tự đánh giá, chưa cần chấm điểm phát âm bằng AI.</p><div className="practice-stats"><div className="practice-stat"><strong>12</strong><span>Từ cần ôn hôm nay</span></div><div className="practice-stat"><strong>84%</strong><span>Tỷ lệ ghi nhớ tuần này</span></div></div></div>
    <PracticeBoard />
  </div></main>;
}
