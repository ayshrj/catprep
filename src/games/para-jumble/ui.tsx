"use client";

import { ArrowDown, ArrowUp, CheckCircle2, GripVertical } from "lucide-react";
import React, { useMemo, useRef } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import type { ParaJumbleAction, ParaJumblePuzzle, ParaJumbleState } from "./types";

export const ParaJumbleUI: React.FC<{
  puzzle: ParaJumblePuzzle;
  state: ParaJumbleState;
  dispatch: React.Dispatch<ParaJumbleAction>;
}> = ({ puzzle, state, dispatch }) => {
  const draggingFrom = useRef<number | null>(null);

  const orderedSentences = useMemo(
    () => state.order.map(idx => ({ idx, text: puzzle.sentences[idx] })),
    [state.order, puzzle.sentences]
  );

  function onDragStart(pos: number) {
    draggingFrom.current = pos;
  }

  function onDrop(to: number) {
    const from = draggingFrom.current;
    draggingFrom.current = null;
    if (from == null) return;
    dispatch({ type: "reorder", from, to });
  }

  return (
    <div className="space-y-4">
      <Card className="game-panel">
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            {puzzle.title}
            <Badge variant="secondary">Para-jumble</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="game-helper">
            Reorder the sentences to form a coherent paragraph. Drag or use arrows. (Keyboard: focus an item and use
            Alt+↑ / Alt+↓)
          </p>

          <Separator />

          <ScrollArea className="h-[260px] sm:h-72 pr-2">
            <div className="space-y-2">
              {orderedSentences.map((s, pos) => {
                const isFocused = pos === state.focusedIndex;

                return (
                  <div
                    key={s.idx}
                    className={`game-panel game-panel-muted p-3 flex gap-2 items-start ${
                      isFocused ? "border-primary/40 bg-accent/20" : ""
                    }`}
                    draggable
                    onDragStart={() => onDragStart(pos)}
                    onDragOver={e => e.preventDefault()}
                    onDrop={() => onDrop(pos)}
                    tabIndex={0}
                    onFocus={() => dispatch({ type: "setFocused", index: pos })}
                    onKeyDown={e => {
                      if (!e.altKey) return;
                      if (e.key === "ArrowUp") {
                        e.preventDefault();
                        dispatch({
                          type: "reorder",
                          from: pos,
                          to: Math.max(0, pos - 1),
                        });
                      }
                      if (e.key === "ArrowDown") {
                        e.preventDefault();
                        dispatch({
                          type: "reorder",
                          from: pos,
                          to: Math.min(state.order.length - 1, pos + 1),
                        });
                      }
                    }}
                    aria-label={`Sentence position ${pos + 1}`}
                  >
                    <div className="mt-0.5 text-muted-foreground">
                      <GripVertical className="h-4 w-4" aria-hidden="true" />
                    </div>

                    <div className="flex-1 text-sm leading-6">
                      <div className="text-xs text-muted-foreground mb-1">#{pos + 1}</div>
                      {s.text}
                    </div>

                    <div className="flex flex-col gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        onClick={() =>
                          dispatch({
                            type: "reorder",
                            from: pos,
                            to: Math.max(0, pos - 1),
                          })
                        }
                        disabled={pos === 0}
                        aria-label="Move up"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        onClick={() =>
                          dispatch({
                            type: "reorder",
                            from: pos,
                            to: Math.min(state.order.length - 1, pos + 1),
                          })
                        }
                        disabled={pos === state.order.length - 1}
                        aria-label="Move down"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <div className="game-action-row">
            <Button type="button" size="sm" onClick={() => dispatch({ type: "submit" })}>
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Check Order
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
