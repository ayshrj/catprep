import { MinesweeperPuzzle, MinesweeperState } from "./types";

export function evaluate(puzzle: MinesweeperPuzzle, state: MinesweeperState) {
  const errors: Array<{ type: string; message: string }> = [];

  if (state.status === "failed") {
    errors.push({
      type: "boom",
      message: "Boom — you hit a mine. Reflect: was the guess forced or avoidable?",
    });
  }

  return {
    status: state.status,
    errors,
    scoreDelta: state.status === "solved" ? 140 : 0,
  };
}
