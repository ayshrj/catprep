import type { ParaSummaryPuzzle, ParaSummaryState } from "./types";

export function evaluate(puzzle: ParaSummaryPuzzle, state: ParaSummaryState) {
  const errors: Array<{ type: string; message: string; meta?: any }> = [];
  let status: "inProgress" | "solved" | "failed" = "inProgress";
  let scoreDelta = 0;

  if (!state.submitted) return { status, errors, scoreDelta };

  if (!state.selectedOptionId) {
    errors.push({
      type: "unselected",
      message: "Select an option before submitting.",
    });
    return { status, errors, scoreDelta };
  }

  if (state.selectedOptionId === puzzle.correctOptionId) {
    status = "solved";
    scoreDelta = 100;
  } else {
    errors.push({
      type: "incorrect",
      message: "Incorrect. Re-check scope: avoid extremes and new ideas.",
      meta: { chosen: state.selectedOptionId, correct: puzzle.correctOptionId },
    });
    scoreDelta = 30;
  }

  return { status, errors, scoreDelta };
}
