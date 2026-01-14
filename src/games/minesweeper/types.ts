export type MinesweeperPuzzle = {
  width: number;
  height: number;
  mines: number;
  seed: number;
};

export type MinesweeperStatus = "inProgress" | "solved" | "failed";

export type MinesweeperState = {
  initialized: boolean;
  mines: boolean[][]; // generated after first click
  numbers: number[][]; // adjacency numbers
  revealed: boolean[][];
  flagged: boolean[][];
  selected: { r: number; c: number };
  touchMode: "reveal" | "flag";
  status: MinesweeperStatus;
  revealedCount: number;
};

export type MinesweeperAction =
  | { type: "select"; r: number; c: number }
  | { type: "reveal"; r: number; c: number }
  | { type: "toggleFlag"; r: number; c: number }
  | { type: "toggleTouchMode" }
  | { type: "__RESET__"; newState: MinesweeperState };
