import { MentalMathPuzzle, MentalMathState } from "./types";

function parseNumber(s: string): number | null {
  const t = s.trim();
  if (!t) return null;
  const x = Number(t);
  return Number.isFinite(x) ? x : null;
}

export function evaluate(puzzle: MentalMathPuzzle, state: MentalMathState) {
  const errors: Array<{ type: string; message: string; meta?: any }> = [];

  // Compute correctness for submitted questions
  const correctArr = state.correct.slice();
  for (let i = 0; i < puzzle.questions.length; i++) {
    if (!state.submitted[i]) {
      correctArr[i] = null;
      continue;
    }
    const q = puzzle.questions[i];
    const v = parseNumber(state.answers[i] ?? "");
    if (v == null) {
      correctArr[i] = false;
      if (i === state.index) errors.push({ type: "invalidInput", message: "Enter a valid number." });
      continue;
    }
    const ok = Math.abs(v - q.answer) <= q.tolerance;
    correctArr[i] = ok;
  }

  // Provide focused error feedback for current question if submitted and wrong
  if (state.submitted[state.index] && correctArr[state.index] === false) {
    const q = puzzle.questions[state.index];
    errors.push({
      type: "wrong",
      message: `Incorrect. Expected ≈ ${q.answer} (tolerance ±${q.tolerance}).`,
    });
  }

  const allSubmitted = state.submitted.every(Boolean);
  if (!allSubmitted) {
    return { status: "inProgress" as const, errors, scoreDelta: 0 };
  }

  const totalCorrect = correctArr.filter(x => x === true).length;
  const scoreDelta = Math.round((totalCorrect / puzzle.questions.length) * 100);

  // Solved when finished (regardless of score); it’s a drill set.
  return { status: "solved" as const, errors: [], scoreDelta };
}
