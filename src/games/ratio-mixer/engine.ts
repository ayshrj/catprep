import { RatioMixerAction, RatioMixerState } from "./types";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function reduce(state: RatioMixerState, action: RatioMixerAction): RatioMixerState {
  switch (action.type) {
    case "setPercentA":
      return {
        ...state,
        percentA: clamp(Math.round(action.value), 0, 100),
      };
    case "nudgePercentA":
      return {
        ...state,
        percentA: clamp(state.percentA + action.delta, 0, 100),
      };
    case "submit":
      return { ...state, submitted: true, lastSubmittedAt: Date.now() };
    case "reset":
      return { ...state, submitted: false };
    case "__RESET__":
      return action.newState;
    default:
      return state;
  }
}
