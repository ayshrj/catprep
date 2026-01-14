import { TargetNumberPuzzle, TargetNumberState } from "./types";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getHint(puzzle: TargetNumberPuzzle, _state: TargetNumberState) {
  return {
    title: "Hint: One possible approach",
    body: puzzle.solution,
  };
}
