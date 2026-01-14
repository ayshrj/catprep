import { makeRng } from "../core/rng";
import { MentalMathPuzzle, Question } from "./types";

function qPercent(rng: () => number, difficulty: number): Question {
  const p = difficulty <= 1 ? [10, 12.5, 15, 20, 25][Math.floor(rng() * 5)] : Math.floor(5 + rng() * 46); // 5..50
  const n = difficulty <= 1 ? 20 + Math.floor(rng() * 81) : 50 + Math.floor(rng() * 451); // 20..100 or 50..500
  const ans = (p / 100) * n;
  return {
    id: `pct-${p}-${n}`,
    prompt: `Compute ${p}% of ${n}.`,
    answer: ans,
    tolerance: 0.01,
    hint: `Use ${p}% = ${p}/100. For quick mental math: ${p}% of ${n} = ${n} * ${p} / 100.`,
  };
}

function qMultiply(rng: () => number, difficulty: number): Question {
  const a = difficulty <= 1 ? 12 + Math.floor(rng() * 39) : 25 + Math.floor(rng() * 175); // 12..50 or 25..199
  const b = difficulty <= 1 ? 6 + Math.floor(rng() * 14) : 11 + Math.floor(rng() * 79); // 6..19 or 11..89
  const ans = a * b;
  return {
    id: `mul-${a}-${b}`,
    prompt: `Compute ${a} × ${b}.`,
    answer: ans,
    tolerance: 0,
    hint: `Break one factor: ${a}×${b} = ${a}×(${Math.floor(b / 10) * 10} + ${b % 10}).`,
  };
}

function qFraction(rng: () => number, difficulty: number): Question {
  const den = difficulty <= 1 ? [8, 16, 20, 25][Math.floor(rng() * 4)] : [12, 24, 40, 75][Math.floor(rng() * 4)];
  const num = 1 + Math.floor(rng() * (den - 1));
  const ans = num / den;
  const tol = 0.001;
  return {
    id: `frac-${num}-${den}`,
    prompt: `Convert ${num}/${den} to decimal (round to 3 decimals).`,
    answer: Number(ans.toFixed(3)),
    tolerance: tol,
    hint: `Compute division and round to 3 decimals. For denominators like 8/16/20/25 use known fractions.`,
  };
}

function qSquare(rng: () => number): Question {
  const n = 20 + Math.floor(rng() * 50); // 20..69
  const ans = n * n;
  return {
    id: `sq-${n}`,
    prompt: `Compute ${n}².`,
    answer: ans,
    tolerance: 0,
    hint: `Use (a+b)² = a² + 2ab + b². For ${n}, take a nearby multiple of 10.`,
  };
}

export function createPuzzle(opts: { seed: number; difficulty: number }): MentalMathPuzzle {
  const rng = makeRng(opts.seed);
  const count = 10;
  const questions: Question[] = [];

  for (let i = 0; i < count; i++) {
    const roll = rng();
    if (opts.difficulty <= 1) {
      questions.push(
        roll < 0.45
          ? qPercent(rng, opts.difficulty)
          : roll < 0.8
            ? qMultiply(rng, opts.difficulty)
            : qFraction(rng, opts.difficulty)
      );
    } else if (opts.difficulty === 2) {
      questions.push(
        roll < 0.35
          ? qPercent(rng, opts.difficulty)
          : roll < 0.75
            ? qMultiply(rng, opts.difficulty)
            : qFraction(rng, opts.difficulty)
      );
    } else {
      questions.push(
        roll < 0.3 ? qSquare(rng) : roll < 0.65 ? qMultiply(rng, opts.difficulty) : qPercent(rng, opts.difficulty)
      );
    }
  }

  return {
    questions,
    perQuestionSeconds: opts.difficulty <= 1 ? 20 : opts.difficulty === 2 ? 18 : 15,
  };
}
