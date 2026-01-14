export type RcOption = { id: string; text: string };
export type RcQuestion = {
  id: string;
  prompt: string;
  options: RcOption[];
  correctOptionId: string;
  explanation: string;
};

export type RcDailyPuzzle = {
  id: string;
  title: string;
  passage: string;
  questions: RcQuestion[];
  difficulty: number;
  strategyNote: string;
};

export type RcDailyState = {
  selectedByQid: Record<string, string | null>;
  submitted: boolean;
};

export type RcDailyAction =
  | { type: "select"; qid: string; optionId: string }
  | { type: "submit" }
  | { type: "reset" }
  | { type: "__RESET__"; newState: RcDailyState };
