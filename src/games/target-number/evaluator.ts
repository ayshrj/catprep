import { TargetNumberPuzzle, TargetNumberState } from "./types";

export function evaluate(puzzle: TargetNumberPuzzle, state: TargetNumberState) {
  const errors: Array<{ type: string; message: string; meta?: any }> = [];

  if (state.currentNumbers.length === 1) {
    const v = state.currentNumbers[0];
    if (Math.abs(v - puzzle.target) < 1e-9) {
      return { status: "solved" as const, errors: [], scoreDelta: 100 };
    }
    errors.push({
      type: "notTarget",
      message: `Final result is ${v}, not ${puzzle.target}. Reset and try a new combination.`,
    });
    return { status: "inProgress" as const, errors, scoreDelta: 0 };
  }

  errors.push({
    type: "inProgress",
    message: `Target: ${puzzle.target}. Combine numbers to reach it.`,
  });
  return { status: "inProgress" as const, errors, scoreDelta: 0 };
}
