import { MinesweeperPuzzle } from "./types";

export function createPuzzle(opts: { seed: number; difficulty: number }): MinesweeperPuzzle {
  const seed = opts.seed;
  if (opts.difficulty <= 1) return { width: 9, height: 9, mines: 10, seed };
  if (opts.difficulty === 2) return { width: 12, height: 12, mines: 20, seed };
  return { width: 16, height: 16, mines: 40, seed };
}
