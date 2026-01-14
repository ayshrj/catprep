import type { ParaJumblePuzzle, ParaJumbleState } from "./types";

export function evaluate(puzzle: ParaJumblePuzzle, state: ParaJumbleState) {
  const errors: Array<{ type: string; message: string; meta?: any }> = [];
  let status: "inProgress" | "solved" | "failed" = "inProgress";
  let scoreDelta = 0;

  if (!state.submitted) return { status, errors, scoreDelta };

  const correct = puzzle.correctOrder;
  const chosen = state.order;

  let firstMismatch = -1;
  for (let i = 0; i < correct.length; i++) {
    if (correct[i] !== chosen[i]) {
      firstMismatch = i;
      break;
    }
  }

  if (firstMismatch === -1) {
    status = "solved";
    scoreDelta = 100;
  } else {
    errors.push({
      type: "orderMismatch",
      message: `Order mismatch at position ${firstMismatch + 1}. Re-check connectors/pronouns.`,
      meta: { firstMismatch },
    });
    // partial score: prefix match length
    scoreDelta = Math.round((firstMismatch / correct.length) * 80);
  }

  return { status, errors, scoreDelta };
}
