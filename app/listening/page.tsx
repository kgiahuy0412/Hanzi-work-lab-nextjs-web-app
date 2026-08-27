import type { Metadata } from "next";
import { ListeningStudio } from "@/components/listening-studio";

export const metadata: Metadata = {
  title: "Luyện nghe",
  description: "Không gian luyện nghe tiếng Trung chủ động cùng Himi Chinese.",
};

export default function ListeningPage() {
  return <ListeningStudio />;
}
