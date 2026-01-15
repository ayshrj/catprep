"use client";

import { ChevronLeft, Lightbulb, RotateCcw, Sparkles } from "lucide-react";
import { useState } from "react";

import { GameShell } from "@/components/game-shell";
import type { BottomBarActions, HelpSheetContent } from "@/components/game-shell.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import gameRegistry from "@/games/core/registry";
import { formatTime } from "@/games/core/timer";
import { useGameSession } from "@/games/core/use-game-session";

const GAME_ID = "targetNumber";

export default function ExampleGamePage() {
  const gameModule = gameRegistry[GAME_ID];
  const { puzzle, state, dispatch, evaluation, stats, elapsedSeconds, startNewPuzzle, resetPuzzle } =
    useGameSession(GAME_ID);
  const [difficulty, setDifficulty] = useState(gameModule.difficulties[0].id);
  const [hint, setHint] = useState<string | null>(null);

  const difficultyLabel = gameModule.difficulties.find(item => item.id === difficulty)?.label ?? "Easy";
  const statusLabel =
    evaluation.status === "solved" ? "Solved" : evaluation.status === "failed" ? "Try again" : "In progress";

  const feedbackMessage =
    evaluation.status === "solved"
      ? "Solved. Start a new round to keep the streak going."
      : (hint ?? evaluation.errors[0]?.message ?? `Status: ${statusLabel}.`);

  const handleDifficultyChange = (value: string) => {
    if (!value) return;
    const next = Number(value);
    if (Number.isNaN(next)) return;
    setDifficulty(next);
    setHint(null);
    void startNewPuzzle(next);
  };

  const handleNewRound = () => {
    setHint(null);
    void startNewPuzzle(difficulty);
  };

  const handleReset = () => {
    setHint(null);
    resetPuzzle();
  };

  const handleHint = () => {
    if (!gameModule.getHint) return;
    const nextHint = gameModule.getHint(puzzle, state);
    if (nextHint) {
      setHint(`${nextHint.title}: ${nextHint.body}`);
    }
  };

  const helpContent: HelpSheetContent = {
    rules: (
      <div className="space-y-2 p-1 text-sm text-muted-foreground">
        <div>Reach the target using the numbers provided. Each number can be used once.</div>
        <div>Choose two numbers, apply an operator, and continue until you match the target.</div>
      </div>
    ),
    examples: (
      <div className="space-y-2 p-1 text-sm text-muted-foreground">
        <div>Example: 6, 3, 2 -{">"} (6 - 2) * 3 = 12.</div>
        <div>Plan intermediate steps before committing to avoid dead ends.</div>
      </div>
    ),
    scoring: (
      <div className="space-y-2 p-1 text-sm text-muted-foreground">
        <div>Faster solves improve best time.</div>
        <div>Streaks track consecutive daily solves.</div>
      </div>
    ),
    shortcuts: (
      <div className="space-y-2 p-1 text-sm text-muted-foreground">
        <div>Tap numbers to select operands.</div>
        <div>Use Reset to clear the current attempt.</div>
      </div>
    ),
  };

  const statsSheetContent = (
    <div className="grid gap-3 sm:grid-cols-2">
      <Card className="shadow-sm">
        <CardContent className="p-3 text-sm">
          <div className="text-muted-foreground">Attempts</div>
          <div className="text-lg font-semibold">{stats.attempts}</div>
        </CardContent>
      </Card>
      <Card className="shadow-sm">
        <CardContent className="p-3 text-sm">
          <div className="text-muted-foreground">Solves</div>
          <div className="text-lg font-semibold">{stats.solves}</div>
        </CardContent>
      </Card>
      <Card className="shadow-sm">
        <CardContent className="p-3 text-sm">
          <div className="text-muted-foreground">Best time</div>
          <div className="text-lg font-semibold">
            {stats.bestTimeSeconds == null ? "--:--" : formatTime(stats.bestTimeSeconds)}
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-sm">
        <CardContent className="p-3 text-sm">
          <div className="text-muted-foreground">Streak</div>
          <div className="text-lg font-semibold">{stats.streakDays} days</div>
        </CardContent>
      </Card>
    </div>
  );

  const moreSheetContent = (
    <div className="space-y-3 text-sm text-muted-foreground">
      <div>Adjust preferences, report issues, or leave feedback.</div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm">
          Report issue
        </Button>
        <Button variant="outline" size="sm">
          Send feedback
        </Button>
      </div>
    </div>
  );

  const bottomCoreActions: BottomBarActions = {
    left: (
      <Button variant="outline" size="sm" className="gap-2" onClick={handleReset}>
        <RotateCcw className="h-4 w-4" />
        Reset
      </Button>
    ),
    center: (
      <Button size="sm" className="gap-2" onClick={handleNewRound}>
        <Sparkles className="h-4 w-4" />
        New
      </Button>
    ),
    right: (
      <Button variant="ghost" size="sm" className="gap-2" onClick={handleHint} disabled={!gameModule.getHint}>
        <Lightbulb className="h-4 w-4" />
        Hint
      </Button>
    ),
  };

  return (
    <GameShell
      headerLeft={
        <Button variant="ghost" size="icon" aria-label="Back">
          <ChevronLeft className="h-4 w-4" />
        </Button>
      }
      headerCenter={<span className="truncate">{gameModule.title}</span>}
      contextStrip={
        <div className="flex min-w-0 items-center gap-2 text-xs">
          <Badge variant="secondary">{formatTime(elapsedSeconds)}</Badge>
          <Badge variant="outline">Streak {stats.streakDays}d</Badge>
          <Badge variant="outline">{difficultyLabel}</Badge>
        </div>
      }
      primaryCard={
        <div className="min-h-[280px]">
          <gameModule.Component puzzle={puzzle} state={state} dispatch={dispatch} />
        </div>
      }
      feedbackSlot={feedbackMessage}
      secondaryCard={
        <div className="space-y-2 text-sm text-muted-foreground">
          <div>{gameModule.description}</div>
          <div>Accuracy: {stats.attempts ? Math.round((stats.solves / stats.attempts) * 100) : 0}%</div>
        </div>
      }
      bottomCoreActions={bottomCoreActions}
      bottomGameControls={
        <div className="flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="text-muted-foreground">Difficulty</div>
          <ToggleGroup
            type="single"
            value={String(difficulty)}
            onValueChange={handleDifficultyChange}
            spacing={1}
            className="w-full flex-wrap justify-start sm:w-auto sm:justify-end"
          >
            {gameModule.difficulties.map(item => (
              <ToggleGroupItem key={item.id} value={String(item.id)} size="sm" variant="outline">
                {item.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      }
      helpSheetContent={helpContent}
      statsSheetContent={statsSheetContent}
      moreSheetContent={moreSheetContent}
    />
  );
}
