import { RatioMixerPuzzle, RatioMixerState } from "./types";

export function evaluate(puzzle: RatioMixerPuzzle, state: RatioMixerState) {
  const errors: Array<{ type: string; message: string; meta?: any }> = [];
  let status: "inProgress" | "solved" | "failed" = "inProgress";
  let scoreDelta = 0;

  if (!state.submitted) {
    return { status, errors, scoreDelta };
  }

  const diff = Math.abs(state.percentA - puzzle.correctPercentA);
  if (diff <= puzzle.tolerancePct) {
    status = "solved";
    scoreDelta = 100;
  } else {
    errors.push({
      type: "offTarget",
      message: `You're off by ${diff.toFixed(1)}%. Try closer to ${puzzle.correctPercentA.toFixed(1)}% of A (±${
        puzzle.tolerancePct
      }%).`,
      meta: { chosen: state.percentA, correct: puzzle.correctPercentA },
    });
  }

  return { status, errors, scoreDelta };
}
