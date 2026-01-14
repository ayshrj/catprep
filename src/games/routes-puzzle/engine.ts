import { RoutesAction, RoutesState } from "./types";

export function reduce(state: RoutesState, action: RoutesAction): RoutesState {
  switch (action.type) {
    case "appendNode": {
      const last = state.path[state.path.length - 1];
      if (action.nodeId === last) return state;
      return { ...state, path: [...state.path, action.nodeId] };
    }
    case "popNode": {
      if (state.path.length <= 1) return state;
      return { ...state, path: state.path.slice(0, -1) };
    }
    case "clearPath":
      return { ...state, path: [state.path[0]] };
    case "__RESET__":
      return action.newState;
    default:
      return state;
  }
}
