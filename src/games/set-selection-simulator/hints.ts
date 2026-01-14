import { SetSelectionPuzzle, SetSelectionState } from "./types";

export function getHint(_: SetSelectionPuzzle, state: SetSelectionState) {
  if (state.phase === "scan") {
    return {
      title: "2-minute scan rule",
      body: "Shortlist 2–4 sets only. Prefer: clear data, low setup, medium/low computation. Reject: messy statements, long tables, too many cases/conditions.",
    };
  }

  return {
    title: "Commit rule",
    body: "Commit to 3–4 sets max. If a set looks 'high setup + high computation', skip unless you’re 100% confident. Write a one-line reason to prevent switching regret.",
  };
}
