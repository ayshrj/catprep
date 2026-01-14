export type TargetNumberPuzzle = {
  target: number;
  numbers: number[];
  solution: string;
};

export type TargetNumberState = {
  currentNumbers: number[];
  originalNumbers: number[];
  target: number;

  firstIndex: number | null;
  secondIndex: number | null;
  operator: string | null;

  steps: string[];
};

export type TargetNumberAction =
  | { type: "selectNumber"; index: number }
  | { type: "selectOperator"; operator: string }
  | { type: "applyStep" }
  | { type: "reset" }
  | { type: "__RESET__"; newState: TargetNumberState };
