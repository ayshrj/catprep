export type ParaSummaryPuzzle = {
  id: string;
  title: string;
  passage: string;
  options: Array<{ id: string; text: string }>;
  correctOptionId: string;
  explanation: string;
};

export type ParaSummaryState = {
  selectedOptionId: string | null;
  submitted: boolean;
};

export type ParaSummaryAction =
  | { type: "select"; optionId: string }
  | { type: "submit" }
  | { type: "reset" }
  | { type: "__RESET__"; newState: ParaSummaryState };
