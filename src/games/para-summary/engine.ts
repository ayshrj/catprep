import type { ParaSummaryAction, ParaSummaryState } from "./types";

export function reduce(state: ParaSummaryState, action: ParaSummaryAction): ParaSummaryState {
  switch (action.type) {
    case "select":
      return { ...state, selectedOptionId: action.optionId };
    case "submit":
      return { ...state, submitted: true };
    case "reset":
      return { ...state, submitted: false };
    case "__RESET__":
      return action.newState;
    default:
      return state;
  }
}
