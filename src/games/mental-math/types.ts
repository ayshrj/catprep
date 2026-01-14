export type Question = {
  id: string;
  prompt: string;
  answer: number;
  tolerance: number; // allowed absolute error
  hint: string;
};

export type MentalMathPuzzle = {
  questions: Question[];
  perQuestionSeconds?: number;
};

export type MentalMathState = {
  index: number;
  input: string;
  submitted: boolean[]; // per question
  correct: (boolean | null)[]; // per question
  answers: string[]; // raw typed answers
  lastMessage: string | null; // for evaluator errors
};

export type MentalMathAction =
  | { type: "setInput"; value: string }
  | { type: "submit" }
  | { type: "next" }
  | { type: "prev" }
  | { type: "jump"; index: number }
  | { type: "__RESET__"; newState: MentalMathState };
