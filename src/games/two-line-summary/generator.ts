import type { TwoLineSummaryPuzzle } from "./types";

const EASY: TwoLineSummaryPuzzle[] = [
  {
    id: "tls-e1",
    promptTitle: "Tradeoffs in focus",
    passage:
      "Multitasking feels productive, but it often increases switching costs. Each time attention shifts, the brain spends effort reloading context. " +
      "Short bursts of focused work reduce this overhead and improve accuracy. The gain is not just speed, but fewer errors that otherwise require rework.",
    minWords: 22,
    maxWords: 35,
    requiredKeywords: ["switching", "focus", "errors"],
    sampleGoodSummary:
      "Multitasking raises switching costs by forcing repeated context reloads. Focused work reduces overhead and errors, improving speed and quality.",
  },
];

const MED: TwoLineSummaryPuzzle[] = [
  {
    id: "tls-m1",
    promptTitle: "Incentives and behavior",
    passage:
      "People respond to incentives, but not always in predictable ways. When a single metric dominates evaluation, behavior shifts to optimize that metric. " +
      "This can improve performance on the measured dimension while harming unmeasured outcomes. Designing metrics therefore requires anticipating gaming.",
    minWords: 24,
    maxWords: 38,
    requiredKeywords: ["metric", "optimize", "unmeasured"],
    sampleGoodSummary:
      "Dominant metrics reshape behavior to optimize what is measured. This can damage unmeasured outcomes, so metrics must be designed to reduce gaming.",
  },
];

const HARD: TwoLineSummaryPuzzle[] = [
  {
    id: "tls-h1",
    promptTitle: "Prediction vs explanation",
    passage:
      "A story can fit past events without predicting future ones. Explanation can be retrospective, selecting details that make outcomes seem inevitable. " +
      "Prediction must confront uncertainty and be tested on unseen cases. Confusing explanation for prediction leads to misplaced confidence.",
    minWords: 24,
    maxWords: 38,
    requiredKeywords: ["retrospective", "prediction", "uncertainty"],
    sampleGoodSummary:
      "Retrospective explanations can fit the past without forecasting. Prediction must handle uncertainty and pass tests on unseen cases, or confidence is misplaced.",
  },
];

export function createPuzzle(opts: { seed: number; difficulty: number }) {
  const { seed, difficulty } = opts;
  const pool = difficulty <= 1 ? EASY : difficulty === 2 ? MED : HARD;
  return pool[Math.abs(seed) % pool.length];
}
