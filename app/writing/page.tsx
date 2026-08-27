import type { Metadata } from "next";
import { HimiWritingStudio } from "@/components/himi-writing-studio";

export const metadata: Metadata = {
  title: "Luyện viết",
  description: "Không gian luyện viết Hán tự cùng Himi Chinese.",
};

export default function WritingPage() {
  return <HimiWritingStudio />;
}
