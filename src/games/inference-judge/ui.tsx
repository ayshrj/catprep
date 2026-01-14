"use client";

import React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import { InferenceJudgeAction, InferenceJudgePuzzle, InferenceJudgeState } from "./types";

export const InferenceJudgeUI: React.FC<{
  puzzle: InferenceJudgePuzzle;
  state: InferenceJudgeState;
  dispatch: React.Dispatch<InferenceJudgeAction>;
}> = ({ puzzle, state, dispatch }) => {
  const selected = state.selectedOptionId;

  const correct = state.submitted && selected !== null ? selected === puzzle.correctOptionId : null;

  return (
    <div className="space-y-4">
      <Card className="game-panel">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base">Inference Judge</CardTitle>
            <Badge variant="secondary">VARC</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{puzzle.question}</p>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="rounded-xl border border-border/60 bg-background/70">
            <div className="px-3 py-2 text-xs font-medium text-muted-foreground">Passage</div>
            <Separator />
            <ScrollArea className="h-[140px] px-3 py-3">
              <p className="text-sm leading-relaxed">{puzzle.passage}</p>
            </ScrollArea>
          </div>

          <div role="radiogroup" aria-label="Options" className="space-y-2">
            {puzzle.options.map(opt => {
              const isSelected = selected === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={[
                    "w-full text-left rounded-xl border px-3 py-3 text-sm",
                    "transition-colors focus:outline-none focus-visible:border-primary/60",
                    isSelected ? "bg-accent border-accent" : "hover:bg-muted/60",
                  ].join(" ")}
                  onClick={() => dispatch({ type: "select", optionId: opt.id })}
                >
                  <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs">
                    {opt.id}
                  </span>
                  {opt.text}
                </button>
              );
            })}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="inf-notes">
              Notes (optional)
            </label>
            <Textarea
              id="inf-notes"
              value={state.notes}
              onChange={e => dispatch({ type: "setNotes", value: e.target.value })}
              placeholder="Write why your option is strictly entailed by the passage…"
              className="min-h-[88px]"
            />
          </div>

          <div className="game-action-row items-center">
            <Button size="sm" onClick={() => dispatch({ type: "submit" })} disabled={!selected}>
              Submit
            </Button>
            <Button size="sm" variant="outline" onClick={() => dispatch({ type: "clear" })}>
              Clear
            </Button>

            {state.submitted && correct !== null && (
              <div className="ml-auto">
                {correct ? <Badge>Correct</Badge> : <Badge variant="destructive">Incorrect</Badge>}
              </div>
            )}
          </div>

          {state.submitted && correct === true && (
            <div className="game-panel game-panel-muted p-3 text-sm">
              <div className="font-medium mb-1">Why this is correct</div>
              <div className="text-muted-foreground">
                {puzzle.options.find(o => o.id === puzzle.correctOptionId)?.why}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
