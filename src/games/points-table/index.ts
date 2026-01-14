import { GameModule } from "../core/types";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { reduce as reduceWithPuzzle } from "./engine";
import { evaluate } from "./evaluator";
import { createPuzzle } from "./generator";
import { getHint } from "./hints";
import { PointsTableAction, PointsTablePuzzle, PointsTableState } from "./types";
import { PointsTableUI } from "./ui";

const moduleDef: GameModule<PointsTablePuzzle, PointsTableState, PointsTableAction> = {
  id: "pointsTable",
  title: "Tournament Points Table",
  section: "dilr",
  skillTags: ["Table-making", "Constraint propagation", "Totals cross-check"],
  description:
    "CAT DILR often includes points tables. This game forces disciplined table-making: track outcomes, compute standings, and validate totals without guessing.",
  difficulties: [
    { id: 1, label: "Easy (4 teams)" },
    { id: 2, label: "Medium (5 teams)" },
    { id: 3, label: "Hard (5 teams, fewer locks)" },
  ],
  createPuzzle,
  getInitialState: puzzle => {
    const outcomes: Record<string, any> = {};
    for (const m of puzzle.matches) outcomes[m.id] = null;
    for (const [mid, out] of Object.entries(puzzle.fixedOutcomes)) outcomes[mid] = out;
    return { outcomes };
  },
  // We need puzzle in reducer for fixed-check; wrap it via closure in GameRunner? Not available.
  // So we implement reduce as a pure reducer by embedding fixedOutcomes in state? Instead, simplest: handle fixed-check in UI + evaluator.
  // But we already do fixed-check in engine via puzzle arg. Contract is reduce(state, action).
  // Therefore: move fixed-check to UI and evaluator. Reduce becomes generic.
  reduce: (state, action) => {
    switch (action.type) {
      case "setOutcome":
        return {
          ...state,
          outcomes: { ...state.outcomes, [action.matchId]: action.outcome },
        };
      case "clearOutcome":
        return {
          ...state,
          outcomes: { ...state.outcomes, [action.matchId]: null },
        };
      case "__RESET__":
        return action.newState;
      default:
        return state;
    }
  },
  evaluate,
  getHint,
  Component: PointsTableUI,
};

export default moduleDef;
