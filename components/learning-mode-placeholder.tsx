import Link from "next/link";
import { ArrowRight, AudioLines, PenLine, Sparkles } from "lucide-react";

type LearningMode = "writing" | "listening";

const modeContent = {
  writing: {
    eyebrow: "Góc luyện kỹ năng",
    title: "Luyện viết cùng Himi",
    description: "Không gian luyện nét, nhớ mặt chữ và viết Hán tự đang được Himi chuẩn bị.",
    note: "Nội dung luyện viết sẽ được bổ sung ở bước tiếp theo.",
    icon: PenLine,
  },
  listening: {
    eyebrow: "Góc luyện kỹ năng",
    title: "Luyện nghe chủ động",
    description: "Phòng nghe theo cấp độ, luyện bắt âm và phản xạ câu đang được Himi chuẩn bị.",
    note: "Nội dung luyện nghe sẽ được bổ sung ở bước tiếp theo.",
    icon: AudioLines,
  },
} satisfies Record<LearningMode, {
  eyebrow: string;
  title: string;
  description: string;
  note: string;
  icon: typeof PenLine;
}>;

export function LearningModePlaceholder({ mode }: { mode: LearningMode }) {
  const content = modeContent[mode];
  const Icon = content.icon;

  return (
    <main className={`learner-dashboard learning-mode-placeholder is-${mode}`}>
      <section className="learning-mode-placeholder-card">
        <span aria-hidden="true" className="learning-mode-placeholder-glow" />
        <div className="learning-mode-placeholder-icon"><Icon aria-hidden="true" size={30} /></div>
        <p className="learning-mode-placeholder-eyebrow"><Sparkles aria-hidden="true" size={15} />{content.eyebrow}</p>
        <h1>{content.title}</h1>
        <p>{content.description}</p>
        <span className="learning-mode-placeholder-note">{content.note}</span>
        <Link href="/videos">Học qua video trước <ArrowRight aria-hidden="true" size={17} /></Link>
      </section>
    </main>
  );
}
