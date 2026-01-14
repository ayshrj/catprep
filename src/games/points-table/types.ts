export type Team = {
  id: string;
  name: string;
};

export type Match = {
  id: string;
  home: string; // teamId
  away: string; // teamId
};

export type Outcome = "H" | "D" | "A"; // Home win / Draw / Away win

export type PointsSystem = { win: number; draw: number; loss: number };

export type PointsTablePuzzle = {
  teams: Team[];
  matches: Match[];
  pointsSystem: PointsSystem;

  fixedOutcomes: Record<string, Outcome>; // matchId -> outcome (locked)
  solutionOutcomes: Record<string, Outcome>; // all match outcomes (for validation + hints)

  constraints: string[]; // human-readable for CAT mapping
};

export type PointsTableState = {
  outcomes: Record<string, Outcome | null>; // matchId -> outcome
};

export type PointsTableAction =
  | { type: "setOutcome"; matchId: string; outcome: Outcome }
  | { type: "clearOutcome"; matchId: string }
  | { type: "__RESET__"; newState: PointsTableState };
