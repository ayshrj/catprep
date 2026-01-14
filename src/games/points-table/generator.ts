import { PointsTablePuzzle } from "./types";

type PuzzleDef = Omit<PointsTablePuzzle, "pointsSystem">;

const basePointsSystem = { win: 3, draw: 1, loss: 0 };

const puzzlesEasy: PuzzleDef[] = [
  {
    teams: [
      { id: "A", name: "Apex" },
      { id: "B", name: "Bolt" },
      { id: "C", name: "Crest" },
      { id: "D", name: "Drift" },
    ],
    matches: [
      { id: "m1", home: "A", away: "B" },
      { id: "m2", home: "A", away: "C" },
      { id: "m3", home: "A", away: "D" },
      { id: "m4", home: "B", away: "C" },
      { id: "m5", home: "B", away: "D" },
      { id: "m6", home: "C", away: "D" },
    ],
    // Lock 3 results; user fills remaining 3
    fixedOutcomes: { m1: "H", m4: "D", m6: "A" },
    // Full solution set (used for correctness + hints)
    solutionOutcomes: { m1: "H", m2: "D", m3: "A", m4: "D", m5: "H", m6: "A" },
    constraints: [
      "Win = 3 points, Draw = 1 point.",
      "Apex beats Bolt.",
      "Bolt draws with Crest.",
      "Crest loses to Drift.",
      "Use totals to deduce remaining results (table-making discipline).",
    ],
  },
  {
    teams: [
      { id: "A", name: "Atlas" },
      { id: "B", name: "Blaze" },
      { id: "C", name: "Cobalt" },
      { id: "D", name: "Delta" },
    ],
    matches: [
      { id: "m1", home: "A", away: "B" },
      { id: "m2", home: "A", away: "C" },
      { id: "m3", home: "A", away: "D" },
      { id: "m4", home: "B", away: "C" },
      { id: "m5", home: "B", away: "D" },
      { id: "m6", home: "C", away: "D" },
    ],
    fixedOutcomes: { m2: "H", m5: "D", m6: "H" },
    solutionOutcomes: { m1: "D", m2: "H", m3: "A", m4: "A", m5: "D", m6: "H" },
    constraints: [
      "Win = 3, Draw = 1.",
      "Atlas beats Cobalt.",
      "Blaze draws with Delta.",
      "Cobalt beats Delta.",
      "Deduce remaining outcomes by balancing W/D/L totals.",
    ],
  },
];

const puzzlesMedium: PuzzleDef[] = [
  {
    teams: [
      { id: "A", name: "Alpha" },
      { id: "B", name: "Bravo" },
      { id: "C", name: "Charlie" },
      { id: "D", name: "Delta" },
      { id: "E", name: "Echo" },
    ],
    // 5 teams -> 10 matches
    matches: [
      { id: "m1", home: "A", away: "B" },
      { id: "m2", home: "A", away: "C" },
      { id: "m3", home: "A", away: "D" },
      { id: "m4", home: "A", away: "E" },
      { id: "m5", home: "B", away: "C" },
      { id: "m6", home: "B", away: "D" },
      { id: "m7", home: "B", away: "E" },
      { id: "m8", home: "C", away: "D" },
      { id: "m9", home: "C", away: "E" },
      { id: "m10", home: "D", away: "E" },
    ],
    fixedOutcomes: { m1: "H", m5: "A", m8: "D", m10: "H" },
    solutionOutcomes: {
      m1: "H",
      m2: "D",
      m3: "A",
      m4: "H",
      m5: "A",
      m6: "D",
      m7: "H",
      m8: "D",
      m9: "A",
      m10: "H",
    },
    constraints: [
      "5-team round robin: track 10 matches carefully.",
      "Use derived columns (Played, GD not used here) and points totals.",
      "Practice elimination logic + constraint propagation (CAT DILR table-making).",
    ],
  },
];

const puzzlesHard: PuzzleDef[] = [
  {
    teams: [
      { id: "A", name: "Nova" },
      { id: "B", name: "Orion" },
      { id: "C", name: "Pulse" },
      { id: "D", name: "Quark" },
      { id: "E", name: "Rift" },
    ],
    matches: [
      { id: "m1", home: "A", away: "B" },
      { id: "m2", home: "A", away: "C" },
      { id: "m3", home: "A", away: "D" },
      { id: "m4", home: "A", away: "E" },
      { id: "m5", home: "B", away: "C" },
      { id: "m6", home: "B", away: "D" },
      { id: "m7", home: "B", away: "E" },
      { id: "m8", home: "C", away: "D" },
      { id: "m9", home: "C", away: "E" },
      { id: "m10", home: "D", away: "E" },
    ],
    fixedOutcomes: { m2: "A", m6: "H", m9: "D" },
    solutionOutcomes: {
      m1: "D",
      m2: "A",
      m3: "H",
      m4: "D",
      m5: "H",
      m6: "H",
      m7: "A",
      m8: "D",
      m9: "D",
      m10: "A",
    },
    constraints: [
      "Hard: fewer fixed outcomes, more deduction.",
      "Watch the global draw count and each team’s total played.",
      "Build a points table as you go; don’t guess.",
    ],
  },
];

export function createPuzzle(opts: { seed: number; difficulty: number }): PointsTablePuzzle {
  const list = opts.difficulty <= 1 ? puzzlesEasy : opts.difficulty === 2 ? puzzlesMedium : puzzlesHard;
  const def = list[Math.abs(opts.seed) % list.length];
  return {
    ...def,
    pointsSystem: basePointsSystem,
  };
}
