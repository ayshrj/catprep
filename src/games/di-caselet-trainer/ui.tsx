"use client";

import React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import { DICaseletAction, DICaseletPuzzle, DICaseletState } from "./types";

export const DICaseletTrainerUI: React.FC<{
  puzzle: DICaseletPuzzle;
  state: DICaseletState;
  dispatch: React.Dispatch<DICaseletAction>;
}> = ({ puzzle, state, dispatch }) => {
  return (
    <div className="space-y-4">
      <Card className="game-panel">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base">{puzzle.title}</CardTitle>
            <Badge variant="secondary">Hybrid</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{puzzle.caselet}</p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-border/60 bg-background/70">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {puzzle.table.headers.map(h => (
                    <th key={h} className="px-3 py-2 text-left font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {puzzle.table.rows.map(r => (
                  <tr key={r.label} className="border-t">
                    <td className="px-3 py-2 font-medium">{r.label}</td>
                    {r.values.map((v, idx) => (
                      <td key={idx} className="px-3 py-2">
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Separator />

          {/* Questions */}
          <div className="space-y-3">
            {puzzle.questions.map(q => (
              <div key={q.id} className="game-panel game-panel-muted p-3 space-y-2">
                <div className="text-sm font-medium">{q.prompt}</div>
                <div className="flex items-center gap-2">
                  <Input
                    inputMode="decimal"
                    value={state.answers[q.id] ?? ""}
                    onChange={e =>
                      dispatch({
                        type: "setAnswer",
                        questionId: q.id,
                        value: e.target.value,
                      })
                    }
                    placeholder="Type numeric answer"
                    className="max-w-[220px]"
                    aria-label={`Answer for ${q.prompt}`}
                  />
                  {q.unit ? <span className="text-sm text-muted-foreground">{q.unit}</span> : null}
                </div>

                {state.submitted && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">Solution:</span> {q.solution}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="game-action-row">
            <Button size="sm" onClick={() => dispatch({ type: "submit" })}>
              Submit
            </Button>
            <Button size="sm" variant="outline" onClick={() => dispatch({ type: "clear" })}>
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
