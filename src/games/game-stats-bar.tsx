"use client";
import { Timer } from "lucide-react";
import React from "react";

import { Progress } from "@/components/ui/progress";
import { formatTime } from "@/games/core/timer";

interface GameStatsBarProps {
  elapsedSeconds: number;
  bestTimeSeconds: number | null;
  streakDays: number;
  accuracy: number;
}

const GameStatsBar: React.FC<GameStatsBarProps> = ({ elapsedSeconds, bestTimeSeconds, streakDays, accuracy }) => {
  return (
    <div className="game-stats">
      <div className="flex flex-wrap items-center gap-2">
        <span className="game-chip flex items-center gap-1">
          <Timer className="w-4 h-4" />
          {formatTime(elapsedSeconds)}
        </span>
        <span className="game-chip">Best: {bestTimeSeconds !== null ? formatTime(bestTimeSeconds) : "--:--"}</span>
        <span className="game-chip">
          Streak: {streakDays} day{streakDays === 1 ? "" : "s"}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Accuracy</span>
        <Progress className="w-28" value={accuracy} />
        <span className="text-xs font-semibold">{accuracy}%</span>
      </div>
    </div>
  );
};

export default GameStatsBar;
