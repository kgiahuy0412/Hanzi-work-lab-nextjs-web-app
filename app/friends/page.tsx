import type { Metadata } from "next";
import { CommunityHubPage } from "@/components/community-hub-page";

export const metadata: Metadata = {
  title: "Bạn bè học cùng",
  description: "Kết nối người học cùng mục tiêu và chuyên ngành trong cộng đồng Himi Chinese.",
};

export default function FriendsPage() {
  return <CommunityHubPage kind="friends" />;
}
