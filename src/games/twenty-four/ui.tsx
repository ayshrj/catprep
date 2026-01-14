"use client";
import React from "react";

import { Button } from "@/components/ui/button";

import { TwentyFourAction, TwentyFourPuzzle, TwentyFourState } from "./types";

export const TwentyFourUI: React.FC<{
  puzzle: TwentyFourPuzzle;
  state: TwentyFourState;
  dispatch: React.Dispatch<TwentyFourAction>;
}> = ({ puzzle, state, dispatch }) => {
  const { currentNumbers, firstIndex, secondIndex, operator } = state;
  const operators = ["+", "-", "*", "/"];

  return (
    <div className="game-panel game-panel-padded space-y-4">
      <div className="game-helper">
        Pick two numbers, choose an operator, then Apply. Reach 24 to win. Tap numbers again to reselect; Reset to
        restart the current puzzle.
      </div>

      <div className="game-action-row">
        {currentNumbers.map((num, idx) => {
          const isSelected = idx === firstIndex || idx === secondIndex;
          return (
            <Button
              key={idx}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => dispatch({ type: "selectNumber", index: idx })}
              className="min-w-[56px]"
            >
              {num}
            </Button>
          );
        })}
      </div>

      <div className="game-action-row">
        {operators.map(op => (
          <Button
            key={op}
            variant={operator === op ? "default" : "secondary"}
            size="sm"
            onClick={() => dispatch({ type: "selectOperator", operator: op })}
            className="min-w-[56px]"
          >
            {op}
          </Button>
        ))}
      </div>

      <div className="game-action-row">
        <Button
          size="sm"
          onClick={() => dispatch({ type: "applyStep" })}
          disabled={firstIndex === null || secondIndex === null || operator === null}
        >
          Apply
        </Button>
        <Button size="sm" variant="outline" onClick={() => dispatch({ type: "resetExpression" })}>
          Reset
        </Button>
      </div>

      <div className="game-helper">
        Current solution target: <span className="font-semibold">24</span> | Start numbers: {puzzle.numbers.join(", ")}
      </div>
    </div>
  );
};
