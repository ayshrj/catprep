import { SudokuPuzzle, SudokuState } from "./types";

export function evaluate(puzzle: SudokuPuzzle, state: SudokuState) {
  const errors: Array<{ type: string; message: string }> = [];
  const grid = state.grid;
  const N = 9;
  // Check rows for duplicates
  for (let r = 0; r < N; r++) {
    const seen: Record<number, number> = {};
    for (let c = 0; c < N; c++) {
      const val = grid[r][c];
      if (val !== 0) seen[val] = (seen[val] || 0) + 1;
    }
    for (const [valStr, count] of Object.entries(seen)) {
      if (count > 1) {
        errors.push({
          type: "rowConflict",
          message: `Row ${r + 1} has duplicate ${valStr}`,
        });
      }
    }
  }
  // Check columns for duplicates
  for (let c = 0; c < N; c++) {
    const seen: Record<number, number> = {};
    for (let r = 0; r < N; r++) {
      const val = grid[r][c];
      if (val !== 0) seen[val] = (seen[val] || 0) + 1;
    }
    for (const [valStr, count] of Object.entries(seen)) {
      if (count > 1) {
        errors.push({
          type: "colConflict",
          message: `Column ${c + 1} has duplicate ${valStr}`,
        });
      }
    }
  }
  // Check 3x3 subgrids for duplicates
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      const seen: Record<number, number> = {};
      for (let r = br * 3; r < br * 3 + 3; r++) {
        for (let c = bc * 3; c < bc * 3 + 3; c++) {
          const val = grid[r][c];
          if (val !== 0) seen[val] = (seen[val] || 0) + 1;
        }
      }
      for (const [valStr, count] of Object.entries(seen)) {
        if (count > 1) {
          errors.push({
            type: "blockConflict",
            message: `Block (${br * 3 + 1}-${br * 3 + 3}, ${bc * 3 + 1}-${bc * 3 + 3}) has duplicate ${valStr}`,
          });
        }
      }
    }
  }
  const allFilled = grid.every(row => row.every(val => val !== 0));
  const status: "inProgress" | "solved" | "failed" = errors.length === 0 && allFilled ? "solved" : "inProgress";
  return { status, errors, scoreDelta: status === "solved" ? 100 : 0 };
}
