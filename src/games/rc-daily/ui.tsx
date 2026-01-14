"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import type { RcDailyAction, RcDailyPuzzle, RcDailyState } from "./types";

export const RcDailyUI: React.FC<{
  puzzle: RcDailyPuzzle;
  state: RcDailyState;
  dispatch: React.Dispatch<RcDailyAction>;
}> = ({ puzzle, state, dispatch }) => {
  const allAnswered = puzzle.questions.every(q => !!state.selectedByQid[q.id]);

  return (
    <div className="space-y-4">
      <Card className="game-panel">
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between gap-2">
            {puzzle.title}
            <Badge variant="secondary">RC</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ScrollArea className="h-48 rounded-xl border border-border/60 bg-background/70 p-3">
            <p className="text-sm leading-6">{puzzle.passage}</p>
          </ScrollArea>

          <Separator />

          <div className="space-y-4">
            {puzzle.questions.map((q, idx) => {
              const chosen = state.selectedByQid[q.id] ?? null;
              const isCorrect = state.submitted && chosen === q.correctOptionId;
              const isWrong = state.submitted && chosen && chosen !== q.correctOptionId;

              return (
                <Card key={q.id} className="game-panel game-panel-muted p-3">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span>
                        Q{idx + 1}. {q.prompt}
                      </span>
                      {state.submitted && (
                        <>
                          {isCorrect && (
                            <Badge className="gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Correct
                            </Badge>
                          )}
                          {isWrong && (
                            <Badge variant="destructive" className="gap-1">
                              <XCircle className="h-3.5 w-3.5" /> Incorrect
                            </Badge>
                          )}
                        </>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid gap-2">
                      {q.options.map(opt => {
                        const selected = chosen === opt.id;
                        const showCorrect = state.submitted && opt.id === q.correctOptionId;

                        return (
                          <Button
                            key={opt.id}
                            type="button"
                            variant={selected ? "default" : "outline"}
                            className="justify-start h-auto whitespace-normal text-left"
                            onClick={() =>
                              dispatch({
                                type: "select",
                                qid: q.id,
                                optionId: opt.id,
                              })
                            }
                            aria-pressed={selected}
                          >
                            <span className="mr-2 font-semibold">{opt.id.toUpperCase()}.</span>
                            <span className="flex-1">{opt.text}</span>
                            {showCorrect && state.submitted && (
                              <Badge variant="secondary" className="ml-2">
                                Answer
                              </Badge>
                            )}
                          </Button>
                        );
                      })}
                    </div>

                    {state.submitted && <p className="text-xs text-muted-foreground pt-2">{q.explanation}</p>}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="game-action-row">
            <Button type="button" onClick={() => dispatch({ type: "submit" })} disabled={!allAnswered} size="sm">
              Submit
            </Button>
            <Button type="button" variant="outline" onClick={() => dispatch({ type: "reset" })} size="sm">
              Edit
            </Button>
          </div>

          {!allAnswered && !state.submitted && <p className="game-helper">Answer all questions to submit.</p>}
        </CardContent>
      </Card>
    </div>
  );
};
