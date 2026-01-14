import { SudokuPuzzle, SudokuState } from "./types";

export function getHint(puzzle: SudokuPuzzle, state: SudokuState) {
  const grid = state.grid;
  const N = 9;
  let bestCell: { r: number; c: number } | null = null;
  let bestCandidates: number[] = [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (grid[r][c] === 0) {
        // determine possible candidates for cell (r,c)
        const present = new Set<number>();
        for (let x = 0; x < N; x++) {
          if (grid[r][x] !== 0) present.add(grid[r][x]);
          if (grid[x][c] !== 0) present.add(grid[x][c]);
        }
        const br = Math.floor(r / 3) * 3,
          bc = Math.floor(c / 3) * 3;
        for (let rr = br; rr < br + 3; rr++) {
          for (let cc = bc; cc < bc + 3; cc++) {
            if (grid[rr][cc] !== 0) present.add(grid[rr][cc]);
          }
        }
        const candidates: number[] = [];
        for (let v = 1; v <= 9; v++) {
          if (!present.has(v)) candidates.push(v);
        }
        if (bestCell === null || candidates.length < bestCandidates.length) {
          bestCell = { r, c };
          bestCandidates = candidates;
        }
        if (bestCandidates.length === 1) break; // can't do better than a single option
      }
    }
    if (bestCandidates.length === 1) break;
  }
  if (!bestCell) {
    return { title: "No hints", body: "No available hint at this time." };
  }
  const { r, c } = bestCell;
  if (bestCandidates.length === 1) {
    return {
      title: "Hint: Only one choice",
      body: `Cell (${r + 1},${c + 1}) can only be ${bestCandidates[0]}.`,
    };
  } else {
    return {
      title: "Hint: Possible numbers",
      body: `Cell (${r + 1},${c + 1}) could be one of {${bestCandidates.join(", ")}}.`,
    };
  }
}
