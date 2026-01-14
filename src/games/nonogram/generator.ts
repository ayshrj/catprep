import { makeRng } from "../core/rng";
import { NonogramPuzzle } from "./types";

function cluesForLine(line: boolean[]): number[] {
  const out: number[] = [];
  let run = 0;
  for (const v of line) {
    if (v) run++;
    else {
      if (run > 0) out.push(run);
      run = 0;
    }
  }
  if (run > 0) out.push(run);
  return out.length ? out : [0];
}

function computeClues(solution: boolean[][]) {
  const height = solution.length;
  const width = solution[0].length;

  const rowClues = solution.map(row => cluesForLine(row));
  const colClues = Array.from({ length: width }, (_, c) =>
    cluesForLine(Array.from({ length: height }, (_, r) => solution[r][c]))
  );

  return { rowClues, colClues };
}

function generateSolution(size: number, rng: () => number) {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => rng() >= 0.5));
}

export function createPuzzle(opts: { seed: number; difficulty: number }): NonogramPuzzle {
  const size = opts.difficulty <= 1 ? 5 : opts.difficulty === 2 ? 10 : 15;
  const rng = makeRng(opts.seed);
  const solution = generateSolution(size, rng);
  const { rowClues, colClues } = computeClues(solution);
  return {
    width: size,
    height: size,
    solution,
    rowClues,
    colClues,
  };
}
