import { GameModule } from "../core/types";
import { reduce } from "./engine";
import { evaluate } from "./evaluator";
import { createPuzzle } from "./generator";
import { getHint } from "./hints";
import { LogicGridAction, LogicGridPuzzle, LogicGridState } from "./types";
import { LogicGridUI } from "./ui";

const logicGrid: GameModule<LogicGridPuzzle, LogicGridState, LogicGridAction> = {
  id: "logicGrid",
  title: "Logic Grid (Zebra Mini)",
  section: "dilr",
  skillTags: ["Table-Making", "Elimination", "Deduction Discipline"],
  description:
    "Logic grids force structured elimination and consistent table updates—exactly the discipline needed for CAT DILR sets involving assignments, matches, and constraints.",
  difficulties: [
    { id: 1, label: "Easy" },
    { id: 2, label: "Medium" },
    { id: 3, label: "Hard" },
  ],
  createPuzzle,
  getInitialState: puzzle => {
    const R = puzzle.rowCategory.items.length;
    const C = puzzle.colCategory.items.length;
    return {
      marks: Array.from({ length: R }, () => Array.from({ length: C }, () => "blank" as const)),
      selected: { r: 0, c: 0 },
      notes: "",
    };
  },
  reduce,
  evaluate,
  getHint,
  Component: LogicGridUI,
};

export default logicGrid;
