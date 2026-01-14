import { OddSentenceOutAction, OddSentenceOutState } from "./types";

export function reduce(state: OddSentenceOutState, action: OddSentenceOutAction): OddSentenceOutState {
  switch (action.type) {
    case "select":
      return { ...state, selectedIndex: action.index };
    case "setExplanation":
      return { ...state, explanation: action.value };
    case "submit":
      return { ...state, submitted: true };
    case "clearSelection":
      return { ...state, selectedIndex: null, submitted: false };
    case "__RESET__":
      return action.newState;
    default:
      return state;
  }
}
