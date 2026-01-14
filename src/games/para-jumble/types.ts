export type ParaJumblePuzzle = {
  id: string;
  title: string;
  sentences: string[];
  correctOrder: number[]; // indices into sentences
  explanation: string;
};

export type ParaJumbleState = {
  order: number[]; // current ordering of sentence indices
  submitted: boolean;
  focusedIndex: number; // for keyboard reordering
};

export type ParaJumbleAction =
  | { type: "reorder"; from: number; to: number }
  | { type: "setFocused"; index: number }
  | { type: "submit" }
  | { type: "reset" }
  | { type: "__RESET__"; newState: ParaJumbleState };
