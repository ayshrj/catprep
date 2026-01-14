import { GameStatus } from "../core/types";
import { NonogramPuzzle, NonogramState } from "./types";

export function evaluate(puzzle: NonogramPuzzle, state: NonogramState) {
  const errors: Array<{ type: string; message: string }> = [];
  const H = puzzle.height;
  const W = puzzle.width;

  let wrong = 0;
  let correctFilled = 0;
  let requiredFilled = 0;

  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W; c++) {
      const sol = puzzle.solution[r][c];
      const mark = state.marks[r][c];

      if (sol) requiredFilled++;

      if (mark === "fill") {
        if (!sol) wrong++;
        else correctFilled++;
      }

      if (mark === "x" && sol) wrong++; // marked empty but should be filled
    }
  }

  if (wrong > 0)
    errors.push({
      type: "mismatch",
      message: `There are ${wrong} incorrect cells (fills/X contradict solution).`,
    });

  const solved = wrong === 0 && correctFilled === requiredFilled;
  const status: GameStatus = solved ? "solved" : "inProgress";
  return {
    status,
    errors,
    scoreDelta: solved ? 135 : 0,
  };
}
