"use client";

import { CheckCircle2 } from "lucide-react";
import React, { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import type { TwoLineSummaryAction, TwoLineSummaryPuzzle, TwoLineSummaryState } from "./types";

function wordCount(text: string) {
  const tokens = text.trim().split(/\s+/).filter(Boolean);
  return tokens.length;
}

export const TwoLineSummaryUI: React.FC<{
  puzzle: TwoLineSummaryPuzzle;
  state: TwoLineSummaryState;
  dispatch: React.Dispatch<TwoLineSummaryAction>;
}> = ({ puzzle, state, dispatch }) => {
  const wc = useMemo(() => wordCount(state.text), [state.text]);
  const within = wc >= puzzle.minWords && wc <= puzzle.maxWords;

  // Simple progress target: map to 0..100 based on maxWords
  const progress = Math.min(100, Math.round((wc / puzzle.maxWords) * 100));

  return (
    <div className="space-y-4">
      <Card className="game-panel">
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            {puzzle.promptTitle}
            <Badge variant="secondary">2-Line Summary</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ScrollArea className="h-36 sm:h-44 rounded-xl border border-border/60 bg-background/70 p-3">
            <p className="text-sm leading-6">{puzzle.passage}</p>
          </ScrollArea>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-medium">
                Your summary{" "}
                <span className="text-xs text-muted-foreground">
                  ({puzzle.minWords}-{puzzle.maxWords} words)
                </span>
              </div>
              <Badge variant={within ? "secondary" : "outline"}>{wc} words</Badge>
            </div>

            <Progress value={progress} />

            <Textarea
              value={state.text}
              onChange={e => dispatch({ type: "setText", text: e.target.value })}
              placeholder="Write a crisp 2-line summary…"
              className="min-h-[120px]"
              aria-label="Two line summary input"
            />

            <div className="game-action-row">
              <Button type="button" size="sm" onClick={() => dispatch({ type: "submit" })} disabled={wc === 0}>
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Submit
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => dispatch({ type: "reset" })}>
                Edit
              </Button>
            </div>

            {state.submitted && (
              <div className="game-panel game-panel-muted p-3 space-y-2">
                <div className="text-sm font-semibold">Model example</div>
                <p className="text-muted-foreground">{puzzle.sampleGoodSummary}</p>
                <p className="game-helper">CAT benefit: trains scope control + compression for VA.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
