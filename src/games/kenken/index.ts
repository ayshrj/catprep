import { GameModule } from "../core/types";
import { reduce } from "./engine";
import { evaluate } from "./evaluator";
import { createPuzzle } from "./generator";
import { getHint } from "./hints";
import { KenKenAction, KenKenPuzzle, KenKenState } from "./types";
import { KenKenUI } from "./ui";

const kenken: GameModule<KenKenPuzzle, KenKenState, KenKenAction> = {
  id: "kenken",
  title: "KenKen (Calcudoku)",
  section: "dilr",
  skillTags: ["Constraint Processing", "Deduction", "Arithmetic under Rules"],
  description:
    "KenKen trains constraint satisfaction: you must satisfy cage arithmetic while maintaining row/column uniqueness. This mirrors CAT DILR deduction, grid-based constraints, and disciplined elimination.",
  difficulties: [
    { id: 1, label: "Easy (4x4)" },
    { id: 2, label: "Medium (5x5)" },
    { id: 3, label: "Hard (6x6)" },
  ],
  createPuzzle,
  getInitialState: puzzle => {
    const n = puzzle.size;
    return {
      grid: Array.from({ length: n }, () => Array(n).fill(0)),
      pencil: Array.from({ length: n }, () => Array.from({ length: n }, () => [] as number[])),
      selected: { r: 0, c: 0 },
      pencilMode: false,
    };
  },
  reduce,
  evaluate,
  getHint,
  Component: KenKenUI,
};

export default kenken;
