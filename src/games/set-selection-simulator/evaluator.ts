import { SetSelectionPuzzle, SetSelectionState } from "./types";

export function evaluate(puzzle: SetSelectionPuzzle, state: SetSelectionState) {
  const errors: Array<{ type: string; message: string; meta?: any }> = [];

  if (!state.submitted) {
    // soft warnings to nudge good process
    if (state.phase === "commit") {
      const shortlistedCount = Object.values(state.shortlisted).filter(Boolean).length;
      if (shortlistedCount === 0) {
        errors.push({
          type: "process",
          message: "Tip: shortlist 2–4 sets in scan phase, then commit quickly in commit phase.",
        });
      }
    }
    return { status: "inProgress" as const, errors, scoreDelta: 0 };
  }

  // Scoring: sum EV for attempted sets, small credit for 'later', no credit for skip.
  let score = 0;
  let attempts = 0;

  for (const s of puzzle.sets) {
    const d = state.decisions[s.id]?.decision;
    if (d === "attempt") {
      attempts += 1;
      score += s.ev;
      // penalty for high setup + high computation
      if (s.setupCost === "high" && s.computation === "high") score -= 10;
    } else if (d === "later") {
      score += 5;
    }
  }

  // process warning: attempting too many sets usually backfires
  if (attempts >= 5) {
    errors.push({
      type: "warning",
      message: "Process warning: Attempting 5+ sets often reduces accuracy. Consider committing to 3–4 high-EV sets.",
      meta: { attempts },
    });
  }

  // normalize to a delta-ish range
  const scoreDelta = Math.max(0, Math.min(160, Math.round(score)));
  return { status: "solved" as const, errors, scoreDelta };
}
