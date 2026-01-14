"use client";
import React, { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";

import { SudokuAction, SudokuPuzzle, SudokuState } from "./types";

export const SudokuUI: React.FC<{
  puzzle: SudokuPuzzle;
  state: SudokuState;
  dispatch: React.Dispatch<SudokuAction>;
}> = ({ puzzle, state, dispatch }) => {
  const { grid, pencilMarks, selectedCell, pencilMode } = state;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current?.focus(); // focus the grid container for keyboard events
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const { row, col } = state.selectedCell;
    let newRow = row,
      newCol = col;
    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        newRow = row > 0 ? row - 1 : row;
        dispatch({ type: "selectCell", row: newRow, col });
        break;
      case "ArrowDown":
        e.preventDefault();
        newRow = row < 8 ? row + 1 : row;
        dispatch({ type: "selectCell", row: newRow, col });
        break;
      case "ArrowLeft":
        e.preventDefault();
        newCol = col > 0 ? col - 1 : col;
        dispatch({ type: "selectCell", row, col: newCol });
        break;
      case "ArrowRight":
        e.preventDefault();
        newCol = col < 8 ? col + 1 : col;
        dispatch({ type: "selectCell", row, col: newCol });
        break;
      case "Backspace":
      case "Delete":
      case "0":
        e.preventDefault();
        dispatch({ type: "clearValue", row, col });
        break;
      case "p":
      case "P":
        e.preventDefault();
        dispatch({ type: "togglePencilMode" });
        break;
      default:
        if (/^[1-9]$/.test(e.key)) {
          e.preventDefault();
          const value = parseInt(e.key);
          if (pencilMode) {
            dispatch({ type: "togglePencil", row, col, value });
          } else {
            dispatch({ type: "setValue", row, col, value });
          }
        }
        break;
    }
  };

  const handleNumberClick = (value: number) => {
    const { row, col } = state.selectedCell;
    if (row < 0 || col < 0) return;
    if (state.fixed[row][col]) return;
    if (state.pencilMode) {
      dispatch({ type: "togglePencil", row, col, value });
    } else {
      dispatch({ type: "setValue", row, col, value });
    }
  };

  const handleClear = () => {
    const { row, col } = state.selectedCell;
    if (row < 0 || col < 0) return;
    dispatch({ type: "clearValue", row, col });
  };

  const cellStyle = { width: "clamp(28px, 9vw, 48px)", height: "clamp(28px, 9vw, 48px)" };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="game-panel game-panel-padded space-y-4 outline-none"
    >
      <div className="game-toolbar">
        <Button
          size="sm"
          variant={pencilMode ? "default" : "secondary"}
          onClick={() => dispatch({ type: "togglePencilMode" })}
        >
          Pencil {pencilMode ? "On" : "Off"} (P)
        </Button>
        <Button size="sm" variant="outline" onClick={handleClear}>
          Clear (Del)
        </Button>
        <div className="game-helper">Arrows move • 1-9 input • P pencil • Del clear</div>
      </div>

      <div className="game-grid-wrap">
        <div className="mx-auto inline-grid" style={{ gridTemplateColumns: `repeat(9, minmax(0, 1fr))` }}>
          {grid.map((rowVals, r) =>
            rowVals.map((val, c) => {
              const isSelected = r === selectedCell.row && c === selectedCell.col;
              const isFixed = puzzle.initialGrid[r][c] !== 0;
              const userFilled = !isFixed && val !== 0;
              const cellPencils = pencilMarks[r][c];

              const borderL = c % 3 === 0 ? "border-l-2" : "border-l";
              const borderT = r % 3 === 0 ? "border-t-2" : "border-t";
              const borderR = c === 8 ? "border-r-2" : "border-r";
              const borderB = r === 8 ? "border-b-2" : "border-b";

              return (
                <button
                  key={`${r}-${c}`}
                  className={[
                    "relative flex items-center justify-center bg-background",
                    "text-center align-middle border-border/70",
                    borderL,
                    borderT,
                    borderR,
                    borderB,
                    isSelected ? "bg-accent/40 border-primary/60" : "",
                    isFixed ? "font-semibold text-foreground" : "",
                    userFilled ? "text-primary" : "",
                  ].join(" ")}
                  style={cellStyle}
                  onClick={() => dispatch({ type: "selectCell", row: r, col: c })}
                >
                  {val !== 0 ? (
                    <span className="text-lg">{val}</span>
                  ) : cellPencils.length ? (
                    <span className="text-[10px] leading-tight text-muted-foreground px-1">
                      {cellPencils.join(" ")}
                    </span>
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-9 gap-2 max-w-md">
        {Array.from({ length: 9 }).map((_, idx) => {
          const val = idx + 1;
          return (
            <Button key={val} size="sm" variant="secondary" onClick={() => handleNumberClick(val)}>
              {val}
            </Button>
          );
        })}
      </div>
    </div>
  );
};
