import type { Metadata } from "next";
import { CommunityHubPage } from "@/components/community-hub-page";

export const metadata: Metadata = {
  title: "Tài liệu học tập",
  description: "Tổng hợp lộ trình, video, bài nghe và tài liệu luyện chữ trên Himi Chinese.",
};

export default function MaterialsPage() {
  return <CommunityHubPage kind="materials" />;
}
