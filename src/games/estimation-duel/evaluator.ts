import { EstimationDuelPuzzle, EstimationDuelState } from "./types";

export function evaluate(puzzle: EstimationDuelPuzzle, state: EstimationDuelState) {
  const errors: Array<{ type: string; message: string; meta?: any }> = [];
  const r = puzzle.rounds[state.index];

  const buildWrongMessage = (index: number) => {
    const round = puzzle.rounds[index];
    const chosen = state.answered[index];
    const chosenLabel = chosen == null ? "no selection" : `"${round.options[chosen]}"`;
    const correctLabel = `"${round.options[round.correctIndex]}"`;
    return `Round ${index + 1}: ${round.prompt} - your choice ${chosenLabel}. Correct option is ${correctLabel}.`;
  };

  if (state.revealed[state.index]) {
    const chosen = state.answered[state.index];
    if (chosen != null && chosen !== r.correctIndex) {
      errors.push({
        type: "wrong",
        message: buildWrongMessage(state.index),
        meta: { index: state.index, chosen, correct: r.correctIndex },
      });
    }
  }

  const allDone = state.revealed.every(Boolean);
  if (!allDone) {
    return { status: "inProgress" as const, errors, scoreDelta: 0 };
  }

  const wrongRounds = puzzle.rounds
    .map((round, index) => {
      const chosen = state.answered[index];
      if (chosen == null || chosen === round.correctIndex) return null;
      return {
        type: "wrong",
        message: buildWrongMessage(index),
        meta: { index, chosen, correct: round.correctIndex },
      };
    })
    .filter(Boolean) as Array<{ type: string; message: string; meta?: any }>;

  const correctCount = puzzle.rounds.reduce((acc, round, i) => {
    const a = state.answered[i];
    return acc + (a === round.correctIndex ? 1 : 0);
  }, 0);

  const scoreDelta = Math.round((correctCount / puzzle.rounds.length) * 100);
  return { status: "solved" as const, errors: wrongRounds, scoreDelta };
}
