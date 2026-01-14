import { computeCost } from "./evaluator";
import { RoutesPuzzle, RoutesState } from "./types";

export function getHint(puzzle: RoutesPuzzle, state: RoutesState) {
  const sol = puzzle.solutionPath;
  const path = state.path;

  // If current path matches prefix of solution, suggest next node
  let matchesPrefix = true;
  for (let i = 0; i < Math.min(path.length, sol.length); i++) {
    if (path[i] !== sol[i]) {
      matchesPrefix = false;
      break;
    }
  }

  if (matchesPrefix && path.length < sol.length) {
    return {
      title: "Hint: Next step",
      body: `From ${path[path.length - 1]}, try going to ${sol[path.length]} (one valid exact-cost route).`,
    };
  }

  const { cost } = computeCost(puzzle, path);
  const remaining = puzzle.targetCost - cost;
  return {
    title: "Hint: Remaining cost",
    body: `You have cost ${cost}. Remaining to hit target: ${remaining}. Try choosing an edge that keeps remaining reachable.`,
  };
}
