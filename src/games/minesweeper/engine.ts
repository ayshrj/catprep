import { makeRng } from "../core/rng";
import type { MinesweeperPuzzle } from "./types";
import { MinesweeperAction, MinesweeperState } from "./types";

function inBounds(h: number, w: number, r: number, c: number) {
  return r >= 0 && r < h && c >= 0 && c < w;
}

function neighbors8(h: number, w: number, r: number, c: number) {
  const out: Array<{ r: number; c: number }> = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr,
        nc = c + dc;
      if (inBounds(h, w, nr, nc)) out.push({ r: nr, c: nc });
    }
  }
  return out;
}

function generateBoard(puzzle: MinesweeperPuzzle, firstR: number, firstC: number) {
  const { width: w, height: h, mines: mineCount } = puzzle;
  const rng = makeRng(puzzle.seed ^ (firstR * 1000 + firstC));

  // First click safe area: exclude first cell + its neighbors
  const excluded = new Set<string>();
  excluded.add(`${firstR},${firstC}`);
  for (const nb of neighbors8(h, w, firstR, firstC)) excluded.add(`${nb.r},${nb.c}`);

  const candidates: Array<{ r: number; c: number }> = [];
  for (let r = 0; r < h; r++)
    for (let c = 0; c < w; c++) {
      if (!excluded.has(`${r},${c}`)) candidates.push({ r, c });
    }

  // Shuffle candidates and place mines
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  const mines = Array.from({ length: h }, () => Array(w).fill(false));
  for (let i = 0; i < Math.min(mineCount, candidates.length); i++) {
    const { r, c } = candidates[i];
    mines[r][c] = true;
  }

  const numbers = Array.from({ length: h }, () => Array(w).fill(0));
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      if (mines[r][c]) continue;
      const count = neighbors8(h, w, r, c).reduce((acc, nb) => acc + (mines[nb.r][nb.c] ? 1 : 0), 0);
      numbers[r][c] = count;
    }
  }

  return { mines, numbers };
}

function floodReveal(puzzle: MinesweeperPuzzle, state: MinesweeperState, startR: number, startC: number) {
  const { width: w, height: h } = puzzle;
  const revealed = state.revealed.map(row => row.slice());
  const flagged = state.flagged.map(row => row.slice());

  let revealedCount = state.revealedCount;

  const q: Array<{ r: number; c: number }> = [{ r: startR, c: startC }];
  const seen = new Set<string>();

  while (q.length) {
    const { r, c } = q.shift()!;
    const key = `${r},${c}`;
    if (seen.has(key)) continue;
    seen.add(key);

    if (!inBounds(h, w, r, c)) continue;
    if (flagged[r][c]) continue;
    if (revealed[r][c]) continue;

    revealed[r][c] = true;
    revealedCount++;

    // expand zeros
    if (state.numbers[r][c] === 0) {
      for (const nb of neighbors8(h, w, r, c)) q.push(nb);
    }
  }

  return { revealed, revealedCount };
}

export function reduceWithPuzzle(
  puzzle: MinesweeperPuzzle,
  state: MinesweeperState,
  action: MinesweeperAction
): MinesweeperState {
  if (action.type === "__RESET__") return action.newState;

  switch (action.type) {
    case "select":
      return { ...state, selected: { r: action.r, c: action.c } };

    case "toggleTouchMode":
      return {
        ...state,
        touchMode: state.touchMode === "reveal" ? "flag" : "reveal",
      };

    case "toggleFlag": {
      if (state.status !== "inProgress") return state;
      const { r, c } = action;
      if (state.revealed[r][c]) return state;
      const flagged = state.flagged.map(row => row.slice());
      flagged[r][c] = !flagged[r][c];
      return { ...state, flagged };
    }

    case "reveal": {
      if (state.status !== "inProgress") return state;

      const { r, c } = action;
      if (state.flagged[r][c] || state.revealed[r][c]) return state;

      let next = state;

      if (!state.initialized) {
        const { mines, numbers } = generateBoard(puzzle, r, c);
        next = { ...next, mines, numbers, initialized: true };
      }

      // Hit mine
      if (next.mines[r][c]) {
        const revealed = next.revealed.map(row => row.slice());
        for (let rr = 0; rr < puzzle.height; rr++)
          for (let cc = 0; cc < puzzle.width; cc++) {
            if (next.mines[rr][cc]) revealed[rr][cc] = true;
          }
        return { ...next, revealed, status: "failed" };
      }

      // Safe reveal (+ flood if zero)
      const { revealed, revealedCount } = floodReveal(puzzle, next, r, c);

      const totalSafe = puzzle.width * puzzle.height - puzzle.mines;
      const status = revealedCount >= totalSafe ? "solved" : "inProgress";

      return { ...next, revealed, revealedCount, status };
    }

    default:
      return state;
  }
}
