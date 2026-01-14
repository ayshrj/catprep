import { TwentyFourPuzzle, TwentyFourState } from "./types";

export function evaluate(puzzle: TwentyFourPuzzle, state: TwentyFourState) {
  const errors: Array<{ type: string; message: string }> = [];
  let status: "inProgress" | "solved" | "failed" = "inProgress";
  if (state.currentNumbers.length === 1) {
    const finalValue = state.currentNumbers[0];
    if (Math.abs(finalValue - 24) < 1e-9) {
      status = "solved";
    } else {
      errors.push({
        type: "not24",
        message: `Result is ${finalValue}, not 24. Try a different approach.`,
      });
      status = "inProgress"; // still allow continuing (reset to try again)
    }
  }
  return {
    status,
    errors,
    scoreDelta: status === "solved" ? 100 : 0,
  };
}
