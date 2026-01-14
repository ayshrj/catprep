"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import React, { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

import { EstimationDuelAction, EstimationDuelPuzzle, EstimationDuelState } from "./types";

export const EstimationDuelUI: React.FC<{
  puzzle: EstimationDuelPuzzle;
  state: EstimationDuelState;
  dispatch: React.Dispatch<EstimationDuelAction>;
}> = ({ puzzle, state, dispatch }) => {
  const round = puzzle.rounds[state.index];
  const done = state.revealed.filter(Boolean).length;
  const progress = Math.round((done / puzzle.rounds.length) * 100);

  const isRevealed = state.revealed[state.index];
  const chosen = state.answered[state.index];

  const verdict = useMemo(() => {
    if (!isRevealed || chosen == null) return null;
    return chosen === round.correctIndex ? "correct" : "wrong";
  }, [isRevealed, chosen, round.correctIndex]);

  return (
    <Card className="game-panel">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              Round {state.index + 1}/{puzzle.rounds.length}
            </Badge>
            <span className="text-muted-foreground text-sm">Estimation Duel</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Solved: {done}/{puzzle.rounds.length}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={progress} />
        <div className="text-lg font-semibold">{round.prompt}</div>

        <div className="grid gap-2 sm:grid-cols-2">
          {round.options.map((opt, i) => {
            const selected = state.selected === i;
            const correct = isRevealed && i === round.correctIndex;
            const wrongChosen = isRevealed && chosen === i && i !== round.correctIndex;

            return (
              <Button
                key={i}
                variant={selected ? "default" : "outline"}
                onClick={() => dispatch({ type: "select", optionIndex: i })}
                className={[
                  "justify-start h-auto py-3",
                  correct ? "border-emerald-500" : "",
                  wrongChosen ? "border-destructive" : "",
                ].join(" ")}
                aria-label={`Option ${i + 1}: ${opt}`}
              >
                <span className="mr-2 font-semibold">{String.fromCharCode(65 + i)}.</span>
                {opt}
              </Button>
            );
          })}
        </div>

        <div className="game-action-row">
          <Button
            size="sm"
            onClick={() => dispatch({ type: "submit" })}
            disabled={isRevealed || state.selected == null}
          >
            Submit
          </Button>
          {isRevealed && (
            <Badge variant={verdict === "correct" ? "default" : "secondary"}>
              {verdict === "correct" ? "Correct" : "Revealed"}
            </Badge>
          )}
        </div>

        {isRevealed && (
          <>
            <Separator />
            <div className="text-sm">
              <span className="font-medium">Explanation:</span>{" "}
              <span className="text-muted-foreground">{round.explanation}</span>
            </div>
          </>
        )}

        <Separator />

        <div className="flex items-center justify-between">
          <Button size="sm" variant="secondary" onClick={() => dispatch({ type: "prev" })} disabled={state.index === 0}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Prev
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => dispatch({ type: "next" })}
            disabled={state.index === puzzle.rounds.length - 1}
          >
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
