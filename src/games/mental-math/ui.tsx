"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import React, { useEffect, useMemo, useRef } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

import { MentalMathAction, MentalMathPuzzle, MentalMathState } from "./types";

export const MentalMathUI: React.FC<{
  puzzle: MentalMathPuzzle;
  state: MentalMathState;
  dispatch: React.Dispatch<MentalMathAction>;
}> = ({ puzzle, state, dispatch }) => {
  const q = puzzle.questions[state.index];
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [state.index]);

  const progress = useMemo(() => {
    const done = state.submitted.filter(Boolean).length;
    return Math.round((done / puzzle.questions.length) * 100);
  }, [state.submitted, puzzle.questions.length]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (state.submitted[state.index]) return;
    dispatch({ type: "submit" });
    if (state.index < puzzle.questions.length - 1) {
      dispatch({ type: "next" });
    }
  };

  return (
    <Card className="game-panel">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              Q{state.index + 1}/{puzzle.questions.length}
            </Badge>
            <span className="text-muted-foreground text-sm">Mental Math Arena</span>
          </div>
          <div className="text-xs text-muted-foreground">Target pace: {puzzle.perQuestionSeconds ?? 20}s/question</div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        <Progress value={progress} />
        <div className="text-lg font-semibold">{q.prompt}</div>

        {!state.submitted[state.index] ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              ref={inputRef}
              value={state.input}
              onChange={e => dispatch({ type: "setInput", value: e.target.value })}
              onKeyDown={onKeyDown}
              inputMode="decimal"
              aria-label="Answer input"
              className="sm:max-w-xs"
              placeholder="Type answer…"
            />
            <Button size="sm" onClick={handleSubmit}>
              Submit
            </Button>
          </div>
        ) : (
          <div className="game-helper">Answer submitted. Use Next/Prev to continue.</div>
        )}

        <Separator />

        <div className="flex items-center justify-between">
          <Button size="sm" variant="secondary" onClick={() => dispatch({ type: "prev" })} disabled={state.index === 0}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Prev
          </Button>

          <div className="flex flex-wrap gap-1 justify-center">
            {puzzle.questions.map((_, i) => (
              <button
                key={i}
                className={[
                  "h-8 w-8 rounded-md border border-border/70 text-xs",
                  "focus:outline-none focus-visible:border-primary/60 focus-visible:bg-accent/40",
                  i === state.index ? "bg-primary text-primary-foreground" : "bg-background",
                  state.submitted[i] ? "opacity-100" : "opacity-60",
                ].join(" ")}
                onClick={() => dispatch({ type: "jump", index: i })}
                aria-label={`Go to question ${i + 1}`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => dispatch({ type: "next" })}
            disabled={state.index === puzzle.questions.length - 1}
          >
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <div className="game-helper">
          Keyboard: <span className="game-kbd">Enter</span> to submit.
        </div>
      </CardContent>
    </Card>
  );
};
