import { MentalMathPuzzle, MentalMathState } from "./types";

export function getHint(puzzle: MentalMathPuzzle, state: MentalMathState) {
  const q = puzzle.questions[state.index];
  return { title: "Hint", body: q.hint };
}
