export type OddSentenceOutPuzzle = {
  id: string;
  prompt: string;
  sentences: string[]; // typically 5
  oddIndex: number; // 0-based
  rationale: string; // author explanation (for review)
  difficulty: number;
};

export type OddSentenceOutState = {
  selectedIndex: number | null;
  explanation: string;
  submitted: boolean;
};

export type OddSentenceOutAction =
  | { type: "select"; index: number }
  | { type: "setExplanation"; value: string }
  | { type: "submit" }
  | { type: "clearSelection" }
  | { type: "__RESET__"; newState: OddSentenceOutState };
