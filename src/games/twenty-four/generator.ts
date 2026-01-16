import { randInt } from "../core/generator-utils";
import { makeRng } from "../core/rng";

type Expr = { value: number; expr: string };

const TARGET = 24;
const EPS = 1e-6;

function solve24(items: Expr[]): string | null {
  if (items.length === 1) {
    return Math.abs(items[0].value - TARGET) < EPS ? items[0].expr : null;
  }

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i];
      const b = items[j];
      const rest = items.filter((_, idx) => idx !== i && idx !== j);

      const candidates: Expr[] = [
        { value: a.value + b.value, expr: `(${a.expr} + ${b.expr})` },
        { value: a.value * b.value, expr: `(${a.expr} * ${b.expr})` },
        { value: a.value - b.value, expr: `(${a.expr} - ${b.expr})` },
        { value: b.value - a.value, expr: `(${b.expr} - ${a.expr})` },
      ];

      if (Math.abs(b.value) > EPS) {
        candidates.push({ value: a.value / b.value, expr: `(${a.expr} / ${b.expr})` });
      }
      if (Math.abs(a.value) > EPS) {
        candidates.push({ value: b.value / a.value, expr: `(${b.expr} / ${a.expr})` });
      }

      for (const cand of candidates) {
        const res = solve24([...rest, cand]);
        if (res) return res;
      }
    }
  }

  return null;
}

function generateNumbers(rng: () => number, difficulty: number): number[] {
  const max = difficulty <= 1 ? 9 : difficulty === 2 ? 11 : 13;
  const min = 1;
  return Array.from({ length: 4 }, () => randInt(rng, min, max));
}

export function createPuzzle(opts: { seed: number; difficulty: number }) {
  const rng = makeRng(opts.seed);
  const difficulty = Math.max(1, Math.min(3, opts.difficulty));

  for (let attempt = 0; attempt < 300; attempt++) {
    const numbers = generateNumbers(rng, difficulty);
    const solution = solve24(numbers.map(n => ({ value: n, expr: String(n) })));
    if (solution) {
      return { numbers: numbers.slice(), solution: `${solution} = 24` };
    }
  }

  return { numbers: [3, 3, 8, 8], solution: "8 / (3 - 8 / 3) = 24" };
}
