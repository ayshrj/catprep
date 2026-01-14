export type DITable = {
  headers: string[]; // e.g., ["Quarter", "Product A", "Product B"]
  rows: Array<{ label: string; values: number[] }>; // values length = headers.length - 1
};

export type DIQuestion = {
  id: string;
  prompt: string;
  answer: number;
  tolerance?: number; // default: 0.01
  unit?: string; // optional display
  solution: string;
};

export type DICaseletPuzzle = {
  id: string;
  title: string;
  caselet: string;
  table: DITable;
  questions: DIQuestion[];
  difficulty: number;
};

export type DICaseletState = {
  answers: Record<string, string>; // raw input strings
  submitted: boolean;
};

export type DICaseletAction =
  | { type: "setAnswer"; questionId: string; value: string }
  | { type: "submit" }
  | { type: "clear" }
  | { type: "__RESET__"; newState: DICaseletState };
