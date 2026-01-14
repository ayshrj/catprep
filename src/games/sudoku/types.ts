export type SudokuPuzzle = {
  initialGrid: number[][];
  solvedGrid?: number[][];
};

export type SudokuState = {
  grid: number[][]; // current grid values (0 = blank)
  pencilMarks: number[][][]; // pencil marks for each cell (array of possible numbers)
  selectedCell: { row: number; col: number };
  pencilMode: boolean;
  fixed: boolean[][]; // fixed clue cells (non-editable)
};

export type SudokuAction =
  | { type: "selectCell"; row: number; col: number }
  | { type: "setValue"; row: number; col: number; value: number }
  | { type: "clearValue"; row: number; col: number }
  | { type: "togglePencil"; row: number; col: number; value: number }
  | { type: "togglePencilMode" }
  | { type: "__RESET__"; newState: SudokuState };
