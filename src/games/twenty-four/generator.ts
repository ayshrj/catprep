type PuzzleDef = { numbers: number[]; solution: string };

const easyPuzzles: PuzzleDef[] = [
  { numbers: [6, 6, 6, 6], solution: "6 + 6 + 6 + 6 = 24" },
  { numbers: [4, 4, 5, 1], solution: "5 * 4 + 4 * 1 = 24" },
  { numbers: [2, 3, 4, 6], solution: "3 * 4 + 6 * 2 = 24" },
];
const mediumPuzzles: PuzzleDef[] = [
  { numbers: [2, 2, 6, 8], solution: "(8 - 2) * (6 - 2) = 24" },
  { numbers: [4, 7, 8, 8], solution: "(7 - 8/8) * 4 = 24" },
];
const hardPuzzles: PuzzleDef[] = [
  { numbers: [1, 5, 5, 5], solution: "5 * (5 - 1/5) = 24" },
  { numbers: [3, 3, 8, 8], solution: "8 / (3 - 8/3) = 24" },
];

export function createPuzzle(opts: { seed: number; difficulty: number }) {
  const { seed, difficulty } = opts;
  const list = difficulty <= 1 ? easyPuzzles : difficulty === 2 ? mediumPuzzles : hardPuzzles;
  const puzzleDef = list[Math.abs(seed) % list.length];
  // Return a copy of the numbers array to avoid mutation
  return { numbers: [...puzzleDef.numbers], solution: puzzleDef.solution };
}
