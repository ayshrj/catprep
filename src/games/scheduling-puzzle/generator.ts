import { pick, sampleUnique, shuffle } from "../core/generator-utils";
import { makeRng } from "../core/rng";
import { ScheduleConstraint, SchedulingPuzzle } from "./types";

const SLOT_THEMES = [
  ["Slot 1", "Slot 2", "Slot 3", "Slot 4", "Slot 5", "Slot 6"],
  ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  ["T1", "T2", "T3", "T4", "T5", "T6"],
  ["Session 1", "Session 2", "Session 3", "Session 4", "Session 5", "Session 6"],
];

const ITEM_BANK = [
  "Audit",
  "Briefing",
  "Call",
  "Deck",
  "Email",
  "Follow-up",
  "Huddle",
  "Interview",
  "Kickoff",
  "Launch",
  "Meetup",
  "Review",
  "Sync",
  "Training",
  "Workshop",
];

function buildConstraints(
  rng: () => number,
  items: string[],
  slots: string[],
  solution: string[],
  difficulty: number
): ScheduleConstraint[] {
  const indexByItem = new Map<string, number>();
  solution.forEach((item, idx) => indexByItem.set(item, idx));

  const targetCount = difficulty <= 1 ? 3 : difficulty === 2 ? 5 : 7;
  const constraints: ScheduleConstraint[] = [];
  const seen = new Set<string>();

  const addConstraint = (c: ScheduleConstraint) => {
    const key = JSON.stringify(c);
    if (seen.has(key)) return false;
    seen.add(key);
    constraints.push(c);
    return true;
  };

  const tryAdd = () => {
    const type = pick(rng, ["notInSlot", "inSlot", "before", "after", "adjacent", "notAdjacent"]);
    switch (type) {
      case "notInSlot": {
        const item = pick(rng, items);
        const actual = indexByItem.get(item)!;
        const slot = pick(
          rng,
          slots.map((_, idx) => idx).filter(idx => idx !== actual)
        );
        return addConstraint({ type: "notInSlot", item, slot });
      }
      case "inSlot": {
        const item = pick(rng, items);
        const slot = indexByItem.get(item)!;
        return addConstraint({ type: "inSlot", item, slot });
      }
      case "before": {
        const candidates = items.filter(it => indexByItem.get(it)! < items.length - 1);
        if (candidates.length === 0) return false;
        const a = pick(rng, candidates);
        const aIdx = indexByItem.get(a)!;
        const after = items.filter(it => indexByItem.get(it)! > aIdx);
        if (after.length === 0) return false;
        const b = pick(rng, after);
        return addConstraint({ type: "before", a, b });
      }
      case "after": {
        const candidates = items.filter(it => indexByItem.get(it)! > 0);
        if (candidates.length === 0) return false;
        const a = pick(rng, candidates);
        const aIdx = indexByItem.get(a)!;
        const before = items.filter(it => indexByItem.get(it)! < aIdx);
        if (before.length === 0) return false;
        const b = pick(rng, before);
        return addConstraint({ type: "after", a, b });
      }
      case "adjacent": {
        const pairs: Array<[string, string]> = [];
        for (let i = 0; i < solution.length - 1; i++) {
          pairs.push([solution[i], solution[i + 1]]);
        }
        const [a, b] = pick(rng, pairs);
        return addConstraint({ type: "adjacent", a, b });
      }
      case "notAdjacent": {
        const pairs: Array<[string, string]> = [];
        for (let i = 0; i < items.length; i++) {
          for (let j = i + 1; j < items.length; j++) {
            const a = items[i];
            const b = items[j];
            const ia = indexByItem.get(a)!;
            const ib = indexByItem.get(b)!;
            if (Math.abs(ia - ib) > 1) pairs.push([a, b]);
          }
        }
        if (pairs.length === 0) return false;
        const [a, b] = pick(rng, pairs);
        return addConstraint({ type: "notAdjacent", a, b });
      }
      default:
        return false;
    }
  };

  let attempts = 0;
  while (constraints.length < targetCount && attempts < 200) {
    if (!tryAdd()) attempts++;
  }

  return constraints;
}

function stringifyConstraint(c: ScheduleConstraint, slots: string[]) {
  switch (c.type) {
    case "notInSlot":
      return `${c.item} is NOT in ${slots[c.slot]}.`;
    case "inSlot":
      return `${c.item} is in ${slots[c.slot]}.`;
    case "before":
      return `${c.a} is before ${c.b}.`;
    case "after":
      return `${c.a} is after ${c.b}.`;
    case "adjacent":
      return `${c.a} is adjacent to ${c.b}.`;
    case "notAdjacent":
      return `${c.a} is NOT adjacent to ${c.b}.`;
  }
}

export function createPuzzle(opts: { seed: number; difficulty: number }): SchedulingPuzzle {
  const rng = makeRng(opts.seed);
  const difficulty = Math.max(1, Math.min(3, opts.difficulty));

  const size = difficulty <= 1 ? 4 : difficulty === 2 ? 5 : 6;
  const slots = pick(rng, SLOT_THEMES).slice(0, size);
  const items = sampleUnique(rng, ITEM_BANK, size);
  const solution = shuffle(rng, items);

  const constraints = buildConstraints(rng, items, slots, solution, difficulty);

  return {
    slots,
    items,
    solution,
    constraints,
  };
}

export function constraintsAsText(puzzle: SchedulingPuzzle) {
  return puzzle.constraints.map(c => stringifyConstraint(c, puzzle.slots));
}
