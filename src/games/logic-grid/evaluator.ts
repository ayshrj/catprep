import { GameStatus } from "../core/types";
import { LogicGridPuzzle, LogicGridState } from "./types";

export function evaluate(puzzle: LogicGridPuzzle, state: LogicGridState) {
  const errors: Array<{ type: string; message: string; meta?: any }> = [];
  const R = puzzle.rowCategory.items.length;
  const C = puzzle.colCategory.items.length;

  // Multiple YES in a row or col
  for (let r = 0; r < R; r++) {
    const yesCount = state.marks[r].filter(m => m === "yes").length;
    if (yesCount > 1)
      errors.push({
        type: "row",
        message: `Row "${puzzle.rowCategory.items[r]}" has multiple YES.`,
      });
    if (state.marks[r].every(m => m === "no"))
      errors.push({
        type: "row",
        message: `Row "${puzzle.rowCategory.items[r]}" became impossible (all NO).`,
      });
  }

  for (let c = 0; c < C; c++) {
    let yesCount = 0;
    let allNo = true;
    for (let r = 0; r < R; r++) {
      if (state.marks[r][c] === "yes") yesCount++;
      if (state.marks[r][c] !== "no") allNo = false;
    }
    if (yesCount > 1)
      errors.push({
        type: "col",
        message: `Column "${puzzle.colCategory.items[c]}" has multiple YES.`,
      });
    if (allNo)
      errors.push({
        type: "col",
        message: `Column "${puzzle.colCategory.items[c]}" became impossible (all NO).`,
      });
  }

  // Training mode: if user marks YES contradicting the puzzle's (hidden) solution, log it
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      if (state.marks[r][c] === "yes" && puzzle.solution[r] !== c) {
        errors.push({
          type: "wrongYes",
          message: `"${puzzle.rowCategory.items[r]}" cannot be "${puzzle.colCategory.items[c]}" (according to solution).`,
        });
      }
    }
  }

  const solved = (() => {
    // solved when each row has exactly one YES and all YES match solution
    for (let r = 0; r < R; r++) {
      const yesCols = state.marks[r].map((m, idx) => (m === "yes" ? idx : -1)).filter(x => x >= 0);
      if (yesCols.length !== 1) return false;
      if (yesCols[0] !== puzzle.solution[r]) return false;
    }
    // also unique columns
    const used = new Set<number>(puzzle.solution);
    if (used.size !== R) return false;
    return true;
  })();

  const status: GameStatus = solved && errors.length === 0 ? "solved" : "inProgress";

  return {
    status,
    errors,
    scoreDelta: solved && errors.length === 0 ? 130 : 0,
  };
}
