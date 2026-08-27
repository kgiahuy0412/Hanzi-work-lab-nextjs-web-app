import type { Metadata } from "next";
import { CommunityHubPage } from "@/components/community-hub-page";

export const metadata: Metadata = {
  title: "Bảng xếp hạng",
  description: "Không gian thi đua và ghi nhận nhịp học đều đặn của cộng đồng Himi Chinese.",
};

export default function LeaderboardPage() {
  return <CommunityHubPage kind="leaderboard" />;
}
