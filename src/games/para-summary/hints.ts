import type { ParaSummaryPuzzle, ParaSummaryState } from "./types";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getHint(_puzzle: ParaSummaryPuzzle, _state: ParaSummaryState) {
  return {
    title: "CAT summary MCQ trick",
    body:
      "Pick the option that matches the passage’s thesis + one key support. Reject options that: (a) add new claims, " +
      "(b) use extreme words (always/never), or (c) shrink/expand scope.",
  };
}
