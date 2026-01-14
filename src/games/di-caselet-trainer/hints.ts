import { DICaseletPuzzle, DICaseletState } from "./types";

export function getHint(puzzle: DICaseletPuzzle, state: DICaseletState) {
  const unanswered = puzzle.questions.find(q => !(state.answers[q.id] ?? "").trim());
  const target = unanswered ?? puzzle.questions[0];

  return {
    title: "DI speed hint",
    body:
      `For "${target.prompt}" write the formula first, then compute in steps. ` +
      `Avoid recomputing totals: reuse intermediate sums/ratios and keep units consistent.`,
  };
}
