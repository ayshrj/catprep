"use client";

import React, { useEffect, useMemo, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { KenKenAction, KenKenCell, KenKenPuzzle, KenKenState } from "./types";

type Props = {
  puzzle: KenKenPuzzle;
  state: KenKenState;
  dispatch: React.Dispatch<KenKenAction>;
};

function buildCageMaps(puzzle: KenKenPuzzle) {
  const cellToCageId = new Map<string, string>();
  const cageById = new Map<string, (typeof puzzle.cages)[number]>();
  const anchorByCageId = new Map<string, KenKenCell>();

  for (const cage of puzzle.cages) {
    cageById.set(cage.id, cage);
    const sorted = cage.cells.slice().sort((a, b) => a.r - b.r || a.c - b.c);
    anchorByCageId.set(cage.id, sorted[0]);

    for (const cell of cage.cells) {
      cellToCageId.set(`${cell.r},${cell.c}`, cage.id);
    }
  }
  return { cellToCageId, cageById, anchorByCageId };
}

export const KenKenUI: React.FC<Props> = ({ puzzle, state, dispatch }) => {
  const n = puzzle.size;
  const { cellToCageId, cageById, anchorByCageId } = useMemo(() => buildCageMaps(puzzle), [puzzle]);

  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => rootRef.current?.focus(), []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const { r, c } = state.selected;
    let nr = r,
      nc = c;

    if (e.key === "ArrowUp") {
      e.preventDefault();
      nr = Math.max(0, r - 1);
      dispatch({ type: "select", r: nr, c });
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      nr = Math.min(n - 1, r + 1);
      dispatch({ type: "select", r: nr, c });
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      nc = Math.max(0, c - 1);
      dispatch({ type: "select", r, c: nc });
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      nc = Math.min(n - 1, c + 1);
      dispatch({ type: "select", r, c: nc });
    } else if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") {
      e.preventDefault();
      dispatch({ type: "clear", r, c });
    } else if (e.key.toLowerCase() === "p") {
      e.preventDefault();
      dispatch({ type: "togglePencilMode" });
    } else {
      // numbers 1..n
      const num = parseInt(e.key, 10);
      if (!Number.isNaN(num) && num >= 1 && num <= n) {
        e.preventDefault();
        if (state.pencilMode) dispatch({ type: "togglePencil", r, c, value: num });
        else dispatch({ type: "set", r, c, value: num });
      }
    }
  };

  const numberSize =
    n <= 4
      ? "text-[clamp(14px,3.4vw,22px)]"
      : n === 5
        ? "text-[clamp(12px,3vw,20px)]"
        : "text-[clamp(11px,2.6vw,18px)]";
  const pencilSize = "text-[clamp(9px,2vw,12px)]";
  const cageSize = "text-[clamp(9px,1.8vw,12px)]";

  return (
    <div ref={rootRef} tabIndex={0} onKeyDown={onKeyDown} className="outline-none">
      <div className="flex flex-col gap-3">
        <div className="game-toolbar">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant={state.pencilMode ? "default" : "secondary"}
                  onClick={() => dispatch({ type: "togglePencilMode" })}
                >
                  Pencil {state.pencilMode ? "On" : "Off"}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-xs">Keyboard: P toggles pencil mode</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="game-helper">Arrow keys move • 1-{n} enter • Backspace clears</div>
        </div>

        <div className="game-panel game-panel-muted p-3">
          <div className="game-grid-wrap">
            <div className="mx-auto w-full max-w-[520px] sm:max-w-[560px] md:max-w-[620px]">
              <div className="aspect-square w-full">
                <div
                  role="grid"
                  aria-label="KenKen grid"
                  className="grid h-full w-full"
                  style={{
                    gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${n}, minmax(0, 1fr))`,
                  }}
                >
                  {Array.from({ length: n }).map((_, r) =>
                    Array.from({ length: n }).map((__, c) => {
                      const isSelected = state.selected.r === r && state.selected.c === c;
                      const v = state.grid[r][c];

                      const cageId = cellToCageId.get(`${r},${c}`)!;
                      const cage = cageById.get(cageId)!;
                      const anchor = anchorByCageId.get(cageId)!;
                      const isAnchor = anchor.r === r && anchor.c === c;

                      // Light cage borders: thicker where cage boundary changes
                      const leftCage = c > 0 ? cellToCageId.get(`${r},${c - 1}`) : null;
                      const topCage = r > 0 ? cellToCageId.get(`${r - 1},${c}`) : null;
                      const rightCage = c < n - 1 ? cellToCageId.get(`${r},${c + 1}`) : null;
                      const bottomCage = r < n - 1 ? cellToCageId.get(`${r + 1},${c}`) : null;

                      const borderL = leftCage !== cageId ? "border-l-2" : "border-l";
                      const borderT = topCage !== cageId ? "border-t-2" : "border-t";
                      const borderR = rightCage !== cageId ? "border-r-2" : "border-r";
                      const borderB = bottomCage !== cageId ? "border-b-2" : "border-b";

                      const label = cage.op === "=" ? `${cage.target}` : `${cage.target}${cage.op}`;

                      return (
                        <button
                          key={`${r}-${c}`}
                          role="gridcell"
                          aria-label={`Row ${r + 1} Column ${c + 1}`}
                          onClick={() => dispatch({ type: "select", r, c })}
                          className={[
                            "relative flex items-center justify-center rounded-md",
                            "border-border/70 bg-background",
                            "aspect-square w-full h-full",
                            borderL,
                            borderT,
                            borderR,
                            borderB,
                            isSelected ? "bg-accent/40 border-primary/60" : "",
                          ].join(" ")}
                        >
                          {isAnchor && (
                            <div className={`absolute left-1 top-1 text-muted-foreground leading-none ${cageSize}`}>
                              {label}
                            </div>
                          )}
                          {v !== 0 ? (
                            <span className={`font-semibold ${numberSize}`}>{v}</span>
                          ) : state.pencil[r][c].length ? (
                            <span className={`text-muted-foreground px-1 text-center ${pencilSize}`}>
                              {state.pencil[r][c].join(" ")}
                            </span>
                          ) : null}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-3" />

          {/* Mobile-friendly keypad */}
          <div className="game-action-row">
            {Array.from({ length: n }, (_, i) => i + 1).map(num => (
              <Button
                key={num}
                size="sm"
                variant="outline"
                onClick={() => {
                  const { r, c } = state.selected;
                  if (state.pencilMode) dispatch({ type: "togglePencil", r, c, value: num });
                  else dispatch({ type: "set", r, c, value: num });
                }}
              >
                {num}
              </Button>
            ))}
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                const { r, c } = state.selected;
                dispatch({ type: "clear", r, c });
              }}
            >
              Clear
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
