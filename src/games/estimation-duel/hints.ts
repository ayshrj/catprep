import { EstimationDuelPuzzle, EstimationDuelState } from "./types";

export function getHint(puzzle: EstimationDuelPuzzle, state: EstimationDuelState) {
  const r = puzzle.rounds[state.index];
  return { title: "Hint", body: r.hint };
}
