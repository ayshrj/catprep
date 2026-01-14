import { EstimationDuelAction, EstimationDuelState } from "./types";

export function reduce(state: EstimationDuelState, action: EstimationDuelAction): EstimationDuelState {
  switch (action.type) {
    case "select":
      return { ...state, selected: action.optionIndex };

    case "submit": {
      if (state.revealed[state.index]) return state;
      if (state.selected == null) return state;

      const answered = [...state.answered];
      const revealed = [...state.revealed];
      answered[state.index] = state.selected;
      revealed[state.index] = true;

      return { ...state, answered, revealed };
    }

    case "next":
      return {
        ...state,
        index: Math.min(state.index + 1, state.revealed.length - 1),
        selected: null,
      };

    case "prev":
      return { ...state, index: Math.max(state.index - 1, 0), selected: null };

    case "__RESET__":
      return action.newState;

    default:
      return state;
  }
}
