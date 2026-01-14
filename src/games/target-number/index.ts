import { GameModule } from "../core/types";
import { reduce } from "./engine";
import { evaluate } from "./evaluator";
import { createPuzzle } from "./generator";
import { getHint } from "./hints";
import { TargetNumberAction, TargetNumberPuzzle, TargetNumberState } from "./types";
import { TargetNumberUI } from "./ui";

const moduleDef: GameModule<TargetNumberPuzzle, TargetNumberState, TargetNumberAction> = {
  id: "targetNumber",
  title: "Target Number",
  section: "qa",
  skillTags: ["Operations fluency", "Number sense", "Planning"],
  description:
    "This is like CAT QA calculation under pressure: choose an efficient sequence of operations, avoid traps, and reach the exact target.",
  difficulties: [
    { id: 1, label: "Easy" },
    { id: 2, label: "Medium" },
    { id: 3, label: "Hard" },
  ],
  createPuzzle,
  getInitialState: puzzle => ({
    currentNumbers: [...puzzle.numbers],
    originalNumbers: [...puzzle.numbers],
    target: puzzle.target,
    firstIndex: null,
    secondIndex: null,
    operator: null,
    steps: [],
  }),
  reduce,
  evaluate,
  getHint,
  Component: TargetNumberUI,
};

export default moduleDef;
