"use client";

import dynamic from "next/dynamic";
import type { GameId, GameProgressSnapshot } from "@/lib/activity-progress";
import "@/app/game-center.css";

const GameCenter = dynamic(
  () => import("@/components/game-center").then((module) => module.GameCenter),
  {
    ssr: false,
    loading: () => <main aria-busy="true" className="learner-dashboard game-center-dashboard" />,
  },
);

export function GameCenterClient({
  authenticated,
  dailyFlow,
  initialGameId,
  initialProgress,
}: {
  authenticated: boolean;
  dailyFlow: boolean;
  initialGameId: GameId | null;
  initialProgress: GameProgressSnapshot;
}) {
  return (
    <GameCenter
      authenticated={authenticated}
      dailyFlow={dailyFlow}
      initialGameId={initialGameId}
      initialProgress={initialProgress}
    />
  );
}
