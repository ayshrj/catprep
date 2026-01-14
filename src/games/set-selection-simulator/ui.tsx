"use client";

import React, { useEffect, useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import { SetSelectionAction, SetSelectionPuzzle, SetSelectionState } from "./types";

function pct(remaining: number, total: number) {
  if (total <= 0) return 0;
  return Math.round(((total - remaining) / total) * 100);
}

export const SetSelectionSimulatorUI: React.FC<{
  puzzle: SetSelectionPuzzle;
  state: SetSelectionState;
  dispatch: React.Dispatch<SetSelectionAction>;
}> = ({ puzzle, state, dispatch }) => {
  // internal tick timer for scan/commit phases (kept in reducer state)
  useEffect(() => {
    if (state.phase === "done") return;
    const id = window.setInterval(() => dispatch({ type: "tick" }), 1000);
    return () => window.clearInterval(id);
  }, [state.phase, dispatch]);

  const focused = useMemo(
    () => puzzle.sets.find(s => s.id === state.focusedSetId) ?? null,
    [puzzle.sets, state.focusedSetId]
  );

  const phaseLabel = state.phase === "scan" ? "Scan" : state.phase === "commit" ? "Commit" : "Done";

  const total = state.phase === "scan" ? puzzle.scanSeconds : puzzle.commitSeconds;
  const remaining = state.phase === "scan" ? state.scanRemaining : state.commitRemaining;

  const progressVal = state.phase === "done" ? 100 : pct(remaining, total);

  const shortlistCount = Object.values(state.shortlisted).filter(Boolean).length;

  return (
    <div className="space-y-4">
      <Card className="game-panel">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base">Set Selection Simulator</CardTitle>
            <Badge variant="secondary">Hybrid</Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge>{phaseLabel}</Badge>
            {state.phase !== "done" && (
              <span className="text-muted-foreground">
                Time left: <span className="font-medium">{remaining}s</span>
              </span>
            )}
            {state.phase === "scan" && <span className="text-muted-foreground">Shortlisted: {shortlistCount}</span>}
          </div>

          <Progress value={progressVal} />
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Left: set cards */}
            <div className="flex-1">
              <ScrollArea className="h-[360px] pr-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {puzzle.sets.map(s => {
                    const isFocused = state.focusedSetId === s.id;
                    const isShort = !!state.shortlisted[s.id];
                    const decision = state.decisions[s.id]?.decision;

                    return (
                      <button
                        key={s.id}
                        type="button"
                        className={[
                          "rounded-2xl border border-border/60 bg-background/70 p-3 text-left transition-colors",
                          "focus:outline-none focus-visible:border-primary/60 focus-visible:bg-accent/30",
                          isFocused ? "bg-accent border-accent" : "hover:bg-muted/60",
                        ].join(" ")}
                        onClick={() => dispatch({ type: "focus", setId: s.id })}
                        aria-pressed={isFocused}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-medium text-sm">{s.title}</div>
                          <Badge variant="secondary">{s.type}</Badge>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {s.skillTags.map(t => (
                            <Badge key={t} variant="outline" className="text-xs">
                              {t}
                            </Badge>
                          ))}
                        </div>

                        <div className="mt-2 text-xs text-muted-foreground space-y-1">
                          <div>Est: {s.estimatedMinutes} min</div>
                          <div>
                            Setup: {s.setupCost} • Computation: {s.computation} • Read: {s.readability}
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {state.phase === "scan" && (
                            <Button
                              type="button"
                              size="sm"
                              variant={isShort ? "default" : "secondary"}
                              onClick={e => {
                                e.preventDefault();
                                e.stopPropagation();
                                dispatch({ type: "toggleShortlist", setId: s.id });
                              }}
                            >
                              {isShort ? "Shortlisted" : "Shortlist"}
                            </Button>
                          )}

                          {state.phase === "commit" && (
                            <>
                              <Badge variant="outline" className="text-xs">
                                Decision: {decision ?? "—"}
                              </Badge>
                            </>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>

              <div className="game-action-row mt-3">
                {state.phase === "scan" && (
                  <Button size="sm" variant="default" onClick={() => dispatch({ type: "startCommit" })}>
                    Start Commit Now
                  </Button>
                )}
                {state.phase === "commit" && (
                  <Button size="sm" variant="default" onClick={() => dispatch({ type: "finalize" })}>
                    Finalize Decisions
                  </Button>
                )}
                {state.phase === "done" && <Badge>Session Completed</Badge>}
              </div>
            </div>

            {/* Right: focused details */}
            <div className="lg:w-[360px] w-full">
              <div className="game-panel game-panel-muted p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm">Focused Set</div>
                  {focused ? <Badge variant="secondary">{focused.id}</Badge> : <Badge variant="outline">None</Badge>}
                </div>

                {!focused ? (
                  <div className="text-sm text-muted-foreground">
                    Tap a set card to see details and log your decision.
                  </div>
                ) : (
                  <>
                    <div className="text-sm font-medium">{focused.title}</div>
                    <div className="text-xs text-muted-foreground">
                      Est: {focused.estimatedMinutes} min • Setup: {focused.setupCost} • Computation:{" "}
                      {focused.computation} • Read: {focused.readability}
                    </div>

                    <Separator />

                    {state.phase === "commit" ? (
                      <>
                        <div className="flex flex-wrap gap-2">
                          {(["attempt", "later", "skip"] as const).map(d => (
                            <Button
                              key={d}
                              size="sm"
                              variant={state.decisions[focused.id]?.decision === d ? "default" : "secondary"}
                              onClick={() => dispatch({ type: "setDecision", setId: focused.id, decision: d })}
                            >
                              {d}
                            </Button>
                          ))}
                        </div>

                        <div className="space-y-2">
                          <div className="text-sm font-medium">Reason (1 line)</div>
                          <Textarea
                            value={state.decisions[focused.id]?.reason ?? ""}
                            onChange={e => dispatch({ type: "setReason", setId: focused.id, reason: e.target.value })}
                            placeholder="e.g., Clear table; low setup; manageable computation"
                            className="min-h-[90px]"
                          />
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        In <span className="font-medium">scan</span> phase: shortlist sets you would consider
                        attempting.
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="game-panel mt-3 p-3">
                <div className="text-sm font-medium mb-2">Decision Log</div>
                <div className="text-xs text-muted-foreground">
                  {Object.keys(state.decisions).length === 0 ? (
                    <span>No decisions yet.</span>
                  ) : (
                    <ul className="list-disc list-inside space-y-1">
                      {Object.entries(state.decisions).map(([setId, d]) => (
                        <li key={setId}>
                          <span className="font-medium">{setId}</span>: {d.decision}
                          {d.reason ? <span> — {d.reason}</span> : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="game-panel game-panel-muted p-3 text-sm text-muted-foreground">
            <div className="font-medium text-foreground mb-1">CAT Link</div>
            This simulates the *critical first 2 minutes* in DILR: scan quickly, shortlist high-value sets, and commit
            to a plan. The goal is not “solve everything” — it’s *maximize expected marks under time*.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
