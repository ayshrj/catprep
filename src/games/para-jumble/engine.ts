import type { ParaJumbleAction, ParaJumbleState } from "./types";

function move<T>(arr: T[], from: number, to: number): T[] {
  const next = arr.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function reduce(state: ParaJumbleState, action: ParaJumbleAction): ParaJumbleState {
  switch (action.type) {
    case "reorder": {
      const from = action.from;
      const to = action.to;
      if (from === to) return state;
      if (from < 0 || to < 0 || from >= state.order.length || to >= state.order.length) return state;
      return { ...state, order: move(state.order, from, to), focusedIndex: to };
    }
    case "setFocused":
      return { ...state, focusedIndex: action.index };
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
