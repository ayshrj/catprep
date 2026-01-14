import { TargetNumberPuzzle } from "./types";

type Def = TargetNumberPuzzle;

const easy: Def[] = [
  {
    target: 50,
    numbers: [25, 2, 10, 5],
    solution: "(25×2) = 50 (ignore extras)",
  },
  { target: 36, numbers: [6, 6, 3, 2], solution: "6×6 = 36" },
  { target: 24, numbers: [8, 3, 2, 1], solution: "8×3 = 24" },
];

const medium: Def[] = [
  { target: 72, numbers: [9, 8, 2, 3], solution: "9×8 = 72" },
  { target: 45, numbers: [10, 5, 9, 2], solution: "9×5 = 45 (ignore extras)" },
  { target: 30, numbers: [6, 5, 3, 2], solution: "6×5 = 30" },
];

const hard: Def[] = [
  {
    target: 60,
    numbers: [8, 6, 5, 2],
    solution: "(6×5)×2 = 60 (use 8 as distractor)",
  },
  { target: 42, numbers: [7, 6, 3, 2], solution: "7×6 = 42" },
  { target: 81, numbers: [9, 9, 3, 1], solution: "9×9 = 81" },
];

export function createPuzzle(opts: { seed: number; difficulty: number }): TargetNumberPuzzle {
  const list = opts.difficulty <= 1 ? easy : opts.difficulty === 2 ? medium : hard;
  const def = list[Math.abs(opts.seed) % list.length];
  return { ...def, numbers: [...def.numbers] };
}
