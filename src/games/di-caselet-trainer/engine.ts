import { DICaseletAction, DICaseletState } from "./types";

export function reduce(state: DICaseletState, action: DICaseletAction): DICaseletState {
  switch (action.type) {
    case "setAnswer":
      return {
        ...state,
        answers: { ...state.answers, [action.questionId]: action.value },
      };
    case "submit":
      return { ...state, submitted: true };
    case "clear":
      return { answers: {}, submitted: false };
    case "__RESET__":
      return action.newState;
    default:
      return state;
  }
}
