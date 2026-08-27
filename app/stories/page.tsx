import type { Metadata } from "next";
import { CommunityHubPage } from "@/components/community-hub-page";

export const metadata: Metadata = {
  title: "Truyện song ngữ",
  description: "Đọc truyện ngắn Trung – Việt theo bối cảnh đời sống và công việc cùng Himi Chinese.",
};

export default function StoriesPage() {
  return <CommunityHubPage kind="stories" />;
}
