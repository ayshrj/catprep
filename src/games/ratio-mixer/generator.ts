import { clamp, pick, randInt } from "../core/generator-utils";
import { makeRng } from "../core/rng";

function computeCorrectPercentA(a: number, b: number, t: number) {
  // Alligation: A:B = (b - t) : (t - a)
  // percentA = ratioA/(ratioA+ratioB)*100
  const ratioA = b - t;
  const ratioB = t - a;
  const denom = ratioA + ratioB;
  if (denom <= 0) return 50;
  return clamp((ratioA / denom) * 100, 0, 100);
}

export function createPuzzle(opts: { seed: number; difficulty: number }) {
  const rng = makeRng(opts.seed);
  const difficulty = Math.max(1, Math.min(3, opts.difficulty));

  const step = difficulty <= 1 ? 5 : difficulty === 2 ? 2 : 1;
  const aMin = difficulty <= 1 ? 5 : 4;
  const aMax = difficulty <= 1 ? 30 : difficulty === 2 ? 35 : 40;
  const bMin = difficulty <= 1 ? 40 : difficulty === 2 ? 45 : 50;
  const bMax = difficulty <= 1 ? 70 : difficulty === 2 ? 80 : 90;
  const tol = difficulty <= 1 ? 2 : difficulty === 2 ? 1.5 : 1.0;

  const context = pick(rng, [
    "salt solution",
    "sugar syrup",
    "antiseptic mix",
    "coffee concentrate",
    "paint blend",
    "alloy mixture",
  ]);

  let a = 0;
  let b = 0;
  let t = 0;

  const aStepMin = Math.ceil(aMin / step);
  const aStepMax = Math.floor(aMax / step);
  const bStepMin = Math.ceil(bMin / step);
  const bStepMax = Math.floor(bMax / step);

  for (let attempt = 0; attempt < 200; attempt++) {
    a = randInt(rng, aStepMin, aStepMax) * step;
    b = randInt(rng, bStepMin, bStepMax) * step;
    if (a >= b) continue;
    const tMin = a + step;
    const tMax = b - step;
    if (tMax <= tMin) continue;
    t = randInt(rng, Math.ceil(tMin / step), Math.floor(tMax / step)) * step;
    break;
  }

  if (t === 0) {
    a = aMin;
    b = bMax;
    t = Math.round((a + b) / (2 * step)) * step;
  }

  const correctPercentA = computeCorrectPercentA(a, b, t);

  return {
    id: `rm-${Math.abs(opts.seed)}`,
    scenario: `You’re mixing two ${context}s to reach a target concentration. Set the % of Solution A in the final mix.`,
    aPercent: a,
    bPercent: b,
    targetPercent: t,
    correctPercentA,
    tolerancePct: tol,
    explanation: "Use alligation: A:B = (B−T):(T−A). Convert ratio into % of A in total.",
  };
}
