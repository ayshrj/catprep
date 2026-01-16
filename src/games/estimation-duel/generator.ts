import { makeId, pick, randInt, shuffle } from "../core/generator-utils";
import { makeRng } from "../core/rng";
import { EstimationDuelPuzzle, Round } from "./types";

function formatNumber(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(2).replace(/\.?0+$/, "");
}

function buildOptions(rng: () => number, exact: number, step: number, count: number) {
  const rounded = Math.round(exact / step) * step;
  const options = new Set<number>([rounded]);
  const deltas = [-3, -2, -1, 1, 2, 3];

  while (options.size < count) {
    const delta = pick(rng, deltas) * step;
    const candidate = rounded + delta;
    if (candidate <= 0) continue;
    options.add(candidate);
  }

  const list = shuffle(rng, Array.from(options));
  return {
    options: list.map(formatNumber),
    correctIndex: list.findIndex(v => Math.abs(v - rounded) < 1e-9),
    rounded,
  };
}

function roundNearSquareMul(rng: () => number, difficulty: number): Round {
  const base = difficulty <= 1 ? randInt(rng, 25, 60) : randInt(rng, 60, 140);
  const offset = randInt(rng, 1, 3);
  const a = base - offset;
  const b = base + offset;
  const exact = a * b;
  const step = exact > 10000 ? 200 : 100;
  const { options, correctIndex, rounded } = buildOptions(rng, exact, step, 4);
  return {
    id: makeId(rng, "est"),
    prompt: `Approximate ${a} × ${b}`,
    options,
    correctIndex,
    hint: `Use (${base}−${offset})(${base}+${offset}) = ${base}² − ${offset}².`,
    explanation: `${a}×${b} ≈ ${base * base} − ${offset * offset} = ${exact}. Closest option is ${rounded}.`,
  };
}

function roundPercent(rng: () => number, difficulty: number): Round {
  const p = difficulty <= 1 ? pick(rng, [12, 15, 18, 20, 25, 30]) : randInt(rng, 5, 55);
  const n = difficulty <= 1 ? randInt(rng, 80, 240) : randInt(rng, 150, 450);
  const exact = (p / 100) * n;
  const step = difficulty <= 1 ? 5 : 2;
  const { options, correctIndex, rounded } = buildOptions(rng, exact, step, 4);
  return {
    id: makeId(rng, "est"),
    prompt: `Approximate ${p}% of ${n}`,
    options,
    correctIndex,
    hint: `Use ${p}% = ${p}/100, then round.`,
    explanation: `${p}% of ${n} ≈ ${formatNumber(exact)} → closest option ${rounded}.`,
  };
}

function roundSqrt(rng: () => number, difficulty: number): Round {
  const base = difficulty <= 1 ? randInt(rng, 25, 50) : randInt(rng, 35, 70);
  const delta = difficulty <= 1 ? randInt(rng, -30, 30) : randInt(rng, -80, 80);
  const value = base * base + delta;
  const exact = Math.sqrt(value);
  const step = 1;
  const { options, correctIndex, rounded } = buildOptions(rng, exact, step, 4);
  return {
    id: makeId(rng, "est"),
    prompt: `Approximate √(${value})`,
    options,
    correctIndex,
    hint: `${base}² = ${base * base}; compare to nearby squares.`,
    explanation: `√${value} ≈ ${formatNumber(exact)} → closest option ${rounded}.`,
  };
}

function roundDivision(rng: () => number, difficulty: number): Round {
  const denom = difficulty <= 1 ? pick(rng, [4, 5, 8, 12]) : pick(rng, [0.48, 0.52, 0.65, 0.75, 1.2]);
  const numer = difficulty <= 1 ? randInt(rng, 160, 320) : Number((randInt(rng, 120, 320) / 10).toFixed(1));
  const exact = numer / denom;
  const step = exact > 100 ? 5 : 2;
  const { options, correctIndex, rounded } = buildOptions(rng, exact, step, 4);
  return {
    id: makeId(rng, "est"),
    prompt: `Approximate ${formatNumber(numer)} ÷ ${formatNumber(denom)}`,
    options,
    correctIndex,
    hint: "Round denominator to a friendly number, then adjust.",
    explanation: `${formatNumber(numer)} ÷ ${formatNumber(denom)} ≈ ${formatNumber(exact)} → closest option ${rounded}.`,
  };
}

export function createPuzzle(opts: { seed: number; difficulty: number }): EstimationDuelPuzzle {
  const rng = makeRng(opts.seed);
  const difficulty = Math.max(1, Math.min(3, opts.difficulty));

  const pool =
    difficulty <= 1
      ? [roundNearSquareMul, roundPercent, roundSqrt]
      : difficulty === 2
        ? [roundNearSquareMul, roundPercent, roundDivision]
        : [roundNearSquareMul, roundDivision, roundSqrt];

  const rounds = shuffle(
    rng,
    pool.map(fn => fn(rng, difficulty))
  ).slice(0, 3);
  return { rounds };
}
