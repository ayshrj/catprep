"use client";

import { Undo2, X } from "lucide-react";
import React, { useEffect, useMemo, useRef } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import { computeCost } from "./evaluator";
import { RoutesAction, RoutesPuzzle, RoutesState } from "./types";

export const RoutesPuzzleUI: React.FC<{
  puzzle: RoutesPuzzle;
  state: RoutesState;
  dispatch: React.Dispatch<RoutesAction>;
}> = ({ puzzle, state, dispatch }) => {
  const nodeMap = useMemo(() => new Map(puzzle.nodes.map(n => [n.id, n])), [puzzle.nodes]);
  const { cost } = useMemo(() => computeCost(puzzle, state.path), [puzzle, state.path]);
  const containerRef = useRef<HTMLDivElement>(null);

  // keyboard: Backspace to pop, Esc to clear
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      dispatch({ type: "popNode" });
    }
    if (e.key === "Escape") {
      e.preventDefault();
      dispatch({ type: "clearPath" });
    }
  };

  const width = 520;
  const height = 320;

  return (
    <div className="space-y-4" ref={containerRef} tabIndex={0} onKeyDown={onKeyDown} aria-label="Routes puzzle area">
      <Card className="game-panel">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex flex-wrap items-center gap-2">
            Start <Badge variant="secondary">{puzzle.start}</Badge> → End{" "}
            <Badge variant="secondary">{puzzle.end}</Badge>
            <span className="text-muted-foreground">|</span>
            Target Cost <Badge>{puzzle.targetCost}</Badge>
            <span className="text-muted-foreground">|</span>
            Current <Badge variant="outline">{cost}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Graph view (simple SVG + clickable nodes) */}
          <div className="w-full overflow-hidden rounded-xl border border-border/60 bg-background/70">
            <div className="relative mx-auto" style={{ width, height }}>
              <svg width={width} height={height} className="absolute inset-0">
                {puzzle.edges.map((e, idx) => {
                  const a = nodeMap.get(e.from)!;
                  const b = nodeMap.get(e.to)!;
                  const x1 = (a.x / 100) * width;
                  const y1 = (a.y / 100) * height;
                  const x2 = (b.x / 100) * width;
                  const y2 = (b.y / 100) * height;
                  const mx = (x1 + x2) / 2;
                  const my = (y1 + y2) / 2;
                  return (
                    <g key={idx}>
                      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeOpacity="0.2" strokeWidth={2} />
                      <text x={mx} y={my} fontSize={12} fill="currentColor" opacity={0.6}>
                        {e.cost}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {puzzle.nodes.map(n => {
                const left = (n.x / 100) * width;
                const top = (n.y / 100) * height;
                const active = state.path[state.path.length - 1] === n.id;
                const isStart = n.id === puzzle.start;
                const isEnd = n.id === puzzle.end;

                return (
                  <button
                    key={n.id}
                    className={[
                      "absolute -translate-x-1/2 -translate-y-1/2 rounded-full border px-3 py-2 text-sm font-semibold shadow-sm",
                      "focus:outline-none focus-visible:border-primary/60 focus-visible:bg-accent/30",
                      active ? "bg-primary text-primary-foreground" : "bg-background",
                      isStart ? "border-emerald-500" : "",
                      isEnd ? "border-primary" : "",
                    ].join(" ")}
                    style={{ left, top }}
                    onClick={() => dispatch({ type: "appendNode", nodeId: n.id })}
                    aria-label={`Add node ${n.label} to path`}
                  >
                    {n.label}
                  </button>
                );
              })}
            </div>
          </div>

          <Separator className="my-3" />

          <div className="game-toolbar">
            <div className="text-sm font-medium">Path:</div>
            {state.path.map((id, i) => (
              <Badge key={`${id}-${i}`} variant={i === state.path.length - 1 ? "default" : "secondary"}>
                {id}
              </Badge>
            ))}
            <div className="ml-auto flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => dispatch({ type: "popNode" })}>
                <Undo2 className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button size="sm" variant="outline" onClick={() => dispatch({ type: "clearPath" })}>
                <X className="mr-2 h-4 w-4" /> Clear
              </Button>
            </div>
          </div>

          <Separator className="my-3" />

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <div className="game-panel-title">Constraints</div>
              <ul className="list-disc pl-5 text-xs text-muted-foreground">
                {puzzle.constraints.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>

            <div>
              <div className="game-panel-title">Edges</div>
              <ScrollArea className="h-[120px] pr-2">
                <ul className="text-xs text-muted-foreground space-y-1">
                  {puzzle.edges.map((e, i) => (
                    <li key={i}>
                      {e.from}–{e.to}: {e.cost}
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </div>
          </div>

          <div className="mt-3 game-helper">
            Keyboard: <span className="game-kbd">Backspace</span> to backtrack, <span className="game-kbd">Esc</span> to
            clear.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
