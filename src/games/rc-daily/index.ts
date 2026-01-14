import type { GameModule } from "../core/types";
import { reduce } from "./engine";
import { evaluate } from "./evaluator";
import { createPuzzle } from "./generator";
import { getHint } from "./hints";
import type { RcDailyAction, RcDailyPuzzle, RcDailyState } from "./types";
import { RcDailyUI } from "./ui";

const rcDaily: GameModule<RcDailyPuzzle, RcDailyState, RcDailyAction> = {
  id: "rcDaily",
  title: "RC Daily",
  section: "varc",
  skillTags: ["Structure", "Inference", "Elimination", "Scope Control"],
  description: "Trains RC structure tracking, inference discipline, and option elimination—core VARC skills for CAT.",
  difficulties: [
    { id: 1, label: "Easy" },
    { id: 2, label: "Medium" },
    { id: 3, label: "Hard" },
  ],
  timeLimitSeconds: 600,

  createPuzzle,
  getInitialState: puzzle => ({
    selectedByQid: Object.fromEntries(puzzle.questions.map(q => [q.id, null])),
    submitted: false,
  }),
  reduce,
  evaluate,
  getHint,
  Component: RcDailyUI,
};

export default rcDaily;
