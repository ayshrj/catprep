"use client";

import { CheckCircle2 } from "lucide-react";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import type { ParaSummaryAction, ParaSummaryPuzzle, ParaSummaryState } from "./types";

export const ParaSummaryUI: React.FC<{
  puzzle: ParaSummaryPuzzle;
  state: ParaSummaryState;
  dispatch: React.Dispatch<ParaSummaryAction>;
}> = ({ puzzle, state, dispatch }) => {
  return (
    <div className="space-y-4">
      <Card className="game-panel">
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            {puzzle.title}
            <Badge variant="secondary">Para-summary</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ScrollArea className="h-36 sm:h-40 rounded-xl border border-border/60 bg-background/70 p-3">
            <p className="text-sm leading-6">{puzzle.passage}</p>
          </ScrollArea>

          <Separator />

          <div className="grid gap-2">
            {puzzle.options.map(opt => {
              const selected = state.selectedOptionId === opt.id;
              const isCorrect = state.submitted && opt.id === puzzle.correctOptionId;

              return (
                <Button
                  key={opt.id}
                  type="button"
                  variant={selected ? "default" : "outline"}
                  className="justify-start h-auto whitespace-normal text-left"
                  onClick={() => dispatch({ type: "select", optionId: opt.id })}
                  aria-pressed={selected}
                >
                  <span className="mr-2 font-semibold">{opt.id.toUpperCase()}.</span>
                  <span className="flex-1">{opt.text}</span>
                  {isCorrect && state.submitted && (
                    <Badge variant="secondary" className="ml-2">
                      Answer
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>

          <div className="game-action-row">
            <Button
              type="button"
              size="sm"
              onClick={() => dispatch({ type: "submit" })}
              disabled={!state.selectedOptionId}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Submit
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => dispatch({ type: "reset" })}>
              Edit
            </Button>
          </div>

          {state.submitted && (
            <div className="game-panel game-panel-muted p-3 text-sm space-y-2">
              <div className="font-semibold">Explanation</div>
              <p className="text-muted-foreground">{puzzle.explanation}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
