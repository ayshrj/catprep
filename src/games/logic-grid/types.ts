export type LogicCellMark = "blank" | "yes" | "no" | "maybe";

export type LogicGridPuzzle = {
  rowCategory: { name: string; items: string[] };
  colCategory: { name: string; items: string[] };
  clues: string[];
  // solution[rowIndex] = colIndex
  solution: number[];
};

export type LogicGridState = {
  marks: LogicCellMark[][];
  selected: { r: number; c: number };
  notes: string;
};

export type LogicGridAction =
  | { type: "select"; r: number; c: number }
  | { type: "cycle"; r: number; c: number }
  | { type: "setMark"; r: number; c: number; mark: LogicCellMark }
  | { type: "setNotes"; notes: string }
  | { type: "__RESET__"; newState: LogicGridState };
