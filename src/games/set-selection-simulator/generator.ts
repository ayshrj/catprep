import { makeRng } from "../core/rng";
import { SetCard, SetSelectionPuzzle } from "./types";

const TITLES = [
  "Percent + Table DI",
  "Routes & Constraints LR",
  "Tournament Points Table",
  "Stacked Bar Chart DI",
  "Scheduling with 3 Constraints",
  "Venn + Selection Trap",
  "Circular Arrangement LR",
  "Caselet with Ratios",
  "Network Flow Lite",
  "Puzzles with Conditional Counts",
];

function scoreEV(card: Omit<SetCard, "ev">): number {
  // Simple EV heuristic:
  // - prefer clear readability, low setup, medium/low computation
  // - penalize high setup + high computation
  let ev = 50;

  if (card.readability === "clear") ev += 10;
  if (card.setupCost === "low") ev += 10;
  if (card.setupCost === "high") ev -= 8;

  if (card.computation === "low") ev += 8;
  if (card.computation === "high") ev -= 10;

  // estimated minutes: sweet spot ~10-14
  if (card.estimatedMinutes <= 10) ev += 6;
  else if (card.estimatedMinutes <= 14) ev += 2;
  else ev -= 6;

  // type bonus: DI sets often quicker to judge via table clarity
  if (card.type === "DI") ev += 2;

  return ev;
}

export function createPuzzle(opts: { seed: number; difficulty: number }): SetSelectionPuzzle {
  const difficulty = Math.max(1, Math.min(3, opts.difficulty));
  const rng = makeRng(opts.seed);

  const scanSeconds = 120;
  const commitSeconds = 60;

  const count = difficulty === 1 ? 6 : difficulty === 2 ? 8 : 10;

  const sets: SetCard[] = Array.from({ length: count }, (_, i) => {
    const title = TITLES[i % TITLES.length];

    const type: SetCard["type"] = rng() < 0.45 ? "DI" : rng() < 0.8 ? "LR" : "Mixed";
    const setupCost: SetCard["setupCost"] = rng() < 0.5 ? "low" : rng() < 0.8 ? "medium" : "high";
    const computation: SetCard["computation"] = rng() < 0.5 ? "low" : rng() < 0.85 ? "medium" : "high";
    const readability: SetCard["readability"] = rng() < 0.7 ? "clear" : "messy";

    const estimatedMinutes =
      difficulty === 1
        ? Math.floor(8 + rng() * 8) // 8–15
        : difficulty === 2
          ? Math.floor(9 + rng() * 9) // 9–17
          : Math.floor(10 + rng() * 10); // 10–19

    const baseTags =
      type === "DI"
        ? ["Table-read", "Selective calc"]
        : type === "LR"
          ? ["Constraints", "Elimination"]
          : ["Hybrid", "Switching"];

    const cardBase = {
      id: `set-${i + 1}`,
      title,
      type,
      skillTags: baseTags,
      estimatedMinutes,
      setupCost,
      computation,
      readability,
    };

    const ev = scoreEV(cardBase);

    return { ...cardBase, ev };
  });

  return {
    id: `setsel-${Math.abs(opts.seed)}`,
    scanSeconds,
    commitSeconds,
    sets,
    difficulty,
  };
}
