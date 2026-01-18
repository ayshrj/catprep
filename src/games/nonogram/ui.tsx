"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import type { NonogramAction, NonogramMark, NonogramPuzzle, NonogramState } from "./types";

type Props = {
  puzzle: NonogramPuzzle;
  state: NonogramState;
  dispatch: React.Dispatch<NonogramAction>;
};

export const NonogramUI: React.FC<Props> = ({ puzzle, state, dispatch }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => rootRef.current?.focus(), []);

  const H = puzzle.height;
  const W = puzzle.width;

  const [tool, setTool] = useState<NonogramMark>("fill");
  const isPointerDownRef = useRef(false);
  const lastCellRef = useRef<string | null>(null);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const { r, c } = state.selected;

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
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      dispatch({ type: "cycle", r, c });
    } else if (e.key.toLowerCase() === "f") {
      e.preventDefault();
      setTool("fill");
      dispatch({ type: "set", r, c, mark: "fill" });
    } else if (e.key.toLowerCase() === "x") {
      e.preventDefault();
      setTool("x");
      dispatch({ type: "set", r, c, mark: "x" });
    } else if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      setTool("blank");
      dispatch({ type: "set", r, c, mark: "blank" });
    }
  };

  const maxRow = useMemo(() => Math.max(...puzzle.rowClues.map(a => a.length)), [puzzle.rowClues]);
  const maxCol = useMemo(() => Math.max(...puzzle.colClues.map(a => a.length)), [puzzle.colClues]);
  const totalRows = maxCol + H;
  const totalCols = maxRow + W;

  const rowClueAt = useCallback(
    (r: number, clueCol: number) => {
      const line = puzzle.rowClues[r];
      const offset = maxRow - line.length;
      const idx = clueCol - offset;
      if (idx < 0 || idx >= line.length) return null;
      return line[idx] === 0 ? null : line[idx];
    },
    [maxRow, puzzle.rowClues]
  );

  const colClueAt = useCallback(
    (c: number, clueRow: number) => {
      const line = puzzle.colClues[c];
      const offset = maxCol - line.length;
      const idx = clueRow - offset;
      if (idx < 0 || idx >= line.length) return null;
      return line[idx] === 0 ? null : line[idx];
    },
    [maxCol, puzzle.colClues]
  );

  const applyMark = useCallback(
    (r: number, c: number, mark: NonogramMark) => {
      dispatch({ type: "select", r, c });
      dispatch({ type: "set", r, c, mark });
    },
    [dispatch]
  );

  const handlePointerUp = useCallback(() => {
    isPointerDownRef.current = false;
    lastCellRef.current = null;
  }, []);

  const handlePointerDownCell = useCallback(
    (r: number, c: number) => {
      isPointerDownRef.current = true;
      lastCellRef.current = `${r},${c}`;
      applyMark(r, c, tool);
    },
    [applyMark, tool]
  );

  const handlePointerMoveCell = useCallback(
    (r: number, c: number) => {
      if (!isPointerDownRef.current) return;
      const key = `${r},${c}`;
      if (lastCellRef.current === key) return;
      lastCellRef.current = key;
      applyMark(r, c, tool);
    },
    [applyMark, tool]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isPointerDownRef.current) return;
      if (e.touches.length === 0) return;
      const touch = e.touches[0];
      const elem = document.elementFromPoint(touch.clientX, touch.clientY);
      if (!elem) return;
      const rowAttr = elem.getAttribute("data-row");
      const colAttr = elem.getAttribute("data-col");
      if (rowAttr == null || colAttr == null) return;
      handlePointerMoveCell(Number(rowAttr), Number(colAttr));
    },
    [handlePointerMoveCell]
  );

  return (
    <div
      ref={rootRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="game-panel game-panel-padded outline-none"
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="game-toolbar justify-between">
        <div className="game-action-row">
          <Button size="sm" variant={tool === "fill" ? "default" : "secondary"} onClick={() => setTool("fill")}>
            Fill
          </Button>
          <Button size="sm" variant={tool === "x" ? "default" : "secondary"} onClick={() => setTool("x")}>
            Mark X
          </Button>
          <Button size="sm" variant={tool === "blank" ? "default" : "outline"} onClick={() => setTool("blank")}>
            Erase
          </Button>
        </div>
        <div className="game-helper">Drag to paint • Keyboard: arrows • Space cycle • F fill • X mark • Del clear</div>
      </div>

      <Separator className="my-3" />

      <div className="w-full max-w-2xl mx-auto">
        <div
          className="w-full"
          style={{
            aspectRatio: `${totalCols} / ${totalRows}`,
          }}
        >
          <div
            className="grid w-full h-full select-none"
            style={{
              touchAction: "none",
              gridTemplateRows: `repeat(${totalRows}, minmax(0, 1fr))`,
              gridTemplateColumns: `repeat(${totalCols}, minmax(0, 1fr))`,
            }}
            onTouchMove={handleTouchMove}
          >
            {/* Top clue rows */}
            {Array.from({ length: maxCol }).map((_, clueRow) => (
              <React.Fragment key={`top-${clueRow}`}>
                {Array.from({ length: maxRow }).map((__, clueCol) => (
                  <div
                    key={`corner-${clueRow}-${clueCol}`}
                    className={[
                      "border-r border-b border-border bg-muted/60",
                      clueCol === 0 ? "border-l border-border" : "border-l border-transparent",
                      clueRow === 0 ? "border-t border-border" : "border-t border-transparent",
                      clueCol === maxRow - 1 ? "border-r border-border" : "",
                      clueRow === maxCol - 1 ? "border-b border-border" : "",
                      clueRow === 0 && clueCol === 0 ? "rounded-tl-2xl" : "",
                    ].join(" ")}
                  />
                ))}
                {Array.from({ length: W }).map((__, c) => {
                  const clue = colClueAt(c, clueRow);
                  return (
                    <div
                      key={`colclue-${clueRow}-${c}`}
                      className={[
                        "border-r border-b border-border flex items-center justify-center text-xs",
                        clue != null ? "bg-muted font-semibold text-foreground" : "bg-background text-muted-foreground",
                        clueRow === 0 ? "border-t border-border" : "border-t border-transparent",
                        c === W - 1 ? "border-r border-border rounded-tr-2xl" : "",
                      ].join(" ")}
                    >
                      {clue ?? ""}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}

            {/* Row clues + playable cells */}
            {Array.from({ length: H }).map((_, r) => (
              <React.Fragment key={`row-${r}`}>
                {Array.from({ length: maxRow }).map((__, clueCol) => {
                  const clue = rowClueAt(r, clueCol);
                  return (
                    <div
                      key={`rowclue-${r}-${clueCol}`}
                      className={[
                        "border-r border-b border-border flex items-center justify-center text-xs",
                        clue != null ? "bg-muted font-semibold text-foreground" : "bg-background text-muted-foreground",
                        clueCol === 0 ? "border-l border-border" : "border-l border-transparent",
                        r === H - 1 && clueCol === 0 ? "rounded-bl-2xl" : "",
                      ].join(" ")}
                    >
                      {clue ?? ""}
                    </div>
                  );
                })}

                {Array.from({ length: W }).map((__, c) => {
                  const mark = state.marks[r][c];
                  const isSel = state.selected.r === r && state.selected.c === c;
                  return (
                    <div
                      key={`cell-${r}-${c}`}
                      data-row={r}
                      data-col={c}
                      className={[
                        "relative border-r border-b border-border bg-background",
                        "cursor-pointer",
                        isSel ? "bg-accent/40" : "",
                        r === H - 1 && c === W - 1 ? "rounded-br-2xl" : "",
                      ].join(" ")}
                      onPointerDown={() => handlePointerDownCell(r, c)}
                      onPointerMove={() => handlePointerMoveCell(r, c)}
                      onTouchStart={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        handlePointerDownCell(r, c);
                      }}
                      onTouchEnd={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        handlePointerUp();
                      }}
                      role="gridcell"
                      aria-label={`Row ${r + 1} Col ${c + 1}: ${mark}`}
                    >
                      {mark === "fill" && (
                        <div
                          className={[
                            "absolute inset-0 bg-foreground",
                            r === H - 1 && c === W - 1 ? "rounded-br-2xl" : "",
                          ].join(" ")}
                        />
                      )}
                      {mark === "x" && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm sm:text-base font-semibold text-muted-foreground">×</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
