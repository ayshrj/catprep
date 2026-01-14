import type { TwoLineSummaryPuzzle, TwoLineSummaryState } from "./types";

function wordCount(text: string) {
  const tokens = text.trim().split(/\s+/).filter(Boolean);
  return tokens.length;
}

export function evaluate(puzzle: TwoLineSummaryPuzzle, state: TwoLineSummaryState) {
  const errors: Array<{ type: string; message: string; meta?: any }> = [];
  let status: "inProgress" | "solved" | "failed" = "inProgress";
  let scoreDelta = 0;

  if (!state.submitted) return { status, errors, scoreDelta };

  const wc = wordCount(state.text);
  if (wc < puzzle.minWords) {
    errors.push({
      type: "tooShort",
      message: `Too short: ${wc} words. Aim for ${puzzle.minWords}-${puzzle.maxWords} words.`,
    });
  }
  if (wc > puzzle.maxWords) {
    errors.push({
      type: "tooLong",
      message: `Too long: ${wc} words. Aim for ${puzzle.minWords}-${puzzle.maxWords} words.`,
    });
  }

  const lower = state.text.toLowerCase();
  const missing = puzzle.requiredKeywords.filter(k => !lower.includes(k.toLowerCase()));
  if (missing.length > 0) {
    errors.push({
      type: "missingKeywords",
      message: `Missing key ideas: ${missing.join(", ")}.`,
      meta: { missing },
    });
  }

  if (errors.length === 0) {
    status = "solved";
    scoreDelta = 100;
  } else {
    // Partial score: closer word count + fewer missing keywords
    const rangeMid = (puzzle.minWords + puzzle.maxWords) / 2;
    const wcPenalty = Math.min(1, Math.abs(wc - rangeMid) / rangeMid);
    const kwPenalty = missing.length / Math.max(1, puzzle.requiredKeywords.length);
    scoreDelta = Math.max(0, Math.round(80 * (1 - 0.6 * wcPenalty - 0.4 * kwPenalty)));
  }

  return { status, errors, scoreDelta };
}
