import type { Metadata } from "next";
import { LearningModePlaceholder } from "@/components/learning-mode-placeholder";

export const metadata: Metadata = {
  title: "Luyện nghe",
  description: "Không gian luyện nghe tiếng Trung chủ động cùng Himi Chinese.",
};

export default function ListeningPage() {
  return <LearningModePlaceholder mode="listening" />;
}
