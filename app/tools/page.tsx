import type { Metadata } from "next";
import { CommunityHubPage } from "@/components/community-hub-page";

export const metadata: Metadata = {
  title: "Công cụ học tập",
  description: "Bộ công cụ luyện chữ, luyện nghe, tra lộ trình và ôn tập nhanh của Himi Chinese.",
};

export default function ToolsPage() {
  return <CommunityHubPage kind="tools" />;
}
