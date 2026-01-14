import { GameModule } from "../core/types";
import { reduce } from "./engine";
import { evaluate } from "./evaluator";
import { createPuzzle } from "./generator";
import { getHint } from "./hints";
import { SetSelectionAction, SetSelectionPuzzle, SetSelectionState } from "./types";
import { SetSelectionSimulatorUI } from "./ui";

const setSelectionSimulator: GameModule<SetSelectionPuzzle, SetSelectionState, SetSelectionAction> = {
  id: "setSelectionSimulator",
  title: "Set Selection Simulator",
  section: "hybrid",
  skillTags: ["Set selection", "Timeboxing", "Expected value"],
  description:
    "Trains DILR set selection: scan fast, shortlist 2–4, commit to 3–4 max. Builds discipline to avoid sunk-cost switching and low-EV traps.",
  difficulties: [
    { id: 1, label: "Easy (6 sets)" },
    { id: 2, label: "Medium (8 sets)" },
    { id: 3, label: "Hard (10 sets)" },
  ],
  timeLimitSeconds: 180,
  createPuzzle,
  getInitialState: puzzle => ({
    phase: "scan",
    scanRemaining: puzzle.scanSeconds,
    commitRemaining: puzzle.commitSeconds,
    focusedSetId: null,
    shortlisted: {},
    decisions: {},
    submitted: false,
  }),
  reduce,
  evaluate,
  getHint,
  Component: SetSelectionSimulatorUI,
};

export default setSelectionSimulator;
