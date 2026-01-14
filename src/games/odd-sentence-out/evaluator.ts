import { OddSentenceOutPuzzle, OddSentenceOutState } from "./types";

export function evaluate(puzzle: OddSentenceOutPuzzle, state: OddSentenceOutState) {
  const errors: Array<{ type: string; message: string; meta?: any }> = [];

  if (!state.submitted) {
    return { status: "inProgress" as const, errors, scoreDelta: 0 };
  }

  if (state.selectedIndex === null) {
    errors.push({
      type: "missingSelection",
      message: "Select a sentence before submitting.",
    });
    return { status: "inProgress" as const, errors, scoreDelta: 0 };
  }

  const correct = state.selectedIndex === puzzle.oddIndex;
  if (correct) {
    return { status: "solved" as const, errors, scoreDelta: 100 };
  }

  errors.push({
    type: "wrong",
    message: "Not quite. Re-check topic continuity, logic, and absolutes.",
    meta: { selectedIndex: state.selectedIndex, oddIndex: puzzle.oddIndex },
  });

  return { status: "inProgress" as const, errors, scoreDelta: 0 };
}
