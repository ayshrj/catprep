import { EstimationDuelPuzzle, EstimationDuelState } from "./types";

export function evaluate(puzzle: EstimationDuelPuzzle, state: EstimationDuelState) {
  const errors: Array<{ type: string; message: string; meta?: any }> = [];
  const r = puzzle.rounds[state.index];

  if (state.revealed[state.index]) {
    const chosen = state.answered[state.index];
    if (chosen != null && chosen !== r.correctIndex) {
      errors.push({
        type: "wrong",
        message: `Incorrect. Correct option is "${r.options[r.correctIndex]}".`,
      });
    }
  }

  const allDone = state.revealed.every(Boolean);
  if (!allDone) {
    return { status: "inProgress" as const, errors, scoreDelta: 0 };
  }

  const correctCount = puzzle.rounds.reduce((acc, round, i) => {
    const a = state.answered[i];
    return acc + (a === round.correctIndex ? 1 : 0);
  }, 0);

  const scoreDelta = Math.round((correctCount / puzzle.rounds.length) * 100);
  return { status: "solved" as const, errors: [], scoreDelta };
}
