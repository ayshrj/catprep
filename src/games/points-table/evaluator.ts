import { Outcome, PointsTablePuzzle, PointsTableState } from "./types";

type Row = {
  teamId: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
};

function applyOutcomeToRows(
  rows: Map<string, Row>,
  home: string,
  away: string,
  out: Outcome,
  sys: { win: number; draw: number; loss: number }
) {
  const h = rows.get(home)!;
  const a = rows.get(away)!;
  h.played += 1;
  a.played += 1;

  if (out === "H") {
    h.wins += 1;
    a.losses += 1;
    h.points += sys.win;
    a.points += sys.loss;
  } else if (out === "A") {
    a.wins += 1;
    h.losses += 1;
    a.points += sys.win;
    h.points += sys.loss;
  } else {
    h.draws += 1;
    a.draws += 1;
    h.points += sys.draw;
    a.points += sys.draw;
  }
}

export function computeStandings(puzzle: PointsTablePuzzle, state: PointsTableState): Row[] {
  const rows = new Map<string, Row>();
  for (const t of puzzle.teams) {
    rows.set(t.id, {
      teamId: t.id,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      points: 0,
    });
  }

  for (const m of puzzle.matches) {
    const out = state.outcomes[m.id];
    if (!out) continue;
    applyOutcomeToRows(rows, m.home, m.away, out, puzzle.pointsSystem);
  }

  const list = Array.from(rows.values());
  list.sort((a, b) => b.points - a.points || b.wins - a.wins || a.teamId.localeCompare(b.teamId));
  return list;
}

export function evaluate(puzzle: PointsTablePuzzle, state: PointsTableState) {
  const errors: Array<{ type: string; message: string; meta?: any }> = [];

  // Fixed outcomes must match
  for (const [mid, out] of Object.entries(puzzle.fixedOutcomes)) {
    if (state.outcomes[mid] !== out) {
      errors.push({
        type: "fixedMismatch",
        message: `Locked match ${mid} differs from its fixed outcome.`,
      });
    }
  }

  const missing = puzzle.matches.filter(m => !state.outcomes[m.id]).length;
  if (missing > 0) {
    errors.push({
      type: "incomplete",
      message: `Fill remaining match outcomes (${missing} left).`,
    });
    return { status: "inProgress" as const, errors, scoreDelta: 0 };
  }

  // All filled: validate against solution outcomes (guaranteed single "correct" answer for this MVP)
  const wrong: string[] = [];
  for (const m of puzzle.matches) {
    const chosen = state.outcomes[m.id]!;
    const sol = puzzle.solutionOutcomes[m.id];
    if (chosen !== sol) wrong.push(m.id);
  }
  if (wrong.length > 0) {
    errors.push({
      type: "wrongOutcomes",
      message: `Some outcomes are inconsistent with constraints/solution (${wrong.length} wrong).`,
      meta: { wrongMatchIds: wrong },
    });
    return { status: "inProgress" as const, errors, scoreDelta: 0 };
  }

  return { status: "solved" as const, errors: [], scoreDelta: 100 };
}
