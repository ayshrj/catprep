import { SudokuAction, SudokuState } from "./types";

export function reduce(state: SudokuState, action: SudokuAction): SudokuState {
  switch (action.type) {
    case "selectCell": {
      const { row, col } = action;
      return { ...state, selectedCell: { row, col } };
    }
    case "setValue": {
      const { row, col, value } = action;
      if (state.fixed[row][col]) return state; // ignore if cell is a fixed clue
      const newGrid = state.grid.map(r => r.slice());
      newGrid[row][col] = value;
      // Clear pencil marks for that cell
      const newPencilMarks = state.pencilMarks.map(rowMarks => rowMarks.map(marks => marks.slice()));
      newPencilMarks[row][col] = [];
      return { ...state, grid: newGrid, pencilMarks: newPencilMarks };
    }
    case "clearValue": {
      const { row, col } = action;
      if (state.fixed[row][col]) return state;
      if (state.grid[row][col] === 0) {
        // Already empty: just clear any pencil marks
        const newPencilMarks = state.pencilMarks.map(rowMarks => rowMarks.map(marks => marks.slice()));
        newPencilMarks[row][col] = [];
        return { ...state, pencilMarks: newPencilMarks };
      }
      const newGrid = state.grid.map(r => r.slice());
      newGrid[row][col] = 0;
      const newPencilMarks = state.pencilMarks.map(rowMarks => rowMarks.map(marks => marks.slice()));
      newPencilMarks[row][col] = [];
      return { ...state, grid: newGrid, pencilMarks: newPencilMarks };
    }
    case "togglePencil": {
      const { row, col, value } = action;
      if (state.fixed[row][col] || state.grid[row][col] !== 0) return state;
      const newPencilMarks = state.pencilMarks.map(rowMarks => rowMarks.map(marks => marks.slice()));
      const marks = newPencilMarks[row][col];
      const idx = marks.indexOf(value);
      if (idx >= 0) {
        marks.splice(idx, 1);
      } else {
        marks.push(value);
        marks.sort();
      }
      return { ...state, pencilMarks: newPencilMarks };
    }
    case "togglePencilMode": {
      return { ...state, pencilMode: !state.pencilMode };
    }
    case "__RESET__": {
      return action.newState;
    }
    default:
      return state;
  }
}
