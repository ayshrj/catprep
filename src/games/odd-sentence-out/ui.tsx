"use client";

import React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import { OddSentenceOutAction, OddSentenceOutPuzzle, OddSentenceOutState } from "./types";

const labelFor = (i: number) => String.fromCharCode("A".charCodeAt(0) + i);

export const OddSentenceOutUI: React.FC<{
  puzzle: OddSentenceOutPuzzle;
  state: OddSentenceOutState;
  dispatch: React.Dispatch<OddSentenceOutAction>;
}> = ({ puzzle, state, dispatch }) => {
  const { selectedIndex, submitted } = state;

  return (
    <div className="space-y-4">
      <Card className="game-panel">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base">Odd Sentence Out</CardTitle>
            <Badge variant="secondary">VARC</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{puzzle.prompt}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div role="list" aria-label="Sentences list" className="space-y-2">
            {puzzle.sentences.map((s, idx) => {
              const isSelected = selectedIndex === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  className={[
                    "w-full text-left rounded-xl border px-3 py-3 text-sm",
                    "transition-colors focus:outline-none focus-visible:border-primary/60",
                    isSelected ? "bg-accent border-accent" : "hover:bg-muted/60",
                  ].join(" ")}
                  aria-pressed={isSelected}
                  onClick={() => dispatch({ type: "select", index: idx })}
                >
                  <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs">
                    {labelFor(idx)}
                  </span>
                  <span>{s}</span>
                </button>
              );
            })}
          </div>

          <Separator />

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="oso-expl">
              Your reasoning (optional)
            </label>
            <Textarea
              id="oso-expl"
              value={state.explanation}
              onChange={e => dispatch({ type: "setExplanation", value: e.target.value })}
              placeholder="Write 1–2 lines: topic shift / logical break / absolute claim / reference issue…"
              className="min-h-[88px]"
            />
          </div>

          <div className="game-action-row">
            <Button
              size="sm"
              onClick={() => dispatch({ type: "submit" })}
              disabled={selectedIndex === null}
              className="min-w-[120px]"
            >
              Submit
            </Button>
            <Button size="sm" variant="outline" onClick={() => dispatch({ type: "clearSelection" })}>
              Clear
            </Button>

            {submitted && selectedIndex !== null && (
              <div className="flex items-center">
                {selectedIndex === puzzle.oddIndex ? (
                  <Badge>Correct</Badge>
                ) : (
                  <Badge variant="destructive">Incorrect</Badge>
                )}
              </div>
            )}
          </div>

          {submitted && selectedIndex !== null && selectedIndex === puzzle.oddIndex && (
            <div className="game-panel game-panel-muted p-3 text-sm">
              <div className="font-medium mb-1">Review</div>
              <div className="text-muted-foreground">{puzzle.rationale}</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
