"use client";
import React, { useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import gameRegistry from "@/games/core/registry";
import { useGameSession } from "@/games/core/use-game-session";

import ErrorLogPanel from "./error-log-panel";
import GameControls from "./game-controls";
import GameHeader from "./game-header";
import GameStatsBar from "./game-stats-bar";
import HintPanel from "./hint-panel";

const GameRunner: React.FC<{ gameId: string }> = ({ gameId }) => {
  const gameModule = gameRegistry[gameId];
  const { puzzle, state, dispatch, evaluation, stats, elapsedSeconds, startNewPuzzle, resetPuzzle } =
    useGameSession(gameId);
  const [hints, setHints] = useState<Array<{ title: string; body: string }>>([]);
  const [difficulty, setDifficulty] = useState(gameModule.difficulties[0].id);

  const handleNew = () => {
    startNewPuzzle();
    setHints([]); // clear hints on new puzzle
  };
  const handleReset = () => {
    resetPuzzle();
    setHints([]);
  };
  const handleHint = () => {
    if (gameModule.getHint) {
      const hint = gameModule.getHint(puzzle, state);
      if (hint) {
        setHints(prev => [...prev, hint]);
      }
    }
  };
  const handleDifficultyChange = (diff: number) => {
    setDifficulty(diff);
    startNewPuzzle(diff);
    setHints([]);
  };

  const accuracy = stats.attempts ? Math.round((stats.solves / stats.attempts) * 100) : 0;

  return (
    <div className="game-shell">
      <GameHeader title={gameModule.title} section={gameModule.section} skillTags={gameModule.skillTags} />
      <GameStatsBar
        elapsedSeconds={elapsedSeconds}
        bestTimeSeconds={stats.bestTimeSeconds}
        streakDays={stats.streakDays}
        accuracy={accuracy}
      />
      <div className="game-layout">
        <div className="space-y-4">
          <div className="game-surface">
            <div className="game-surface-body">
              <div className="game-content">
                <gameModule.Component puzzle={puzzle} state={state} dispatch={dispatch} />
              </div>
            </div>
          </div>
          <GameControls
            onNew={handleNew}
            onReset={handleReset}
            onHint={handleHint}
            difficulties={gameModule.difficulties}
            currentDifficulty={difficulty}
            onSelectDifficulty={handleDifficultyChange}
          />
        </div>
        <div className="game-panel game-panel-padded">
          <Tabs defaultValue="hints" className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="hints">Hints</TabsTrigger>
              <TabsTrigger value="errors">Errors</TabsTrigger>
              <TabsTrigger value="how">How it helps</TabsTrigger>
            </TabsList>
            <TabsContent value="hints" className="mt-3">
              <HintPanel hints={hints} />
            </TabsContent>
            <TabsContent value="errors" className="mt-3">
              <ErrorLogPanel errors={evaluation.errors} />
            </TabsContent>
            <TabsContent value="how" className="mt-3">
              <div className="text-sm text-muted-foreground">{gameModule.description}</div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default GameRunner;
