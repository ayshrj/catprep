import { pick, randInt } from "../core/generator-utils";
import { makeRng } from "../core/rng";
import { TargetNumberPuzzle } from "./types";

type Expr = { value: number; expr: string };

function applyOp(a: Expr, b: Expr, op: string): Expr | null {
  switch (op) {
    case "+":
      return { value: a.value + b.value, expr: `(${a.expr} + ${b.expr})` };
    case "-":
      return { value: a.value - b.value, expr: `(${a.expr} - ${b.expr})` };
    case "*":
      return { value: a.value * b.value, expr: `(${a.expr} * ${b.expr})` };
    case "/":
      if (b.value === 0) return null;
      if (a.value % b.value !== 0) return null;
      return { value: a.value / b.value, expr: `(${a.expr} / ${b.expr})` };
    default:
      return null;
  }
}

function buildExpression(rng: () => number, difficulty: number) {
  const easyOps = ["+", "*"];
  const medOps = ["+", "-", "*", "/"];
  const hardOps = ["+", "-", "*", "/"];
  const ops = difficulty <= 1 ? easyOps : difficulty === 2 ? medOps : hardOps;

  const numberRange = difficulty <= 1 ? [2, 12] : difficulty === 2 ? [2, 15] : [1, 20];
  const targetRange = difficulty <= 1 ? [10, 120] : difficulty === 2 ? [10, 180] : [10, 240];

  for (let attempt = 0; attempt < 250; attempt++) {
    const nums = Array.from({ length: 4 }, () => randInt(rng, numberRange[0], numberRange[1]));
    const [a, b, c, d] = nums.map(n => ({ value: n, expr: String(n) }));
    const op1 = pick(rng, ops);
    const op2 = pick(rng, ops);
    const op3 = pick(rng, ops);

    const groupLeft = rng() < 0.5;
    let expr: Expr | null = null;

    if (groupLeft) {
      const first = applyOp(a, b, op1);
      if (!first) continue;
      const second = applyOp(first, c, op2);
      if (!second) continue;
      expr = applyOp(second, d, op3);
    } else {
      const left = applyOp(a, b, op1);
      if (!left) continue;
      const right = applyOp(c, d, op3);
      if (!right) continue;
      expr = applyOp(left, right, op2);
    }

    if (!expr) continue;
    if (!Number.isFinite(expr.value)) continue;
    if (expr.value <= 0) continue;
    if (expr.value < targetRange[0] || expr.value > targetRange[1]) continue;

    return {
      target: expr.value,
      numbers: nums,
      solution: `${expr.expr} = ${expr.value}`,
    };
  }

  const fallback = { target: 24, numbers: [3, 3, 4, 4], solution: "(3 + 3) * (4 - 4 / 4) = 24" };
  return fallback;
}

export function createPuzzle(opts: { seed: number; difficulty: number }): TargetNumberPuzzle {
  const rng = makeRng(opts.seed);
  const difficulty = Math.max(1, Math.min(3, opts.difficulty));
  const puzzle = buildExpression(rng, difficulty);
  return { ...puzzle, numbers: puzzle.numbers.slice() };
}
