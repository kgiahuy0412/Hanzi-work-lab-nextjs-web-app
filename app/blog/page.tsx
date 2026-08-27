import type { Metadata } from "next";
import { CommunityHubPage } from "@/components/community-hub-page";

export const metadata: Metadata = {
  title: "Bài viết",
  description: "Phương pháp và kinh nghiệm học tiếng Trung thực tế dành cho người đi làm.",
};

export default function BlogPage() {
  return <CommunityHubPage kind="blog" />;
}
