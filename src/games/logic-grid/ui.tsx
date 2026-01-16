"use client";

import { Check, HelpCircle, Minus, X } from "lucide-react";
import React, { useEffect, useRef } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import { LogicCellMark, LogicGridAction, LogicGridPuzzle, LogicGridState } from "./types";

type Props = {
  puzzle: LogicGridPuzzle;
  state: LogicGridState;
  dispatch: React.Dispatch<LogicGridAction>;
};

function iconFor(mark: LogicCellMark, className: string) {
  if (mark === "yes") return <Check className={className} aria-hidden />;
  if (mark === "no") return <X className={className} aria-hidden />;
  if (mark === "maybe") return <HelpCircle className={className} aria-hidden />;
  return <Minus className={`${className} opacity-30`} aria-hidden />;
}

export const LogicGridUI: React.FC<Props> = ({ puzzle, state, dispatch }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => rootRef.current?.focus(), []);

  const R = puzzle.rowCategory.items.length;
  const C = puzzle.colCategory.items.length;
  const cellStyle = { width: "clamp(28px, 8vw, 44px)", height: "clamp(28px, 8vw, 44px)" };
  const iconClass = "w-[clamp(12px,2.4vw,16px)] h-[clamp(12px,2.4vw,16px)]";

  const onKeyDown = (e: React.KeyboardEvent) => {
    const { r, c } = state.selected;

    if (e.key === "ArrowUp") {
      e.preventDefault();
      dispatch({ type: "select", r: Math.max(0, r - 1), c });
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      dispatch({ type: "select", r: Math.min(R - 1, r + 1), c });
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      dispatch({ type: "select", r, c: Math.max(0, c - 1) });
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      dispatch({ type: "select", r, c: Math.min(C - 1, c + 1) });
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      dispatch({ type: "cycle", r, c });
    } else if (e.key.toLowerCase() === "y") {
      e.preventDefault();
      dispatch({ type: "setMark", r, c, mark: "yes" });
    } else if (e.key.toLowerCase() === "n") {
      e.preventDefault();
      dispatch({ type: "setMark", r, c, mark: "no" });
    } else if (e.key.toLowerCase() === "m") {
      e.preventDefault();
      dispatch({ type: "setMark", r, c, mark: "maybe" });
    } else if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      dispatch({ type: "setMark", r, c, mark: "blank" });
    }
  };

  return (
    <div ref={rootRef} tabIndex={0} onKeyDown={onKeyDown} className="outline-none">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="game-panel p-3 overflow-auto">
          <div className="game-helper mb-2">Arrow keys move • Space cycles • Y/N/M set mark</div>

          <table className="border-collapse min-w-full">
            <thead>
              <tr>
                <th className="text-left text-[clamp(10px,2.2vw,12px)] text-muted-foreground p-2">
                  {puzzle.rowCategory.name} \ {puzzle.colCategory.name}
                </th>
                {puzzle.colCategory.items.map((col, ci) => (
                  <th key={ci} className="text-[clamp(10px,2.2vw,12px)] p-2 text-left">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {puzzle.rowCategory.items.map((row, ri) => (
                <tr key={ri} className="border-t">
                  <td className="p-2 text-[clamp(11px,2.4vw,14px)] font-medium">{row}</td>
                  {puzzle.colCategory.items.map((_, ci) => {
                    const isSel = state.selected.r === ri && state.selected.c === ci;
                    const mark = state.marks[ri][ci];
                    return (
                      <td key={ci} className="p-1">
                        <button
                          type="button"
                          role="gridcell"
                          aria-label={`${row} vs ${puzzle.colCategory.items[ci]}: ${mark}`}
                          onClick={() => {
                            dispatch({ type: "select", r: ri, c: ci });
                            dispatch({ type: "cycle", r: ri, c: ci });
                          }}
                          className={[
                            "rounded-md border border-border/70 flex items-center justify-center",
                            "bg-background",
                            isSel ? "border-primary/60 bg-accent/30" : "",
                          ].join(" ")}
                          style={cellStyle}
                        >
                          {iconFor(mark, iconClass)}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="game-panel">
          <CardHeader>
            <CardTitle className="text-base">Clues + Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <div className="font-medium mb-2">Clues</div>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {puzzle.clues.map((c, idx) => (
                  <li key={idx}>{c}</li>
                ))}
              </ul>
            </div>

            <Separator />

            <div className="text-sm">
              <div className="font-medium mb-2">Notes</div>
              <Textarea
                value={state.notes}
                onChange={e => dispatch({ type: "setNotes", notes: e.target.value })}
                placeholder="Write deductions here (e.g., 'If Om not Delhi/Kolkata, then...')"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
