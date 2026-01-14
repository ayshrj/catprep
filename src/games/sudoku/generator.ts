import { makeRng } from "../core/rng";

const SIZE = 9;
const BLOCK_ROWS = 3;
const BLOCK_COLS = 3;

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateSolvedGrid(rng: () => number): number[][] {
  const grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));

  const isValid = (row: number, col: number, num: number) => {
    for (let i = 0; i < SIZE; i++) {
      if (grid[row][i] === num || grid[i][col] === num) return false;
    }
    const startRow = Math.floor(row / BLOCK_ROWS) * BLOCK_ROWS;
    const startCol = Math.floor(col / BLOCK_COLS) * BLOCK_COLS;
    for (let r = startRow; r < startRow + BLOCK_ROWS; r++) {
      for (let c = startCol; c < startCol + BLOCK_COLS; c++) {
        if (grid[r][c] === num) return false;
      }
    }
    return true;
  };

  const numbers = Array.from({ length: SIZE }, (_, i) => i + 1);

  const fillGrid = (): boolean => {
    for (let row = 0; row < SIZE; row++) {
      for (let col = 0; col < SIZE; col++) {
        if (grid[row][col] === 0) {
          for (const num of shuffle(numbers, rng)) {
            if (isValid(row, col, num)) {
              grid[row][col] = num;
              if (fillGrid()) return true;
              grid[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  };

  fillGrid();
  return grid;
}

function removeNumbers(solved: number[][], attempts: number, rng: () => number): number[][] {
  const puzzle = solved.map(row => row.slice());

  const isValid = (grid: number[][], row: number, col: number, num: number) => {
    for (let i = 0; i < SIZE; i++) {
      if (grid[row][i] === num || grid[i][col] === num) return false;
    }
    const startRow = Math.floor(row / BLOCK_ROWS) * BLOCK_ROWS;
    const startCol = Math.floor(col / BLOCK_COLS) * BLOCK_COLS;
    for (let r = startRow; r < startRow + BLOCK_ROWS; r++) {
      for (let c = startCol; c < startCol + BLOCK_COLS; c++) {
        if (grid[r][c] === num) return false;
      }
    }
    return true;
  };

  const countSolutions = (grid: number[][]): number => {
    const findEmpty = (): [number, number] | null => {
      for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (grid[r][c] === 0) return [r, c];
      return null;
    };

    const empty = findEmpty();
    if (!empty) return 1;
    const [r, c] = empty;
    let total = 0;
    for (let num = 1; num <= SIZE; num++) {
      if (isValid(grid, r, c, num)) {
        grid[r][c] = num;
        total += countSolutions(grid);
        grid[r][c] = 0;
        if (total > 1) break; // stop once we know it's not unique
      }
    }
    return total;
  };

  let counter = 0;
  while (counter < attempts) {
    const row = Math.floor(rng() * SIZE);
    const col = Math.floor(rng() * SIZE);
    if (puzzle[row][col] === 0) continue;

    const backup = puzzle[row][col];
    puzzle[row][col] = 0;

    const puzzleCopy = puzzle.map(r => r.slice());
    const solutions = countSolutions(puzzleCopy);
    if (solutions !== 1) {
      puzzle[row][col] = backup;
      counter++;
    }
  }

  return puzzle;
}

export function createPuzzle(opts: { seed: number; difficulty: number }) {
  const rng = makeRng(opts.seed);
  const solvedGrid = generateSolvedGrid(rng);
  const attempts = opts.difficulty <= 1 ? 5 : opts.difficulty === 2 ? 7 : 10;
  const initialGrid = removeNumbers(solvedGrid, attempts, rng);
  return { initialGrid, solvedGrid };
}
