import { TwentyFourPuzzle, TwentyFourState } from "./types";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getHint(puzzle: TwentyFourPuzzle, state: TwentyFourState) {
  if (puzzle.solution) {
    return {
      title: "Hint: Solution Expression",
      body: `One possible solution is: ${puzzle.solution}`,
    };
  }
  return {
    title: "Hint",
    body: "Try combining two of the numbers in a way that brings you closer to 24.",
  };
}
