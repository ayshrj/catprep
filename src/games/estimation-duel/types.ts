export type Round = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  hint: string;
  explanation: string;
};

export type EstimationDuelPuzzle = {
  rounds: Round[];
};

export type EstimationDuelState = {
  index: number;
  selected: number | null;
  answered: (number | null)[]; // selected index per round
  revealed: boolean[]; // submitted per round
};

export type EstimationDuelAction =
  | { type: "select"; optionIndex: number }
  | { type: "submit" }
  | { type: "next" }
  | { type: "prev" }
  | { type: "__RESET__"; newState: EstimationDuelState };
