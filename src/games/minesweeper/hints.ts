import { MinesweeperPuzzle, MinesweeperState } from "./types";

export function getHint(puzzle: MinesweeperPuzzle, state: MinesweeperState) {
  if (!state.initialized) {
    return {
      title: "Hint: First click",
      body: "Your first reveal is safe (and its neighbors too). Start from a corner/edge to open more area.",
    };
  }

  // Find an unrevealed non-mine cell and suggest it (training-mode hint)
  for (let r = 0; r < puzzle.height; r++) {
    for (let c = 0; c < puzzle.width; c++) {
      if (!state.revealed[r][c] && !state.flagged[r][c] && !state.mines[r][c]) {
        return {
          title: "Hint: Safe reveal",
          body: `Try revealing cell (${r + 1}, ${c + 1}). Focus on deducing forced cells first, then open safely.`,
        };
      }
    }
  }

  return {
    title: "Hint",
    body: "No safe unrevealed cells found (unexpected). Re-check flags and number constraints.",
  };
}
