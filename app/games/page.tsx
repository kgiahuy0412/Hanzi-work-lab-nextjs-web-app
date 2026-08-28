import type { Metadata } from "next";
import { GameCenter } from "@/components/game-center";
import { emptyGameProgress, isGameId } from "@/lib/activity-progress";
import { getGameProgress } from "@/lib/activity-progress-repository";
import { getCurrentUser } from "@/lib/auth-session";

export const metadata: Metadata = {
  title: "Trò chơi luyện tiếng Trung",
  description: "Bảy trò chơi ngắn giúp tăng phản xạ từ vựng, nghe hiểu, ghi nhớ và gõ tiếng Trung.",
};

export default async function GamesPage({
  searchParams,
}: {
  searchParams: Promise<{ game?: string | string[]; session?: string | string[] }>;
}) {
  const [{ game, session }, user] = await Promise.all([searchParams, getCurrentUser()]);
  const requestedGameId = Array.isArray(game) ? game[0] : game;
  const dailyFlow = (Array.isArray(session) ? session[0] : session) === "today";
  const progress = user ? await getGameProgress(user.id) : emptyGameProgress;
  return <GameCenter
    authenticated={Boolean(user)}
    dailyFlow={dailyFlow}
    initialGameId={isGameId(requestedGameId) ? requestedGameId : null}
    initialProgress={progress}
  />;
}
