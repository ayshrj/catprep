import { EstimationDuelPuzzle, Round } from "./types";

const easy: Round[] = [
  {
    id: "e1",
    prompt: "Approximate 49 × 51",
    options: ["2400", "2500", "2600", "2700"],
    correctIndex: 1,
    hint: "Use (50−1)(50+1)=50²−1.",
    explanation: "49×51 = (50−1)(50+1)=2500−1=2499, closest to 2500.",
  },
  {
    id: "e2",
    prompt: "Approximate 199/4",
    options: ["45", "50", "55", "60"],
    correctIndex: 1,
    hint: "200/4 = 50; small adjustment.",
    explanation: "199/4 = 49.75, closest to 50.",
  },
  {
    id: "e3",
    prompt: "Approximate √(980)",
    options: ["30", "31", "32", "33"],
    correctIndex: 1,
    hint: "31²=961, 32²=1024.",
    explanation: "980 is closer to 961 than 1024 → around 31.",
  },
];

const medium: Round[] = [
  {
    id: "m1",
    prompt: "Approximate 98 × 103",
    options: ["9800", "10000", "10100", "10300"],
    correctIndex: 2,
    hint: "Use (100−2)(100+3)=10000+100−6.",
    explanation: "98×103 = 10000 + 300 − 200 − 6 = 10094 → closest to 10100.",
  },
  {
    id: "m2",
    prompt: "Approximate 1.98 × 5.1",
    options: ["9", "10", "11", "12"],
    correctIndex: 1,
    hint: "2×5.1 ≈ 10.2, adjust slightly down.",
    explanation: "1.98×5.1 ≈ 10.098 → closest to 10.",
  },
  {
    id: "m3",
    prompt: "Approximate 51% of 198",
    options: ["95", "100", "105", "110"],
    correctIndex: 1,
    hint: "50% of 200 = 100; adjust.",
    explanation: "51% of 198 ≈ 0.51×198 ≈ 100.98 → closest to 100.",
  },
];

const hard: Round[] = [
  {
    id: "h1",
    prompt: "Approximate 999 × 1001",
    options: ["999000", "1000000", "1002000", "1003000"],
    correctIndex: 1,
    hint: "Use (1000−1)(1000+1)=1000²−1.",
    explanation: "999×1001 = 1000000 − 1 = 999999 → closest to 1000000.",
  },
  {
    id: "h2",
    prompt: "Approximate (19.8/0.51)",
    options: ["35", "38", "40", "42"],
    correctIndex: 1,
    hint: "Divide by ~0.5 doubles; adjust a bit.",
    explanation: "19.8/0.51 ≈ 19.8×(1/0.51) ≈ 19.8×1.96 ≈ 38.8 → closest to 38.",
  },
  {
    id: "h3",
    prompt: "Approximate √(2,050)",
    options: ["44", "45", "46", "47"],
    correctIndex: 1,
    hint: "45²=2025, 46²=2116.",
    explanation: "2050 is closer to 2025 → ~45.",
  },
];

export function createPuzzle(opts: { seed: number; difficulty: number }): EstimationDuelPuzzle {
  const list = opts.difficulty <= 1 ? easy : opts.difficulty === 2 ? medium : hard;
  // Deterministic shuffle by seed not needed for small set; we’ll rotate by seed.
  const start = Math.abs(opts.seed) % list.length;
  const rounds = [...list.slice(start), ...list.slice(0, start)];
  return { rounds };
}
