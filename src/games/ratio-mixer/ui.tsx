"use client";

import { CheckCircle2, Minus, Plus } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

import type { RatioMixerAction, RatioMixerPuzzle, RatioMixerState } from "./types";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export const RatioMixerUI: React.FC<{
  puzzle: RatioMixerPuzzle;
  state: RatioMixerState;
  dispatch: React.Dispatch<RatioMixerAction>;
}> = ({ puzzle, state, dispatch }) => {
  const pct = clamp(state.percentA, 0, 100);

  return (
    <div className="space-y-4">
      <Card className="game-panel">
        <CardHeader>
          <CardTitle className="text-base">Ratio Mixer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">{puzzle.scenario}</p>
          <Separator />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="game-panel game-panel-muted p-3">
              <div className="text-xs text-muted-foreground">Solution A</div>
              <div className="text-lg font-semibold">{puzzle.aPercent}%</div>
            </div>
            <div className="game-panel game-panel-muted p-3">
              <div className="text-xs text-muted-foreground">Solution B</div>
              <div className="text-lg font-semibold">{puzzle.bPercent}%</div>
            </div>
            <div className="game-panel game-panel-muted p-3">
              <div className="text-xs text-muted-foreground">Target</div>
              <div className="text-lg font-semibold">{puzzle.targetPercent}%</div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="font-medium">Choose % of A</div>
              <div className="text-muted-foreground">{pct}%</div>
            </div>

            {/* Accessible range input */}
            <input
              aria-label="Percent of A"
              type="range"
              min={0}
              max={100}
              value={pct}
              onChange={e => dispatch({ type: "setPercentA", value: Number(e.target.value) })}
              className="w-full"
            />
            <Progress value={pct} />

            <div className="game-action-row">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => dispatch({ type: "nudgePercentA", delta: -1 })}
                aria-label="Decrease percent of A"
              >
                <Minus className="h-4 w-4" />
              </Button>

              <Input
                className="w-24"
                inputMode="numeric"
                value={pct}
                onChange={e =>
                  dispatch({
                    type: "setPercentA",
                    value: Number(e.target.value),
                  })
                }
                aria-label="Percent A numeric input"
              />

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => dispatch({ type: "nudgePercentA", delta: +1 })}
                aria-label="Increase percent of A"
              >
                <Plus className="h-4 w-4" />
              </Button>

              <Button type="button" onClick={() => dispatch({ type: "submit" })} size="sm">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Submit
              </Button>

              <Button type="button" variant="outline" onClick={() => dispatch({ type: "reset" })} size="sm">
                Reset
              </Button>
            </div>

            <p className="game-helper">CAT benefit: trains alligation/ratio intuition under time pressure.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
