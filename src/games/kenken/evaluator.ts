import { GameStatus } from "../core/types";
import { KenKenPuzzle, KenKenState } from "./types";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function cageAnchorCells(puzzle: KenKenPuzzle) {
  const anchorByCageId: Record<string, { r: number; c: number }> = {};
  for (const cage of puzzle.cages) {
    const sorted = cage.cells.slice().sort((a, b) => a.r - b.r || a.c - b.c);
    anchorByCageId[cage.id] = sorted[0];
  }
  return anchorByCageId;
}

export function evaluate(puzzle: KenKenPuzzle, state: KenKenState) {
  const errors: Array<{ type: string; message: string; meta?: any }> = [];
  const n = puzzle.size;
  const g = state.grid;

  // Row/col uniqueness (ignore zeros)
  for (let r = 0; r < n; r++) {
    const seen = new Map<number, number>();
    for (let c = 0; c < n; c++) {
      const v = g[r][c];
      if (v === 0) continue;
      seen.set(v, (seen.get(v) ?? 0) + 1);
    }
    for (const [v, count] of seen.entries()) {
      if (count > 1)
        errors.push({
          type: "rowConflict",
          message: `Row ${r + 1} has duplicate ${v}.`,
        });
    }
  }

  for (let c = 0; c < n; c++) {
    const seen = new Map<number, number>();
    for (let r = 0; r < n; r++) {
      const v = g[r][c];
      if (v === 0) continue;
      seen.set(v, (seen.get(v) ?? 0) + 1);
    }
    for (const [v, count] of seen.entries()) {
      if (count > 1)
        errors.push({
          type: "colConflict",
          message: `Column ${c + 1} has duplicate ${v}.`,
        });
    }
  }

  // Cage constraints
  for (const cage of puzzle.cages) {
    const values = cage.cells.map(({ r, c }) => g[r][c]);
    const filled = values.filter(v => v !== 0);

    if (cage.op === "=") {
      if (filled.length === 1 && filled[0] !== cage.target) {
        errors.push({
          type: "cage",
          message: `Cage ${cage.target} must be ${cage.target}.`,
        });
      }
      continue;
    }

    if (cage.op === "+") {
      const sum = filled.reduce((s, v) => s + v, 0);
      if (sum > cage.target)
        errors.push({
          type: "cage",
          message: `Cage ${cage.target}+ exceeded (sum=${sum}).`,
        });
      if (filled.length === values.length && sum !== cage.target) {
        errors.push({
          type: "cage",
          message: `Cage ${cage.target}+ is incorrect (sum=${sum}).`,
        });
      }
      continue;
    }

    if (cage.op === "x") {
      const prod = filled.reduce((p, v) => p * v, 1);
      if (filled.length > 0 && prod > cage.target)
        errors.push({
          type: "cage",
          message: `Cage ${cage.target}x exceeded (prod=${prod}).`,
        });
      if (filled.length === values.length && prod !== cage.target) {
        errors.push({
          type: "cage",
          message: `Cage ${cage.target}x is incorrect (prod=${prod}).`,
        });
      }
      continue;
    }

    // - or / are meaningful for 2-cell cages
    if (values.length === 2 && filled.length === 2) {
      const [a, b] = values;
      if (cage.op === "-") {
        if (Math.abs(a - b) !== cage.target)
          errors.push({
            type: "cage",
            message: `Cage ${cage.target}- is incorrect.`,
          });
      } else if (cage.op === "/") {
        const hi = Math.max(a, b);
        const lo = Math.min(a, b);
        if (lo === 0 || hi / lo !== cage.target)
          errors.push({
            type: "cage",
            message: `Cage ${cage.target}/ is incorrect.`,
          });
      }
    }
  }

  const allFilled = g.every(row => row.every(v => v !== 0));
  const status: GameStatus = allFilled && errors.length === 0 ? "solved" : "inProgress";

  return {
    status,
    errors,
    scoreDelta: status === "solved" ? 120 : 0,
  };
}
