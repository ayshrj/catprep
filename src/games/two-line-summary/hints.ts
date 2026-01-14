import type { TwoLineSummaryPuzzle, TwoLineSummaryState } from "./types";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getHint(puzzle: TwoLineSummaryPuzzle, _state: TwoLineSummaryState) {
  return {
    title: "2-line summary rubric",
    body:
      "Keep only the thesis + one key support/implication. Avoid examples and extra adjectives. " +
      `Target ${puzzle.minWords}-${puzzle.maxWords} words. Try to include: ${puzzle.requiredKeywords.join(", ")}.`,
  };
}
