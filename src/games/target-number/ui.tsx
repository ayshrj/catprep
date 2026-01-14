"use client";

import React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import { TargetNumberAction, TargetNumberPuzzle, TargetNumberState } from "./types";

export const TargetNumberUI: React.FC<{
  puzzle: TargetNumberPuzzle;
  state: TargetNumberState;
  dispatch: React.Dispatch<TargetNumberAction>;
}> = ({ puzzle, state, dispatch }) => {
  const ops = ["+", "-", "*", "/"];

  return (
    <div className="space-y-4">
      <Card className="game-panel">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex flex-wrap items-center gap-2">
            Target <Badge>{puzzle.target}</Badge>
            <span className="text-muted-foreground">|</span>
            Remaining numbers <Badge variant="secondary">{state.currentNumbers.length}</Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="game-action-row">
            {state.currentNumbers.map((n, i) => {
              const selected = i === state.firstIndex || i === state.secondIndex;
              return (
                <Button
                  key={i}
                  variant={selected ? "default" : "outline"}
                  size="sm"
                  onClick={() => dispatch({ type: "selectNumber", index: i })}
                  className="min-w-14"
                >
                  {Number.isInteger(n) ? n : n.toFixed(3)}
                </Button>
              );
            })}
          </div>

          <div className="game-action-row">
            {ops.map(op => (
              <Button
                key={op}
                variant={state.operator === op ? "default" : "secondary"}
                size="sm"
                onClick={() => dispatch({ type: "selectOperator", operator: op })}
              >
                {op}
              </Button>
            ))}
          </div>

          <div className="game-action-row">
            <Button
              size="sm"
              onClick={() => dispatch({ type: "applyStep" })}
              disabled={state.firstIndex == null || state.secondIndex == null || !state.operator}
            >
              Apply
            </Button>
            <Button size="sm" variant="outline" onClick={() => dispatch({ type: "reset" })}>
              Reset
            </Button>
          </div>

          <Separator />

          <div className="text-sm font-medium">Steps</div>
          <ScrollArea className="h-[140px] pr-2">
            {state.steps.length === 0 ? (
              <div className="game-helper">No steps yet.</div>
            ) : (
              <ul className="space-y-1 text-sm">
                {state.steps.map((s, i) => (
                  <li key={i} className="rounded-lg border border-border/60 bg-background/70 p-2">
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
