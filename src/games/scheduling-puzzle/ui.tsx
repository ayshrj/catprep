"use client";

import React, { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import { constraintsAsText } from "./generator";
import type { SchedulingAction, SchedulingPuzzle, SchedulingState } from "./types";

type Props = {
  puzzle: SchedulingPuzzle;
  state: SchedulingState;
  dispatch: React.Dispatch<SchedulingAction>;
};

export const SchedulingUI: React.FC<Props> = ({ puzzle, state, dispatch }) => {
  const constraintsText = useMemo(() => constraintsAsText(puzzle), [puzzle]);

  const availableItems = puzzle.items;

  return (
    <div className="space-y-4">
      <div className="game-toolbar justify-between">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="secondary" size="sm">
              Rules + CAT mapping
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>How to solve (CAT DILR style)</DialogTitle>
            </DialogHeader>
            <div className="text-sm space-y-2">
              <p>
                Treat slots as an ordered timeline. Convert each constraint into table restrictions: fixed positions,
                relative order, adjacency, and exclusions. Avoid guessing—commit only when forced.
              </p>
              <p className="text-muted-foreground">
                This mirrors CAT scheduling/arrangement sets: build a timeline, apply constraints, and eliminate
                systematically.
              </p>
            </div>
          </DialogContent>
        </Dialog>

        <div className="game-helper">Tip: Fill a few forced slots first; then resolve adjacency/ordering.</div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="game-panel">
          <CardHeader>
            <CardTitle className="text-base">Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {puzzle.slots.map((slotName, idx) => {
              const selected = idx === state.selectedSlot;
              const chosen = state.assignment[idx];

              return (
                <div
                  key={idx}
                  className={[
                    "flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-background/70 p-2",
                    selected ? "border-primary/60 bg-accent/30" : "",
                  ].join(" ")}
                  onClick={() => dispatch({ type: "selectSlot", slot: idx })}
                >
                  <div className="text-sm font-medium">{slotName}</div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline">
                        {chosen ?? "Select"}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Assign</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => dispatch({ type: "setSlot", slot: idx, item: null })}>
                        (Empty)
                      </DropdownMenuItem>
                      {availableItems.map(it => (
                        <DropdownMenuItem key={it} onClick={() => dispatch({ type: "setSlot", slot: idx, item: it })}>
                          {it}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="game-panel">
          <CardHeader>
            <CardTitle className="text-base">Constraints + Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <div className="font-medium mb-2">Constraints</div>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {constraintsText.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>

            <Separator />

            <div className="text-sm">
              <div className="font-medium mb-2">Notes</div>
              <Textarea
                value={state.notes}
                onChange={e => dispatch({ type: "setNotes", notes: e.target.value })}
                placeholder="Write deductions: fixed slots, possible positions, adjacency blocks..."
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
