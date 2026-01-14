"use client";

import { ChevronDown } from "lucide-react";
import React, { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import { computeStandings } from "./evaluator";
import { Outcome, PointsTableAction, PointsTablePuzzle, PointsTableState } from "./types";

function outcomeLabel(out: Outcome | null) {
  if (!out) return "—";
  if (out === "H") return "Home";
  if (out === "D") return "Draw";
  return "Away";
}

function outcomeBadgeVariant(out: Outcome | null): "default" | "secondary" | "outline" {
  if (!out) return "outline";
  if (out === "D") return "secondary";
  return "default";
}

export const PointsTableUI: React.FC<{
  puzzle: PointsTablePuzzle;
  state: PointsTableState;
  dispatch: React.Dispatch<PointsTableAction>;
}> = ({ puzzle, state, dispatch }) => {
  const standings = useMemo(() => computeStandings(puzzle, state), [puzzle, state]);
  const teamName = useMemo(() => new Map(puzzle.teams.map(t => [t.id, t.name])), [puzzle.teams]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="game-panel">
          <CardHeader>
            <CardTitle className="text-base">Matches</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[360px] pr-3">
              <div className="space-y-2">
                {puzzle.matches.map(m => {
                  const fixed = !!puzzle.fixedOutcomes[m.id];
                  const out = state.outcomes[m.id];

                  return (
                    <div
                      key={m.id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-background/70 p-3"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium">
                          {teamName.get(m.home)} <span className="text-muted-foreground">vs</span>{" "}
                          {teamName.get(m.away)}
                        </div>
                        <div className="text-xs text-muted-foreground">Match ID: {m.id}</div>
                      </div>

                      {fixed ? (
                        <Badge variant="secondary" className="shrink-0">
                          Locked: {outcomeLabel(out as Outcome)}
                        </Badge>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="shrink-0">
                              <Badge variant={outcomeBadgeVariant(out)} className="mr-2">
                                {outcomeLabel(out)}
                              </Badge>
                              Choose <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                dispatch({
                                  type: "setOutcome",
                                  matchId: m.id,
                                  outcome: "H",
                                })
                              }
                            >
                              Home win
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                dispatch({
                                  type: "setOutcome",
                                  matchId: m.id,
                                  outcome: "D",
                                })
                              }
                            >
                              Draw
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                dispatch({
                                  type: "setOutcome",
                                  matchId: m.id,
                                  outcome: "A",
                                })
                              }
                            >
                              Away win
                            </DropdownMenuItem>
                            <Separator />
                            <DropdownMenuItem
                              onClick={() =>
                                dispatch({
                                  type: "clearOutcome",
                                  matchId: m.id,
                                })
                              }
                            >
                              Clear
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <Separator className="my-3" />
            <div className="game-helper">
              Tip: build the standings while selecting outcomes—CAT points-table sets reward consistent cross-checking.
            </div>
          </CardContent>
        </Card>

        <Card className="game-panel">
          <CardHeader>
            <CardTitle className="text-base">Standings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-xl border border-border/60 bg-background/70">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Team</th>
                    <th className="px-2 py-2 text-right font-medium">P</th>
                    <th className="px-2 py-2 text-right font-medium">W</th>
                    <th className="px-2 py-2 text-right font-medium">D</th>
                    <th className="px-2 py-2 text-right font-medium">L</th>
                    <th className="px-3 py-2 text-right font-medium">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map(r => (
                    <tr key={r.teamId} className="border-t">
                      <td className="px-3 py-2">{teamName.get(r.teamId)}</td>
                      <td className="px-2 py-2 text-right">{r.played}</td>
                      <td className="px-2 py-2 text-right">{r.wins}</td>
                      <td className="px-2 py-2 text-right">{r.draws}</td>
                      <td className="px-2 py-2 text-right">{r.losses}</td>
                      <td className="px-3 py-2 text-right font-semibold">{r.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Separator className="my-3" />
            <div className="space-y-1">
              <div className="game-panel-title">Constraints</div>
              <ul className="list-disc pl-5 text-xs text-muted-foreground">
                {puzzle.constraints.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
