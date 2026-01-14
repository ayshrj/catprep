import { NonogramPuzzle, NonogramState } from "./types";

export function getHint(puzzle: NonogramPuzzle, state: NonogramState) {
  const { r, c } = state.selected;
  const sol = puzzle.solution[r][c];

  return {
    title: "Hint: Resolve one cell",
    body: `Cell (${r + 1},${c + 1}) should be ${
      sol ? "FILLED" : "EMPTY (X)"
    } based on the solution. Use row/col clue runs to justify it.`,
  };
}
