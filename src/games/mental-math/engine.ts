import { MentalMathAction, MentalMathState } from "./types";

export function reduce(state: MentalMathState, action: MentalMathAction): MentalMathState {
  switch (action.type) {
    case "setInput":
      return { ...state, input: action.value, lastMessage: null };

    case "submit": {
      // correctness computed in evaluator? we compute here for immediate UX? contract allows either.
      // We'll store the raw answer and set submitted=true; correctness determined in evaluator for source of truth.
      if (state.submitted[state.index]) return state;

      const answers = [...state.answers];
      answers[state.index] = state.input.trim();
      const submitted = [...state.submitted];
      submitted[state.index] = true;

      return {
        ...state,
        answers,
        submitted,
        input: "",
        lastMessage: null,
      };
    }

    case "next": {
      const next = Math.min(state.index + 1, state.submitted.length - 1);
      return {
        ...state,
        index: next,
        input: state.submitted[next] ? "" : state.input,
        lastMessage: null,
      };
    }

    case "prev": {
      const prev = Math.max(state.index - 1, 0);
      return {
        ...state,
        index: prev,
        input: state.submitted[prev] ? "" : state.input,
        lastMessage: null,
      };
    }

    case "jump": {
      const idx = Math.max(0, Math.min(action.index, state.submitted.length - 1));
      return {
        ...state,
        index: idx,
        input: state.submitted[idx] ? "" : state.input,
        lastMessage: null,
      };
    }

    case "__RESET__":
      return action.newState;

    default:
      return state;
  }
}
