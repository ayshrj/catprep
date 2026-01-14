export type KenKenOp = "+" | "-" | "x" | "/" | "=";

export type KenKenCell = { r: number; c: number };

export type KenKenCage = {
  id: string;
  target: number;
  op: KenKenOp;
  cells: KenKenCell[];
};

export type KenKenPuzzle = {
  size: number; // N
  cages: KenKenCage[];
  solution: number[][];
};

export type KenKenState = {
  grid: number[][];
  pencil: number[][][]; // [r][c] -> candidates
  selected: KenKenCell;
  pencilMode: boolean;
};

export type KenKenAction =
  | { type: "select"; r: number; c: number }
  | { type: "set"; r: number; c: number; value: number }
  | { type: "clear"; r: number; c: number }
  | { type: "togglePencil"; r: number; c: number; value: number }
  | { type: "togglePencilMode" }
  | { type: "__RESET__"; newState: KenKenState };
