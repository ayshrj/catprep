import { DICaseletPuzzle, DICaseletState } from "./types";

function parseNumber(raw: string): number | null {
  const cleaned = raw.replace(/,/g, "").trim();
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function evaluate(puzzle: DICaseletPuzzle, state: DICaseletState) {
  const errors: Array<{ type: string; message: string; meta?: any }> = [];

  if (!state.submitted) {
    return { status: "inProgress" as const, errors, scoreDelta: 0 };
  }

  let correctCount = 0;

  for (const q of puzzle.questions) {
    const raw = state.answers[q.id] ?? "";
    const val = parseNumber(raw);

    if (val === null) {
      errors.push({
        type: "missing",
        message: `Question: "${q.prompt}" — answer is missing/invalid.`,
      });
      continue;
    }

    const tol = q.tolerance ?? 0.01;
    const ok = Math.abs(val - q.answer) <= tol;

    if (ok) {
      correctCount += 1;
    } else {
      errors.push({
        type: "wrong",
        message: `Incorrect: "${q.prompt}" (Your: ${val}, Expected: ${Number(q.answer.toFixed(4))})`,
        meta: {
          questionId: q.id,
          your: val,
          expected: q.answer,
          tolerance: tol,
        },
      });
    }
  }

  if (correctCount === puzzle.questions.length) {
    return { status: "solved" as const, errors: [], scoreDelta: 140 };
  }

  // keep in progress so user can correct and submit again
  const scoreDelta = Math.round((correctCount / puzzle.questions.length) * 80);
  return { status: "inProgress" as const, errors, scoreDelta };
}
