import { GameModule } from "../core/types";
import { reduce } from "./engine";
import { evaluate } from "./evaluator";
import { createPuzzle } from "./generator";
import { getHint } from "./hints";
import { SudokuAction, SudokuPuzzle, SudokuState } from "./types";
import { SudokuUI } from "./ui";

const SudokuGame: GameModule<SudokuPuzzle, SudokuState, SudokuAction> = {
  id: "sudoku",
  title: "Sudoku",
  section: "dilr",
  skillTags: ["Deductive Reasoning", "Pattern Recognition", "Concentration"],
  description:
    "Solving Sudoku puzzles builds analytical deduction skills, pattern recognition, and concentration, which are valuable for DILR section challenges.",
  difficulties: [
    { id: 1, label: "Easy" },
    { id: 2, label: "Medium" },
    { id: 3, label: "Hard" },
  ],
  createPuzzle: createPuzzle,
  getInitialState: puzzle => {
    // Initialize state from puzzle
    const gridCopy = puzzle.initialGrid.map(row => row.slice());
    const pencilMarks = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => [] as number[]));
    const fixed = puzzle.initialGrid.map(row => row.map(val => val !== 0));
    return {
      grid: gridCopy,
      pencilMarks,
      selectedCell: { row: 0, col: 0 },
      pencilMode: false,
      fixed,
    };
  },
  reduce: reduce,
  evaluate: evaluate,
  getHint: getHint,
  Component: SudokuUI,
};

export default SudokuGame;
