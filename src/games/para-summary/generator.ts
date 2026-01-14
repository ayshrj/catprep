import type { ParaSummaryPuzzle } from "./types";

const EASY: ParaSummaryPuzzle[] = [
  {
    id: "ps-e1",
    title: "Summary selection",
    passage:
      "Reducing friction makes habits easier to maintain. When steps are removed, the desired action becomes more repeatable. " +
      "This lowers the need for constant motivation and improves consistency over time.",
    options: [
      { id: "a", text: "Habits are mostly determined by personality traits." },
      {
        id: "b",
        text: "Removing steps lowers friction, making habits more consistent.",
      },
      { id: "c", text: "Motivation is the only factor in building habits." },
      { id: "d", text: "Harder routines always lead to better results." },
    ],
    correctOptionId: "b",
    explanation: "Option B captures the core cause-effect without adding new claims.",
  },
];

const MED: ParaSummaryPuzzle[] = [
  {
    id: "ps-m1",
    title: "Scope control",
    passage:
      "When one metric dominates evaluation, behavior shifts to optimize that metric. This can increase performance on the measured dimension " +
      "while harming outcomes not tracked. Good measurement anticipates gaming and balances incentives.",
    options: [
      { id: "a", text: "Metrics are always harmful and should be eliminated." },
      {
        id: "b",
        text: "Dominant metrics change behavior, sometimes harming unmeasured outcomes.",
      },
      { id: "c", text: "Gaming is impossible if incentives are clear." },
      {
        id: "d",
        text: "Only long-term metrics matter; short-term metrics are useless.",
      },
    ],
    correctOptionId: "b",
    explanation: "B is accurate and balanced; the others are extreme or contradict the passage.",
  },
];

const HARD: ParaSummaryPuzzle[] = [
  {
    id: "ps-h1",
    title: "Precision over plausibility",
    passage:
      "A retrospective explanation can fit the past without predicting the future. Prediction must confront uncertainty and be tested on unseen cases. " +
      "Conflating explanation with prediction leads to misplaced confidence.",
    options: [
      {
        id: "a",
        text: "If a theory explains the past, it will predict the future reliably.",
      },
      {
        id: "b",
        text: "Prediction and explanation are identical because both use models.",
      },
      {
        id: "c",
        text: "Explanation can fit past events, but prediction must handle unknowns and be tested.",
      },
      { id: "d", text: "Uncertainty makes all prediction worthless." },
    ],
    correctOptionId: "c",
    explanation: "C matches the distinction and avoids extreme claims.",
  },
];

export function createPuzzle(opts: { seed: number; difficulty: number }): ParaSummaryPuzzle {
  const { seed, difficulty } = opts;
  const pool = difficulty <= 1 ? EASY : difficulty === 2 ? MED : HARD;
  return pool[Math.abs(seed) % pool.length];
}
