import type { ParaJumblePuzzle } from "./types";

const EASY: ParaJumblePuzzle[] = [
  {
    id: "pj-e1",
    title: "Cues and connectors",
    sentences: [
      "However, speed without direction can create wasted effort.",
      "Most people want to improve quickly.",
      "A simple plan converts effort into progress.",
      "Therefore, clarity about goals matters before intensity.",
    ],
    correctOrder: [1, 0, 3, 2],
    explanation:
      "Start with broad statement (Most people…). 'However' contrasts it, 'Therefore' gives conclusion, then solution (plan).",
  },
];

const MED: ParaJumblePuzzle[] = [
  {
    id: "pj-m1",
    title: "Cause → effect → implication",
    sentences: [
      "As a result, small problems appear larger than they are.",
      "When attention is fragmented, the brain keeps reloading context.",
      "This creates fatigue and reduces accuracy.",
      "Over time, people mistake fatigue for lack of ability.",
    ],
    correctOrder: [1, 2, 0, 3],
    explanation:
      "Cause (fragmented attention) → effect (fatigue/accuracy) → result (problems appear larger) → long-term misattribution.",
  },
];

const HARD: ParaJumblePuzzle[] = [
  {
    id: "pj-h1",
    title: "Abstract → qualify → example-ish → return",
    sentences: [
      "But the map also hides what it cannot represent.",
      "Measurements guide decisions like a map guides travel.",
      "For instance, focusing only on speed can ignore reliability.",
      "So good metrics must anticipate what will be ignored.",
    ],
    correctOrder: [1, 0, 2, 3],
    explanation: "Map analogy first, then limitation, then illustrative case, then conclusion about metric design.",
  },
];

export function createPuzzle(opts: { seed: number; difficulty: number }): ParaJumblePuzzle {
  const { seed, difficulty } = opts;
  const pool = difficulty <= 1 ? EASY : difficulty === 2 ? MED : HARD;
  return pool[Math.abs(seed) % pool.length];
}
