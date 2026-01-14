import type { GameModule } from "../core/types";
import { reduce } from "./engine";
import { evaluate } from "./evaluator";
import { createPuzzle } from "./generator";
import { getHint } from "./hints";
import type { ParaSummaryAction, ParaSummaryPuzzle, ParaSummaryState } from "./types";
import { ParaSummaryUI } from "./ui";

const paraSummary: GameModule<ParaSummaryPuzzle, ParaSummaryState, ParaSummaryAction> = {
  id: "paraSummary",
  title: "Para-summary MCQ",
  section: "varc",
  skillTags: ["Scope", "Main Idea", "Elimination"],
  description:
    "Trains summary selection discipline: choose options that match thesis + scope without adding new ideas—high-yield CAT VARC skill.",
  difficulties: [
    { id: 1, label: "Easy" },
    { id: 2, label: "Medium" },
    { id: 3, label: "Hard" },
  ],
  timeLimitSeconds: 180,

  createPuzzle,
  getInitialState: () => ({ selectedOptionId: null, submitted: false }),
  reduce,
  evaluate,
  getHint,
  Component: ParaSummaryUI,
};

export default paraSummary;
