import { LogicCellMark, LogicGridAction, LogicGridState } from "./types";

const CYCLE: LogicCellMark[] = ["blank", "yes", "no", "maybe"];

function nextMark(m: LogicCellMark): LogicCellMark {
  const idx = CYCLE.indexOf(m);
  return CYCLE[(idx + 1) % CYCLE.length];
}

export function reduce(state: LogicGridState, action: LogicGridAction): LogicGridState {
  switch (action.type) {
    case "select":
      return { ...state, selected: { r: action.r, c: action.c } };

    case "setNotes":
      return { ...state, notes: action.notes };

    case "setMark": {
      const marks = state.marks.map(row => row.slice());
      marks[action.r][action.c] = action.mark;

      // If setting YES, enforce one-to-one: other cells in same row/col -> NO
      if (action.mark === "yes") {
        const r = action.r,
          c = action.c;

        for (let cc = 0; cc < marks[r].length; cc++) {
          if (cc !== c) marks[r][cc] = "no";
        }
        for (let rr = 0; rr < marks.length; rr++) {
          if (rr !== r) marks[rr][c] = "no";
        }
      }

      return { ...state, marks };
    }

    case "cycle": {
      const r = action.r,
        c = action.c;
      const cur = state.marks[r][c];
      const nm = nextMark(cur);
      return reduce(state, { type: "setMark", r, c, mark: nm });
    }

    case "__RESET__":
      return action.newState;

    default:
      return state;
  }
}
