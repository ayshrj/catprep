export type TwoLineSummaryPuzzle = {
  id: string;
  promptTitle: string;
  passage: string;
  minWords: number;
  maxWords: number;
  requiredKeywords: string[]; // simple heuristic
  sampleGoodSummary: string;
};

export type TwoLineSummaryState = {
  text: string;
  submitted: boolean;
};

export type TwoLineSummaryAction =
  | { type: "setText"; text: string }
  | { type: "submit" }
  | { type: "reset" }
  | { type: "__RESET__"; newState: TwoLineSummaryState };
