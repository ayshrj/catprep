import { GameModule } from "../core/types";
import { reduce } from "./engine";
import { evaluate } from "./evaluator";
import { createPuzzle } from "./generator";
import { getHint } from "./hints";
import type { NonogramAction, NonogramPuzzle, NonogramState } from "./types";
import { NonogramUI } from "./ui";

const nonogram: GameModule<NonogramPuzzle, NonogramState, NonogramAction> = {
  id: "nonogram",
  title: "Nonogram (Picross)",
  section: "dilr",
  skillTags: ["Pattern Inference", "Row/Column Constraints", "Elimination"],
  description:
    "Nonograms train row/column constraint reasoning and careful inference from compressed information—useful for CAT DILR where you deduce structure from partial aggregates.",
  difficulties: [
    { id: 1, label: "Easy (5x5)" },
    { id: 2, label: "Medium (7x7)" },
    { id: 3, label: "Hard (10x10)" },
  ],
  createPuzzle,
  getInitialState: puzzle => ({
    marks: Array.from({ length: puzzle.height }, () => Array.from({ length: puzzle.width }, () => "blank" as const)),
    selected: { r: 0, c: 0 },
    touchMode: "cycle",
  }),
  reduce,
  evaluate,
  getHint,
  Component: NonogramUI,
};

export default nonogram;
