import { PointsTableAction, PointsTablePuzzle, PointsTableState } from "./types";

export function reduce(
  puzzle: PointsTablePuzzle,
  state: PointsTableState,
  action: PointsTableAction
): PointsTableState {
  switch (action.type) {
    case "setOutcome": {
      // prevent editing fixed outcomes
      if (puzzle.fixedOutcomes[action.matchId]) return state;
      return {
        ...state,
        outcomes: { ...state.outcomes, [action.matchId]: action.outcome },
      };
    }
    case "clearOutcome": {
      if (puzzle.fixedOutcomes[action.matchId]) return state;
      return {
        ...state,
        outcomes: { ...state.outcomes, [action.matchId]: null },
      };
    }
    case "__RESET__":
      return action.newState;
    default:
      return state;
  }
}
