export type InferenceOption = {
  id: "A" | "B" | "C" | "D";
  text: string;
  why: string; // explanation shown on review
};

export type InferenceJudgePuzzle = {
  id: string;
  passage: string;
  question: string;
  options: InferenceOption[];
  correctOptionId: InferenceOption["id"];
  difficulty: number;
};

export type InferenceJudgeState = {
  selectedOptionId: InferenceOption["id"] | null;
  notes: string;
  submitted: boolean;
};

export type InferenceJudgeAction =
  | { type: "select"; optionId: InferenceOption["id"] }
  | { type: "setNotes"; value: string }
  | { type: "submit" }
  | { type: "clear" }
  | { type: "__RESET__"; newState: InferenceJudgeState };
