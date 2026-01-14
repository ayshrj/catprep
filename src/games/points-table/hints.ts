import { PointsTablePuzzle, PointsTableState } from "./types";

export function getHint(puzzle: PointsTablePuzzle, state: PointsTableState) {
  // Reveal one unresolved or incorrect match (as a "deduction direction")
  for (const m of puzzle.matches) {
    const cur = state.outcomes[m.id];
    const sol = puzzle.solutionOutcomes[m.id];
    if (!cur) {
      return {
        title: "Hint: Anchor a match",
        body: `Try fixing match ${m.id} (${m.home} vs ${m.away}). In the correct table, its outcome is one of {Home win / Draw / Away win}. Use points totals to deduce it.`,
      };
    }
    if (cur !== sol) {
      return {
        title: "Hint: Re-check this match",
        body: `Match ${m.id} (${m.home} vs ${m.away}) is likely inconsistent with points totals. Recalculate standings after flipping it.`,
      };
    }
  }

  return {
    title: "Hint",
    body: "Your table seems consistent so far. Cross-check totals for each team.",
  };
}
