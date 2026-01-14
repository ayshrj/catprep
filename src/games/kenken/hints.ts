import { KenKenPuzzle, KenKenState } from "./types";

export function getHint(puzzle: KenKenPuzzle, state: KenKenState) {
  // Reveal selected cell solution if empty, else find first empty cell
  const { r, c } = state.selected;
  const n = puzzle.size;

  const tryCell = (rr: number, cc: number) => {
    if (state.grid[rr][cc] === 0) {
      const v = puzzle.solution[rr][cc];
      return {
        title: "Hint: Reveal a value",
        body: `Cell (${rr + 1},${cc + 1}) is ${v}. Try using this to satisfy its cage and keep row/col uniqueness.`,
      };
    }
    return null;
  };

  const direct = tryCell(r, c);
  if (direct) return direct;

  for (let rr = 0; rr < n; rr++) {
    for (let cc = 0; cc < n; cc++) {
      const h = tryCell(rr, cc);
      if (h) return h;
    }
  }

  return {
    title: "Hint",
    body: "Board is full. Validate cage constraints and uniqueness.",
  };
}
