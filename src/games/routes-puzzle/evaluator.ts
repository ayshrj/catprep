import { RoutesPuzzle, RoutesState } from "./types";

function edgeCost(puzzle: RoutesPuzzle, a: string, b: string): number | null {
  const e = puzzle.edges.find(x => (x.from === a && x.to === b) || (x.from === b && x.to === a));
  return e ? e.cost : null;
}

export function computeCost(puzzle: RoutesPuzzle, path: string[]): { cost: number; invalidAt: number | null } {
  let cost = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const c = edgeCost(puzzle, path[i], path[i + 1]);
    if (c == null) return { cost, invalidAt: i };
    cost += c;
  }
  return { cost, invalidAt: null };
}

export function evaluate(puzzle: RoutesPuzzle, state: RoutesState) {
  const errors: Array<{ type: string; message: string; meta?: any }> = [];
  const { cost, invalidAt } = computeCost(puzzle, state.path);

  if (invalidAt != null) {
    errors.push({
      type: "invalidEdge",
      message: `Invalid step: no edge between ${state.path[invalidAt]} and ${state.path[invalidAt + 1]}.`,
    });
    return { status: "inProgress" as const, errors, scoreDelta: 0 };
  }

  const startsOk = state.path[0] === puzzle.start;
  const endsOk = state.path[state.path.length - 1] === puzzle.end;

  if (!startsOk)
    errors.push({
      type: "start",
      message: `Path must start at ${puzzle.start}.`,
    });
  if (!endsOk) errors.push({ type: "end", message: `Path must end at ${puzzle.end}.` });

  if (endsOk && startsOk && cost === puzzle.targetCost) {
    return { status: "solved" as const, errors: [], scoreDelta: 100 };
  }

  if (cost > puzzle.targetCost) {
    errors.push({
      type: "overCost",
      message: `Cost ${cost} exceeds target ${puzzle.targetCost}. Consider backtracking.`,
    });
  } else {
    errors.push({
      type: "notYet",
      message: `Current cost: ${cost}. Target: ${puzzle.targetCost}.`,
    });
  }

  return { status: "inProgress" as const, errors, scoreDelta: 0 };
}
