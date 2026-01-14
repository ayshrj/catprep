import { NonogramAction, NonogramMark, NonogramState } from "./types";

function cycle(m: NonogramMark): NonogramMark {
  if (m === "blank") return "fill";
  if (m === "fill") return "x";
  return "blank";
}

export function reduce(state: NonogramState, action: NonogramAction): NonogramState {
  switch (action.type) {
    case "select":
      return { ...state, selected: { r: action.r, c: action.c } };

    case "toggleMode":
      return {
        ...state,
        touchMode: state.touchMode === "cycle" ? "fill" : state.touchMode === "fill" ? "x" : "cycle",
      };

    case "set": {
      const marks = state.marks.map(row => row.slice());
      marks[action.r][action.c] = action.mark;
      return { ...state, marks };
    }

    case "cycle": {
      const r = action.r,
        c = action.c;
      const marks = state.marks.map(row => row.slice());
      marks[r][c] = cycle(marks[r][c]);
      return { ...state, marks };
    }

    case "__RESET__":
      return action.newState;

    default:
      return state;
  }
}
