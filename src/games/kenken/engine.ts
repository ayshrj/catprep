import { KenKenAction, KenKenState } from "./types";

export function reduce(state: KenKenState, action: KenKenAction): KenKenState {
  switch (action.type) {
    case "select":
      return { ...state, selected: { r: action.r, c: action.c } };

    case "set": {
      const { r, c, value } = action;
      const n = state.grid.length;
      if (value < 1 || value > n) return state;

      const grid = state.grid.map(row => row.slice());
      grid[r][c] = value;

      const pencil = state.pencil.map(row => row.map(cell => cell.slice()));
      pencil[r][c] = [];

      return { ...state, grid, pencil };
    }

    case "clear": {
      const { r, c } = action;
      const grid = state.grid.map(row => row.slice());
      grid[r][c] = 0;

      const pencil = state.pencil.map(row => row.map(cell => cell.slice()));
      pencil[r][c] = [];
      return { ...state, grid, pencil };
    }

    case "togglePencil": {
      const { r, c, value } = action;
      const n = state.grid.length;
      if (value < 1 || value > n) return state;
      if (state.grid[r][c] !== 0) return state;

      const pencil = state.pencil.map(row => row.map(cell => cell.slice()));
      const list = pencil[r][c];
      const idx = list.indexOf(value);
      if (idx >= 0) list.splice(idx, 1);
      else list.push(value);
      list.sort((a, b) => a - b);

      return { ...state, pencil };
    }

    case "togglePencilMode":
      return { ...state, pencilMode: !state.pencilMode };

    case "__RESET__":
      return action.newState;

    default:
      return state;
  }
}
