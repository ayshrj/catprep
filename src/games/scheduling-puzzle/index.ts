import { GameModule } from "../core/types";
import { reduce } from "./engine";
import { evaluate } from "./evaluator";
import { createPuzzle } from "./generator";
import { getHint } from "./hints";
import type { SchedulingAction, SchedulingPuzzle, SchedulingState } from "./types";
import { SchedulingUI } from "./ui";

const schedulingPuzzle: GameModule<SchedulingPuzzle, SchedulingState, SchedulingAction> = {
  id: "schedulingPuzzle",
  title: "Scheduling Grid Puzzle",
  section: "dilr",
  skillTags: ["Timeline Constraints", "Ordering", "Adjacency Logic"],
  description:
    "This trains CAT scheduling/arrangement sets: build a timeline, translate statements into constraints, and eliminate systematically before committing.",
  difficulties: [
    { id: 1, label: "Easy (4 slots)" },
    { id: 2, label: "Medium (5 slots)" },
    { id: 3, label: "Hard (6 slots)" },
  ],
  createPuzzle,
  getInitialState: puzzle => ({
    selectedSlot: 0,
    assignment: Array.from({ length: puzzle.slots.length }, () => null),
    notes: "",
  }),
  reduce,
  evaluate,
  getHint,
  Component: SchedulingUI,
};

export default schedulingPuzzle;
