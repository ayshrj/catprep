function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

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
  const { seed, difficulty } = opts;

  const EASY = [
    { id: "rm-e1", a: 20, b: 50, t: 35, tol: 2 },
    { id: "rm-e2", a: 10, b: 40, t: 25, tol: 2 },
    { id: "rm-e3", a: 15, b: 45, t: 30, tol: 2 },
    { id: "rm-e4", a: 30, b: 60, t: 45, tol: 2 },
    { id: "rm-e5", a: 5, b: 35, t: 20, tol: 2 },
  ];

  const MED = [
    { id: "rm-m1", a: 18, b: 62, t: 38, tol: 1.5 },
    { id: "rm-m2", a: 12, b: 48, t: 28, tol: 1.5 },
    { id: "rm-m3", a: 25, b: 70, t: 40, tol: 1.5 },
    { id: "rm-m4", a: 8, b: 55, t: 30, tol: 1.5 },
    { id: "rm-m5", a: 35, b: 80, t: 50, tol: 1.5 },
  ];

  const HARD = [
    { id: "rm-h1", a: 22, b: 77, t: 41, tol: 1.0 },
    { id: "rm-h2", a: 9, b: 63, t: 27, tol: 1.0 },
    { id: "rm-h3", a: 28, b: 73, t: 49, tol: 1.0 },
    { id: "rm-h4", a: 14, b: 68, t: 37, tol: 1.0 },
    { id: "rm-h5", a: 32, b: 91, t: 57, tol: 1.0 },
  ];

  const pool = difficulty <= 1 ? EASY : difficulty === 2 ? MED : HARD;
  const pick = pool[Math.abs(seed) % pool.length];

  const correctPercentA = computeCorrectPercentA(pick.a, pick.b, pick.t);

  return {
    id: pick.id,
    scenario: "You’re mixing two solutions to reach a target concentration. Set the % of Solution A in the final mix.",
    aPercent: pick.a,
    bPercent: pick.b,
    targetPercent: pick.t,
    correctPercentA,
    tolerancePct: pick.tol,
    explanation: "Use alligation: A:B = (B−T):(T−A). Convert ratio into % of A in total.",
  };
}
