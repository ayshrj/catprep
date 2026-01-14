import type { RcDailyAction, RcDailyState } from "./types";

export function reduce(state: RcDailyState, action: RcDailyAction): RcDailyState {
  switch (action.type) {
    case "select":
      return {
        ...state,
        selectedByQid: {
          ...state.selectedByQid,
          [action.qid]: action.optionId,
        },
      };
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
