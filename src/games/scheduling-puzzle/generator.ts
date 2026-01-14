import { ScheduleConstraint, SchedulingPuzzle } from "./types";

type Def = { difficulty: number; puzzle: SchedulingPuzzle };

const PUZZLES: Def[] = [
  {
    difficulty: 1,
    puzzle: {
      slots: ["Slot 1", "Slot 2", "Slot 3", "Slot 4"],
      items: ["A", "B", "C", "D"],
      solution: ["C", "A", "D", "B"],
      constraints: [
        { type: "before", a: "C", b: "D" },
        { type: "notInSlot", item: "B", slot: 1 },
        { type: "adjacent", a: "A", b: "D" },
      ],
    },
  },
  {
    difficulty: 2,
    puzzle: {
      slots: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      items: ["Audit", "Briefing", "Call", "Deck", "Email"],
      solution: ["Call", "Email", "Audit", "Deck", "Briefing"],
      constraints: [
        { type: "notInSlot", item: "Audit", slot: 1 }, // not Tue
        { type: "before", a: "Call", b: "Audit" },
        { type: "notAdjacent", a: "Deck", b: "Call" },
        { type: "after", a: "Briefing", b: "Deck" },
        { type: "notInSlot", item: "Email", slot: 4 }, // not Fri
      ],
    },
  },
  {
    difficulty: 3,
    puzzle: {
      slots: ["T1", "T2", "T3", "T4", "T5", "T6"],
      items: ["P", "Q", "R", "S", "T", "U"],
      solution: ["S", "Q", "U", "P", "T", "R"],
      constraints: [
        { type: "before", a: "S", b: "U" },
        { type: "after", a: "R", b: "T" },
        { type: "notAdjacent", a: "P", b: "Q" },
        { type: "notInSlot", item: "S", slot: 5 }, // not T6
        { type: "notInSlot", item: "U", slot: 0 }, // not T1
        { type: "adjacent", a: "T", b: "P" },
        { type: "before", a: "Q", b: "P" },
      ],
    },
  },
];

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
  const pool = PUZZLES.filter(p => p.difficulty === opts.difficulty);
  const pick = pool[Math.abs(opts.seed) % pool.length].puzzle;

  // Normalize: ensure constraints are present
  return {
    ...pick,
    constraints: pick.constraints.slice(),
    slots: pick.slots.slice(),
    items: pick.items.slice(),
    solution: pick.solution.slice(),
  };
}

export function constraintsAsText(puzzle: SchedulingPuzzle) {
  return puzzle.constraints.map(c => stringifyConstraint(c, puzzle.slots));
}
