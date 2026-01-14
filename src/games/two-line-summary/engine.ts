import type { TwoLineSummaryAction, TwoLineSummaryState } from "./types";

export function reduce(state: TwoLineSummaryState, action: TwoLineSummaryAction): TwoLineSummaryState {
  switch (action.type) {
    case "setText":
      return { ...state, text: action.text };
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
