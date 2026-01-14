/**
 * Example scoring calculation based on outcome, time, and hints.
 * (Not deeply integrated in this MVP; scoreDelta is returned in evaluate.)
 */
export function calculateScore(status: "solved" | "failed", timeSeconds: number, hintsUsed: number): number {
  if (status === "solved") {
    let score = 100;
    // Bonus for quick solve (e.g., solved under 60s)
    if (timeSeconds < 60) score += 50;
    // Penalty for hints used
    score -= hintsUsed * 10;
    return score < 0 ? 0 : score;
  }
  return 0;
}
