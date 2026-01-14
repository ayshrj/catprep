export type SetCard = {
  id: string;
  title: string;
  type: "DI" | "LR" | "Mixed";
  skillTags: string[];
  estimatedMinutes: number; // expected time if attempted
  setupCost: "low" | "medium" | "high";
  computation: "low" | "medium" | "high";
  readability: "clear" | "messy";
  // hidden EV used for scoring
  ev: number;
};

export type SetSelectionPuzzle = {
  id: string;
  scanSeconds: number; // typically 120
  commitSeconds: number; // typically 60
  sets: SetCard[];
  difficulty: number;
};

export type Decision = "attempt" | "skip" | "later";

export type SetSelectionState = {
  phase: "scan" | "commit" | "done";
  scanRemaining: number;
  commitRemaining: number;

  focusedSetId: string | null;
  shortlisted: Record<string, boolean>;
  decisions: Record<string, { decision: Decision; reason: string }>;

  submitted: boolean;
};

export type SetSelectionAction =
  | { type: "tick" }
  | { type: "focus"; setId: string }
  | { type: "toggleShortlist"; setId: string }
  | { type: "startCommit" }
  | { type: "setDecision"; setId: string; decision: Decision }
  | { type: "setReason"; setId: string; reason: string }
  | { type: "finalize" }
  | { type: "__RESET__"; newState: SetSelectionState };
