import type { GameModule } from "../core/types";
import { reduce } from "./engine";
import { evaluate } from "./evaluator";
import { createPuzzle } from "./generator";
import { getHint } from "./hints";
import type { TwoLineSummaryAction, TwoLineSummaryPuzzle, TwoLineSummaryState } from "./types";
import { TwoLineSummaryUI } from "./ui";

const twoLineSummary: GameModule<TwoLineSummaryPuzzle, TwoLineSummaryState, TwoLineSummaryAction> = {
  id: "twoLineSummary",
  title: "Two-Line Summary Sprint",
  section: "varc",
  skillTags: ["Compression", "Scope Control", "Main Idea"],
  description:
    "Builds VARC 'summary discipline'—writing minimal, accurate summaries under word constraints without drifting in scope.",
  difficulties: [
    { id: 1, label: "Easy" },
    { id: 2, label: "Medium" },
    { id: 3, label: "Hard" },
  ],
  timeLimitSeconds: 300,

  createPuzzle,
  getInitialState: () => ({ text: "", submitted: false }),
  reduce,
  evaluate,
  getHint,
  Component: TwoLineSummaryUI,
};

export default twoLineSummary;
