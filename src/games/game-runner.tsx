"use client";
import { ChevronLeft, Lightbulb, RotateCcw, Sparkles } from "lucide-react";
import Link from "next/link";
import React, { useMemo, useState } from "react";

import { GameShell } from "@/components/game-shell";
import type { BottomBarActions, HelpSheetContent } from "@/components/game-shell.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { isLlmGame } from "@/games/core/game-generation";
import gameRegistry from "@/games/core/registry";
import { formatTime } from "@/games/core/timer";
import { useGameSession } from "@/games/core/use-game-session";

const GameRunner: React.FC<{ gameId: string }> = ({ gameId }) => {
  const fallbackGameId = useMemo(() => Object.keys(gameRegistry)[0] ?? "", []);
  const safeGameId = gameRegistry[gameId] ? gameId : fallbackGameId;
  const gameModule = gameRegistry[safeGameId];

  const {
    puzzle,
    state,
    dispatch,
    evaluation,
    stats,
    elapsedSeconds,
    startNewPuzzle,
    resetPuzzle,
    initialized,
    isGenerating,
    generationError,
  } = useGameSession(safeGameId);
  const [hints, setHints] = useState<Array<{ title: string; body: string }>>([]);
  const [difficulty, setDifficulty] = useState(gameModule.difficulties[0].id);

  const accuracy = stats.attempts ? Math.round((stats.solves / stats.attempts) * 100) : 0;
  const difficultyLabel =
    gameModule.difficulties.find(item => item.id === difficulty)?.label ?? gameModule.difficulties[0]?.label ?? "Easy";
  const lastHint = hints.length > 0 ? hints[hints.length - 1] : null;
  const showLoading = isGenerating || (!initialized && isLlmGame(safeGameId));

  const handleNew = () => {
    void startNewPuzzle(difficulty);
    setHints([]);
  };

  const handleReset = () => {
    resetPuzzle();
    setHints([]);
  };

  const handleHint = () => {
    if (!gameModule.getHint) return;
    const hint = gameModule.getHint(puzzle, state);
    if (hint) {
      setHints(prev => [...prev, hint]);
    }
  };

  const handleDifficultyChange = (value: string) => {
    if (!value) return;
    const next = Number(value);
    if (Number.isNaN(next)) return;
    setDifficulty(next);
    void startNewPuzzle(next);
    setHints([]);
  };

  const feedbackMessage = useMemo(() => {
    if (generationError) {
      return generationError;
    }
    if (showLoading) {
      return "Generating a fresh puzzle. Hang tight.";
    }
    if (evaluation.status === "solved") {
      return "Solved. Start a new round to keep your streak going.";
    }
    if (evaluation.status === "failed") {
      return "Round complete. Review your approach and try again.";
    }
    if (evaluation.errors.length > 0) {
      return evaluation.errors[0]?.message ?? "Check your last move.";
    }
    if (lastHint) {
      return `${lastHint.title}: ${lastHint.body}`;
    }
    return "Stay focused and keep moving.";
  }, [evaluation.errors, evaluation.status, generationError, lastHint, showLoading]);

  const contextStrip = (
    <div className="flex items-center gap-2 text-xs">
      <Badge variant="secondary">{showLoading ? "Generating" : formatTime(elapsedSeconds)}</Badge>
      <Badge variant="outline">
        Best {stats.bestTimeSeconds == null ? "--:--" : formatTime(stats.bestTimeSeconds)}
      </Badge>
      <Badge variant="outline">{difficultyLabel}</Badge>
      <Badge variant="outline">{accuracy}% acc</Badge>
    </div>
  );

  const endOfRound = evaluation.status === "solved" || evaluation.status === "failed";

  const primaryCard = showLoading ? (
    <div className="min-h-[320px] sm:min-h-[360px] lg:min-h-[460px]">
      <div className="space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-[240px] w-full rounded-2xl sm:h-[260px] lg:h-[320px]" />
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      </div>
    </div>
  ) : (
    <div className="min-h-[320px] sm:min-h-[360px] lg:min-h-[460px]">
      <gameModule.Component puzzle={puzzle} state={state} dispatch={dispatch} />
    </div>
  );

  const secondaryCard = endOfRound ? (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="shadow-sm">
          <CardContent className="p-3 text-sm">
            <div className="text-muted-foreground">Time</div>
            <div className="text-lg font-semibold">{formatTime(elapsedSeconds)}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-3 text-sm">
            <div className="text-muted-foreground">Accuracy</div>
            <div className="text-lg font-semibold">{accuracy}%</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-3 text-sm">
            <div className="text-muted-foreground">Streak</div>
            <div className="text-lg font-semibold">{stats.streakDays} days</div>
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
      </div>
      <details className="rounded-md border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
        <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Explanation
        </summary>
        <div className="pt-2">{gameModule.description}</div>
      </details>
    </div>
  ) : null;

  const helpSheetContent: HelpSheetContent = {
    rules: <div className="space-y-2 text-sm text-muted-foreground">{gameModule.description}</div>,
    examples: <div className="text-sm text-muted-foreground">Examples will appear here as you explore the game.</div>,
    scoring: (
      <div className="text-sm text-muted-foreground">Track accuracy, streak, and best time to measure progress.</div>
    ),
    shortcuts: (
      <div className="text-sm text-muted-foreground">
        Use quick taps for inputs; keyboard shortcuts can be added per game.
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
      <div>{gameModule.description}</div>
      {hints.length > 0 ? (
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Hints</div>
          <div className="space-y-2">
            {hints.map((hint, idx) => (
              <div key={`${hint.title}-${idx}`} className="rounded-md border bg-muted/30 px-3 py-2">
                <div className="text-sm font-semibold text-foreground">{hint.title}</div>
                <div className="text-xs text-muted-foreground">{hint.body}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {evaluation.errors.length > 0 ? (
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Errors</div>
          <ul className="space-y-1 text-xs text-destructive">
            {evaluation.errors.map((error, idx) => (
              <li key={`${error.type}-${idx}`}>{error.message}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{gameModule.section.toUpperCase()}</Badge>
        {gameModule.skillTags.map(tag => (
          <Badge key={tag} variant="outline">
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  );

  const bottomCoreActions: BottomBarActions = {
    left: (
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={handleReset}
        disabled={!initialized || isGenerating}
      >
        <RotateCcw className="h-4 w-4" />
        Reset
      </Button>
    ),
    center: (
      <Button size="sm" className="gap-2" onClick={handleNew} disabled={!initialized || isGenerating}>
        <Sparkles className="h-4 w-4" />
        New
      </Button>
    ),
    right: (
      <Button
        variant="ghost"
        size="sm"
        className="gap-2"
        onClick={handleHint}
        disabled={!gameModule.getHint || !initialized || isGenerating}
      >
        <Lightbulb className="h-4 w-4" />
        Hint
      </Button>
    ),
  };

  if (!gameModule || !gameRegistry[gameId]) {
    return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Game not found.</div>;
  }

  return (
    <GameShell
      headerLeft={
        <Button asChild variant="ghost" size="icon" aria-label="Back to games">
          <Link href="/games">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
      }
      headerCenter={<span className="truncate">{gameModule.title}</span>}
      contextStrip={contextStrip}
      primaryCard={primaryCard}
      feedbackSlot={feedbackMessage}
      secondaryCard={secondaryCard}
      bottomCoreActions={bottomCoreActions}
      bottomGameControls={
        <div className="flex items-center gap-2 text-xs min-w-0">
          <span className="text-muted-foreground shrink-0">Difficulty</span>
          <div className="flex-1 min-w-0">
            <ToggleGroup
              type="single"
              value={String(difficulty)}
              onValueChange={handleDifficultyChange}
              spacing={1}
              className="w-full flex-nowrap justify-start overflow-x-auto"
            >
              {gameModule.difficulties.map(item => (
                <ToggleGroupItem
                  key={item.id}
                  value={String(item.id)}
                  size="sm"
                  variant="outline"
                  disabled={!initialized || isGenerating}
                  className="shrink-0"
                >
                  {item.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>
      }
      helpSheetContent={helpSheetContent}
      statsSheetContent={statsSheetContent}
      moreSheetContent={moreSheetContent}
    />
  );
};

export default GameRunner;
