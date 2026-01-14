import { GameModule } from "../core/types";
import { reduce } from "./engine";
import { evaluate } from "./evaluator";
import { createPuzzle } from "./generator";
import { getHint } from "./hints";
import { InferenceJudgeAction, InferenceJudgePuzzle, InferenceJudgeState } from "./types";
import { InferenceJudgeUI } from "./ui";

const inferenceJudge: GameModule<InferenceJudgePuzzle, InferenceJudgeState, InferenceJudgeAction> = {
  id: "inferenceJudge",
  title: "Inference Judge",
  section: "varc",
  skillTags: ["Must-be-true", "Assumption Control", "Elimination"],
  description:
    "Builds CAT RC inference discipline: choose only what is strictly entailed by the passage and eliminate options requiring extra assumptions.",
  difficulties: [
    { id: 1, label: "Easy" },
    { id: 2, label: "Medium" },
    { id: 3, label: "Hard" },
  ],
  createPuzzle,
  getInitialState: () => ({
    selectedOptionId: null,
    notes: "",
    submitted: false,
  }),
  reduce,
  evaluate,
  getHint,
  Component: InferenceJudgeUI,
};

export default inferenceJudge;
