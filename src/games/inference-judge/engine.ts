import { InferenceJudgeAction, InferenceJudgeState } from "./types";

export function reduce(state: InferenceJudgeState, action: InferenceJudgeAction): InferenceJudgeState {
  switch (action.type) {
    case "select":
      return { ...state, selectedOptionId: action.optionId };
    case "setNotes":
      return { ...state, notes: action.value };
    case "submit":
      return { ...state, submitted: true };
    case "clear":
      return { selectedOptionId: null, notes: "", submitted: false };
    case "__RESET__":
      return action.newState;
    default:
      return state;
  }
}
