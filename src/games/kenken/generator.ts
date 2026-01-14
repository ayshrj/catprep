import { makeRng } from "../core/rng";
import { KenKenCage, KenKenCell, KenKenOp, KenKenPuzzle } from "./types";

function shuffle<T>(rng: () => number, arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function latinSquare(n: number): number[][] {
  const g: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      g[r][c] = ((r + c) % n) + 1;
    }
  }
  return g;
}

function applyPermutations(seedRng: () => number, base: number[][]): number[][] {
  const n = base.length;
  const rowPerm = shuffle(
    seedRng,
    Array.from({ length: n }, (_, i) => i)
  );
  const colPerm = shuffle(
    seedRng,
    Array.from({ length: n }, (_, i) => i)
  );
  const numPerm = shuffle(
    seedRng,
    Array.from({ length: n }, (_, i) => i + 1)
  );

  const mapped = Array.from({ length: n }, () => Array(n).fill(0));
  for (let rr = 0; rr < n; rr++) {
    for (let cc = 0; cc < n; cc++) {
      const r = rowPerm[rr];
      const c = colPerm[cc];
      const v = base[r][c];
      mapped[rr][cc] = numPerm[v - 1];
    }
  }
  return mapped;
}

function neighbors(n: number, cell: KenKenCell): KenKenCell[] {
  const out: KenKenCell[] = [];
  const { r, c } = cell;
  if (r > 0) out.push({ r: r - 1, c });
  if (r < n - 1) out.push({ r: r + 1, c });
  if (c > 0) out.push({ r, c: c - 1 });
  if (c < n - 1) out.push({ r, c: c + 1 });
  return out;
}

function pickOpForCage(rng: () => number, size: number): KenKenOp {
  if (size === 1) return "=";
  if (size === 2) {
    const ops: KenKenOp[] = ["+", "-", "x", "/"];
    return ops[Math.floor(rng() * ops.length)];
  }
  // size >=3
  return rng() < 0.6 ? "+" : "x";
}

function computeTarget(op: KenKenOp, values: number[]): { op: KenKenOp; target: number } {
  if (values.length === 1) return { op: "=", target: values[0] };

  const [a, b] = values;
  if (values.length === 2) {
    if (op === "+") return { op, target: a + b };
    if (op === "x") return { op, target: a * b };
    if (op === "-") return { op, target: Math.abs(a - b) };
    if (op === "/") {
      const hi = Math.max(a, b);
      const lo = Math.min(a, b);
      if (lo !== 0 && hi % lo === 0) return { op, target: hi / lo };
      // fallback to subtraction if not divisible
      return { op: "-", target: Math.abs(a - b) };
    }
  }

  if (op === "+") return { op, target: values.reduce((s, v) => s + v, 0) };
  // op === "x"
  return { op: "x", target: values.reduce((p, v) => p * v, 1) };
}

function buildCages(opts: { rng: () => number; size: number; solution: number[][]; difficulty: number }): KenKenCage[] {
  const { rng, size: n, solution, difficulty } = opts;
  const maxCage = difficulty <= 1 ? 3 : difficulty === 2 ? 4 : 5;

  const assigned = Array.from({ length: n }, () => Array(n).fill(false));
  const cages: KenKenCage[] = [];
  let cageIndex = 0;

  const allCells: KenKenCell[] = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) allCells.push({ r, c });

  const randomCell = () => {
    const remaining = allCells.filter(x => !assigned[x.r][x.c]);
    return remaining[Math.floor(rng() * remaining.length)];
  };

  while (allCells.some(x => !assigned[x.r][x.c])) {
    const start = randomCell();
    const desiredSize = Math.max(1, Math.min(maxCage, 1 + Math.floor(rng() * maxCage)));
    const cells: KenKenCell[] = [start];
    assigned[start.r][start.c] = true;

    while (cells.length < desiredSize) {
      const frontier: KenKenCell[] = [];
      for (const c of cells) {
        for (const nb of neighbors(n, c)) {
          if (!assigned[nb.r][nb.c]) frontier.push(nb);
        }
      }
      if (frontier.length === 0) break;
      const pick = frontier[Math.floor(rng() * frontier.length)];
      assigned[pick.r][pick.c] = true;
      cells.push(pick);
    }

    const values = cells.map(c => solution[c.r][c.c]);
    let op = pickOpForCage(rng, cells.length);
    const { op: finalOp, target } = computeTarget(op, values);
    op = finalOp;

    cages.push({
      id: `C${cageIndex++}`,
      op,
      target,
      cells,
    });
  }

  return cages;
}

export function createPuzzle(opts: { seed: number; difficulty: number }): KenKenPuzzle {
  const rng = makeRng(opts.seed);
  const size = opts.difficulty <= 1 ? 4 : opts.difficulty === 2 ? 5 : 6;

  const base = latinSquare(size);
  const solution = applyPermutations(rng, base);
  const cages = buildCages({
    rng,
    size,
    solution,
    difficulty: opts.difficulty,
  });

  return { size, solution, cages };
}
