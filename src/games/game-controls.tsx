"use client";
import { Lightbulb, RefreshCcw, Undo } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";

import DifficultySelector from "./difficulty-selector";

interface GameControlsProps {
  onNew: () => void;
  onReset: () => void;
  onHint: () => void;
  onUndo?: () => void;
  difficulties: Array<{ id: number; label: string }>;
  currentDifficulty: number;
  onSelectDifficulty: (diff: number) => void;
}

const GameControls: React.FC<GameControlsProps> = ({
  onNew,
  onReset,
  onHint,
  onUndo,
  difficulties,
  currentDifficulty,
  onSelectDifficulty,
}) => {
  return (
    <div className="game-panel game-panel-padded">
      <div className="game-action-row">
        <Button size="sm" onClick={onNew}>
          <RefreshCcw className="mr-1 w-4 h-4" /> New
        </Button>
        <Button size="sm" variant="secondary" onClick={onHint}>
          <Lightbulb className="mr-1 w-4 h-4" /> Hint
        </Button>
        {onUndo && (
          <Button size="sm" variant="outline" onClick={onUndo}>
            <Undo className="mr-1 w-4 h-4" /> Undo
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={onReset}>
          Reset
        </Button>
        <DifficultySelector options={difficulties} current={currentDifficulty} onSelect={onSelectDifficulty} />
      </div>
    </div>
  );
};

export default GameControls;
