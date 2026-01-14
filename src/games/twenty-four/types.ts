export type TwentyFourPuzzle = {
  numbers: number[];
  solution?: string; // a known solution expression for hints
};

export type TwentyFourState = {
  currentNumbers: number[];
  firstIndex: number | null;
  secondIndex: number | null;
  operator: string | null;
  originalNumbers: number[];
};

export type TwentyFourAction =
  | { type: "selectNumber"; index: number }
  | { type: "selectOperator"; operator: string }
  | { type: "applyStep" }
  | { type: "resetExpression" }
  | { type: "__RESET__"; newState: TwentyFourState };
