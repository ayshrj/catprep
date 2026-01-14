import { RoutesPuzzle } from "./types";

const puzzlesEasy: RoutesPuzzle[] = [
  {
    nodes: [
      { id: "A", label: "A", x: 10, y: 50 },
      { id: "B", label: "B", x: 35, y: 20 },
      { id: "C", label: "C", x: 35, y: 80 },
      { id: "D", label: "D", x: 60, y: 20 },
      { id: "E", label: "E", x: 60, y: 80 },
      { id: "F", label: "F", x: 90, y: 50 },
    ],
    edges: [
      { from: "A", to: "B", cost: 4 },
      { from: "A", to: "C", cost: 6 },
      { from: "B", to: "D", cost: 5 },
      { from: "C", to: "E", cost: 3 },
      { from: "D", to: "F", cost: 7 },
      { from: "E", to: "F", cost: 7 },
      { from: "B", to: "C", cost: 2 },
      { from: "D", to: "E", cost: 4 },
    ],
    start: "A",
    end: "F",
    targetCost: 16,
    constraints: [
      "Build any valid path from Start to End with total cost exactly equal to Target.",
      "Don’t brute force; reason via cost differences.",
      "This maps to CAT DILR routes/network sets (path constraints).",
    ],
    solutionPath: ["A", "B", "C", "E", "F"], // 4+2+3+7=16
  },
];

const puzzlesMedium: RoutesPuzzle[] = [
  {
    nodes: [
      { id: "S", label: "S", x: 8, y: 50 },
      { id: "A", label: "A", x: 25, y: 20 },
      { id: "B", label: "B", x: 25, y: 80 },
      { id: "C", label: "C", x: 45, y: 35 },
      { id: "D", label: "D", x: 45, y: 65 },
      { id: "E", label: "E", x: 70, y: 20 },
      { id: "F", label: "F", x: 70, y: 80 },
      { id: "T", label: "T", x: 92, y: 50 },
    ],
    edges: [
      { from: "S", to: "A", cost: 3 },
      { from: "S", to: "B", cost: 4 },
      { from: "A", to: "C", cost: 6 },
      { from: "B", to: "D", cost: 5 },
      { from: "C", to: "D", cost: 2 },
      { from: "C", to: "E", cost: 4 },
      { from: "D", to: "F", cost: 4 },
      { from: "E", to: "T", cost: 7 },
      { from: "F", to: "T", cost: 6 },
      { from: "E", to: "F", cost: 3 },
    ],
    start: "S",
    end: "T",
    targetCost: 18,
    constraints: ["Exact-cost route search; practice pruning paths by remaining cost.", "Medium graph: more branches."],
    solutionPath: ["S", "B", "D", "C", "E", "T"], // 4+5+2+4+7=22? not ok
  },
];

// Fix medium solutionPath to a correct 18 path:
puzzlesMedium[0].solutionPath = ["S", "A", "C", "E", "F", "T"]; // 3+6+4+3+6=22 -> still not ok
puzzlesMedium[0].solutionPath = ["S", "B", "D", "F", "T"]; // 4+5+4+6=19 -> close
puzzlesMedium[0].solutionPath = ["S", "A", "C", "D", "F", "T"]; // 3+6+2+4+6=21
puzzlesMedium[0].solutionPath = ["S", "B", "D", "C", "E", "T"]; // 4+5+2+4+7=22

// For deterministic correctness, set targetCost to match an existing path:
puzzlesMedium[0].targetCost = 19;
puzzlesMedium[0].solutionPath = ["S", "B", "D", "F", "T"]; // 19

const puzzlesHard: RoutesPuzzle[] = [
  {
    nodes: [
      { id: "1", label: "1", x: 8, y: 50 },
      { id: "2", label: "2", x: 22, y: 20 },
      { id: "3", label: "3", x: 22, y: 80 },
      { id: "4", label: "4", x: 42, y: 20 },
      { id: "5", label: "5", x: 42, y: 80 },
      { id: "6", label: "6", x: 62, y: 35 },
      { id: "7", label: "7", x: 62, y: 65 },
      { id: "8", label: "8", x: 82, y: 50 },
      { id: "9", label: "9", x: 95, y: 50 },
    ],
    edges: [
      { from: "1", to: "2", cost: 2 },
      { from: "1", to: "3", cost: 3 },
      { from: "2", to: "4", cost: 6 },
      { from: "3", to: "5", cost: 5 },
      { from: "4", to: "6", cost: 4 },
      { from: "5", to: "7", cost: 4 },
      { from: "6", to: "7", cost: 2 },
      { from: "6", to: "8", cost: 7 },
      { from: "7", to: "8", cost: 6 },
      { from: "8", to: "9", cost: 3 },
      { from: "4", to: "5", cost: 3 },
      { from: "2", to: "3", cost: 4 },
    ],
    start: "1",
    end: "9",
    targetCost: 18,
    constraints: ["Hard: more nodes. Use remaining-cost pruning.", "Avoid loops unless needed."],
    solutionPath: ["1", "2", "3", "5", "7", "8", "9"], // 2+4+5+4+6+3=24 -> not ok
  },
];

// Fix hard target/solution deterministically:
puzzlesHard[0].targetCost = 22;
puzzlesHard[0].solutionPath = ["1", "2", "4", "6", "8", "9"]; // 2+6+4+7+3=22

export function createPuzzle(opts: { seed: number; difficulty: number }): RoutesPuzzle {
  const list = opts.difficulty <= 1 ? puzzlesEasy : opts.difficulty === 2 ? puzzlesMedium : puzzlesHard;
  return list[Math.abs(opts.seed) % list.length];
}
