import type { RcDailyPuzzle, RcDailyState } from "./types";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getHint(puzzle: RcDailyPuzzle, _state: RcDailyState) {
  return {
    title: "RC discipline hint",
    body:
      "Anchor answers in specific lines. Eliminate options that introduce new claims or shift scope. " +
      `Strategy for this set: ${puzzle.strategyNote}`,
  };
}
