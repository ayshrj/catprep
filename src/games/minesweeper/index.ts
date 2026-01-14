import { GameModule } from "../core/types";
import { reduceWithPuzzle } from "./engine";
import { evaluate } from "./evaluator";
import { createPuzzle } from "./generator";
import { getHint } from "./hints";
import type { MinesweeperAction, MinesweeperPuzzle, MinesweeperState } from "./types";
import { MinesweeperUI } from "./ui";

type MinesStateWithPuzzle = MinesweeperState & { __puzzle: MinesweeperPuzzle };

const minesweeper: GameModule<MinesweeperPuzzle, MinesStateWithPuzzle, MinesweeperAction> = {
  id: "minesweeper",
  title: "Minesweeper",
  section: "dilr",
  skillTags: ["Deduction", "Risk Control", "Local Constraints"],
  description:
    "Minesweeper trains local constraint deduction and risk control: you infer hidden structure from limited signals—similar to CAT DILR sets where each inference must be justified.",
  difficulties: [
    { id: 1, label: "Easy (9x9)" },
    { id: 2, label: "Medium (12x12)" },
    { id: 3, label: "Hard (16x16)" },
  ],
  createPuzzle,
  getInitialState: puzzle => ({
    __puzzle: puzzle,
    initialized: false,
    mines: Array.from({ length: puzzle.height }, () => Array(puzzle.width).fill(false)),
    numbers: Array.from({ length: puzzle.height }, () => Array(puzzle.width).fill(0)),
    revealed: Array.from({ length: puzzle.height }, () => Array(puzzle.width).fill(false)),
    flagged: Array.from({ length: puzzle.height }, () => Array(puzzle.width).fill(false)),
    selected: { r: 0, c: 0 },
    touchMode: "reveal",
    status: "inProgress",
    revealedCount: 0,
  }),
  reduce: (state, action) => {
    const next = reduceWithPuzzle(state.__puzzle, state, action);
    if (action.type === "__RESET__") return next as MinesStateWithPuzzle;
    return { ...(next as MinesweeperState), __puzzle: state.__puzzle };
  },
  evaluate: (puzzle, state) => evaluate(puzzle, state),
  getHint,
  Component: MinesweeperUI,
};

export default minesweeper;
