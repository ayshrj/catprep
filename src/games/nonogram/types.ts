export type NonogramPuzzle = {
  width: number;
  height: number;
  solution: boolean[][];
  rowClues: number[][];
  colClues: number[][];
};

export type NonogramMark = "blank" | "fill" | "x";

export type NonogramState = {
  marks: NonogramMark[][];
  selected: { r: number; c: number };
  touchMode: "cycle" | "fill" | "x";
};

export type NonogramAction =
  | { type: "select"; r: number; c: number }
  | { type: "cycle"; r: number; c: number }
  | { type: "set"; r: number; c: number; mark: NonogramMark }
  | { type: "toggleMode" }
  | { type: "__RESET__"; newState: NonogramState };
