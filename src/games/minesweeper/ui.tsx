"use client";

import { Bomb, Flag, Square } from "lucide-react";
import React, { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";

import type { MinesweeperAction, MinesweeperPuzzle, MinesweeperState } from "./types";

type Props = {
  puzzle: MinesweeperPuzzle;
  state: MinesweeperState;
  dispatch: React.Dispatch<MinesweeperAction>;
};

export const MinesweeperUI: React.FC<Props> = ({ puzzle, state, dispatch }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => rootRef.current?.focus(), []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const { r, c } = state.selected;
    const H = puzzle.height;
    const W = puzzle.width;

    if (e.key === "ArrowUp") {
      e.preventDefault();
      dispatch({ type: "select", r: Math.max(0, r - 1), c });
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      dispatch({ type: "select", r: Math.min(H - 1, r + 1), c });
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      dispatch({ type: "select", r, c: Math.max(0, c - 1) });
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      dispatch({ type: "select", r, c: Math.min(W - 1, c + 1) });
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      dispatch({ type: "reveal", r, c });
    } else if (e.key.toLowerCase() === "f") {
      e.preventDefault();
      dispatch({ type: "toggleFlag", r, c });
    } else if (e.key.toLowerCase() === "m") {
      e.preventDefault();
      dispatch({ type: "toggleTouchMode" });
    }
  };

  const handleCellClick = (r: number, c: number) => {
    dispatch({ type: "select", r, c });
    if (state.touchMode === "flag") dispatch({ type: "toggleFlag", r, c });
    else dispatch({ type: "reveal", r, c });
  };

  const cellPx = puzzle.width <= 9 ? "w-9 h-9" : puzzle.width <= 12 ? "w-8 h-8" : "w-7 h-7";

  return (
    <div ref={rootRef} tabIndex={0} onKeyDown={onKeyDown} className="game-panel game-panel-padded outline-none">
      <div className="game-toolbar mb-3">
        <Button size="sm" variant="secondary" onClick={() => dispatch({ type: "toggleTouchMode" })}>
          Mode: {state.touchMode === "reveal" ? "Reveal" : "Flag"}
        </Button>
        <div className="game-helper">Keyboard: arrows • Enter reveal • F flag • M mode</div>
      </div>

      <div className="game-grid-wrap">
        <div
          role="grid"
          aria-label="Minesweeper grid"
          className="inline-grid"
          style={{
            gridTemplateColumns: `repeat(${puzzle.width}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: puzzle.height }).map((_, r) =>
            Array.from({ length: puzzle.width }).map((__, c) => {
              const isSel = state.selected.r === r && state.selected.c === c;
              const revealed = state.revealed[r][c];
              const flagged = state.flagged[r][c];
              const mine = state.initialized ? state.mines[r][c] : false;
              const num = state.initialized ? state.numbers[r][c] : 0;

              let content: React.ReactNode = null;
              if (revealed) {
                if (mine) content = <Bomb className="w-4 h-4" aria-hidden />;
                else if (num > 0) content = <span className="text-xs font-semibold">{num}</span>;
                else content = <Square className="w-3 h-3 opacity-20" aria-hidden />;
              } else if (flagged) {
                content = <Flag className="w-4 h-4" aria-hidden />;
              }

              return (
                <button
                  key={`${r}-${c}`}
                  role="gridcell"
                  aria-label={`Row ${r + 1} Column ${c + 1} ${
                    revealed ? "revealed" : "hidden"
                  }${flagged ? " flagged" : ""}`}
                  className={[
                    "m-0.5 rounded-md border flex items-center justify-center",
                    cellPx,
                    revealed ? "bg-muted" : "bg-background hover:bg-muted/40",
                    isSel ? "border-primary/60" : "",
                    isSel && !revealed ? "bg-accent/30" : "",
                    state.status !== "inProgress" ? "opacity-90" : "",
                  ].join(" ")}
                  onClick={() => handleCellClick(r, c)}
                  onContextMenu={e => {
                    e.preventDefault();
                    dispatch({ type: "select", r, c });
                    dispatch({ type: "toggleFlag", r, c });
                  }}
                >
                  {content}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
