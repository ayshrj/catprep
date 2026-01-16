import { MentalMathPuzzle, MentalMathState } from "./types";

function parseNumber(s: string): number | null {
  const t = s.trim();
  if (!t) return null;
  const x = Number(t);
  return Number.isFinite(x) ? x : null;
}

export function evaluate(puzzle: MentalMathPuzzle, state: MentalMathState) {
  const errors: Array<{ type: string; message: string; meta?: any }> = [];

  const formatNumber = (value: number) => {
    if (Number.isInteger(value)) return String(value);
    return String(Number(value.toFixed(4)));
  };

  const expectedLabel = (answer: number, tolerance: number) => {
    const expected = formatNumber(answer);
    if (tolerance > 0) {
      return `Expected approx ${expected} (tol +/- ${formatNumber(tolerance)}).`;
    }
    return `Expected ${expected}.`;
  };

  const allSubmitted = state.submitted.every(Boolean);

  if (!allSubmitted) {
    const i = state.index;
    if (state.submitted[i]) {
      const q = puzzle.questions[i];
      const raw = state.answers[i] ?? "";
      const v = parseNumber(raw);
      if (v == null) {
        errors.push({
          type: "invalidInput",
          message: `Q${i + 1}: "${q.prompt}" - invalid answer "${raw || "blank"}".`,
          meta: { index: i },
        });
      } else if (Math.abs(v - q.answer) > q.tolerance) {
        errors.push({
          type: "wrong",
          message: `Q${i + 1}: "${q.prompt}" - your answer ${formatNumber(v)}. ${expectedLabel(q.answer, q.tolerance)}`,
          meta: { index: i, chosen: v, expected: q.answer },
        });
      }
    }
    return { status: "inProgress" as const, errors, scoreDelta: 0 };
  }

  let totalCorrect = 0;
  for (let i = 0; i < puzzle.questions.length; i += 1) {
    const q = puzzle.questions[i];
    const raw = state.answers[i] ?? "";
    const v = parseNumber(raw);

    if (v == null) {
      errors.push({
        type: "invalidInput",
        message: `Q${i + 1}: "${q.prompt}" - invalid answer "${raw || "blank"}".`,
        meta: { index: i },
      });
      continue;
    }

    if (Math.abs(v - q.answer) <= q.tolerance) {
      totalCorrect += 1;
    } else {
      errors.push({
        type: "wrong",
        message: `Q${i + 1}: "${q.prompt}" - your answer ${formatNumber(v)}. ${expectedLabel(q.answer, q.tolerance)}`,
        meta: { index: i, chosen: v, expected: q.answer },
      });
    }
  }

  const scoreDelta = Math.round((totalCorrect / puzzle.questions.length) * 100);

  // Solved when finished (regardless of score); it's a drill set.
  return { status: "solved" as const, errors, scoreDelta };
}
