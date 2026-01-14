import { InferenceJudgePuzzle, InferenceJudgeState } from "./types";

export function evaluate(puzzle: InferenceJudgePuzzle, state: InferenceJudgeState) {
  const errors: Array<{ type: string; message: string; meta?: any }> = [];

  if (!state.submitted) {
    return { status: "inProgress" as const, errors, scoreDelta: 0 };
  }

  if (!state.selectedOptionId) {
    errors.push({
      type: "missingSelection",
      message: "Select an option before submitting.",
    });
    return { status: "inProgress" as const, errors, scoreDelta: 0 };
  }

  const correct = state.selectedOptionId === puzzle.correctOptionId;
  if (correct) {
    return { status: "solved" as const, errors, scoreDelta: 100 };
  }

  const picked = puzzle.options.find(o => o.id === state.selectedOptionId);
  errors.push({
    type: "wrong",
    message:
      "That choice is not guaranteed by the text. For inference questions, pick only what is strictly entailed—not merely plausible.",
    meta: {
      picked: state.selectedOptionId,
      pickedWhy: picked?.why,
      correct: puzzle.correctOptionId,
    },
  });

  return { status: "inProgress" as const, errors, scoreDelta: 0 };
}
