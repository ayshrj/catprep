import type { RcDailyPuzzle, RcDailyState } from "./types";

export function evaluate(puzzle: RcDailyPuzzle, state: RcDailyState) {
  const errors: Array<{ type: string; message: string; meta?: any }> = [];
  let status: "inProgress" | "solved" | "failed" = "inProgress";
  let scoreDelta = 0;

  if (!state.submitted) return { status, errors, scoreDelta };

  let correct = 0;
  for (const q of puzzle.questions) {
    const chosen = state.selectedByQid[q.id];
    if (!chosen) {
      errors.push({
        type: "unanswered",
        message: `Unanswered: "${q.prompt}"`,
        meta: { qid: q.id },
      });
      continue;
    }
    if (chosen === q.correctOptionId) {
      correct += 1;
    } else {
      errors.push({
        type: "incorrect",
        message: `Incorrect: "${q.prompt}"`,
        meta: { qid: q.id, chosen, correct: q.correctOptionId },
      });
    }
  }

  if (correct === puzzle.questions.length && errors.length === 0) {
    status = "solved";
    scoreDelta = 100;
  } else {
    scoreDelta = Math.max(0, Math.round((correct / puzzle.questions.length) * 60));
  }

  return { status, errors, scoreDelta };
}
