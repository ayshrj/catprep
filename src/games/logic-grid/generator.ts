import { LogicGridPuzzle } from "./types";

const PUZZLES: Array<{ puzzle: LogicGridPuzzle; difficulty: number }> = [
  {
    difficulty: 1,
    puzzle: {
      rowCategory: {
        name: "Person",
        items: ["Asha", "Bharat", "Chitra", "Deepak"],
      },
      colCategory: { name: "Pet", items: ["Cat", "Dog", "Fish", "Parrot"] },
      solution: [2, 1, 3, 0], // Asha->Fish(2), Bharat->Dog(1), Chitra->Parrot(3), Deepak->Cat(0)
      clues: [
        "Bharat has the Dog.",
        "Asha does not have the Cat.",
        "Deepak does not have the Fish.",
        "Chitra does not have the Dog.",
      ],
    },
  },
  {
    difficulty: 2,
    puzzle: {
      rowCategory: { name: "Student", items: ["Neha", "Om", "Ria", "Sameer"] },
      colCategory: {
        name: "City",
        items: ["Delhi", "Pune", "Kolkata", "Chennai"],
      },
      solution: [1, 3, 0, 2], // Neha->Pune, Om->Chennai, Ria->Delhi, Sameer->Kolkata
      clues: [
        "Om is not in Delhi or Kolkata.",
        "Ria is in Delhi.",
        "Sameer is not in Chennai.",
        "Neha is not in Delhi.",
        "The person in Kolkata is not Neha.",
      ],
    },
  },
  {
    difficulty: 3,
    puzzle: {
      rowCategory: { name: "Team", items: ["Alpha", "Beta", "Gamma", "Delta"] },
      colCategory: { name: "Rank", items: ["1st", "2nd", "3rd", "4th"] },
      solution: [2, 0, 3, 1], // Alpha 3rd, Beta 1st, Gamma 4th, Delta 2nd
      clues: [
        "Beta finished ahead of Delta.",
        "Alpha is not 1st or 2nd.",
        "Gamma is not 1st.",
        "Delta is not 4th.",
        "The 2nd place team is not Beta.",
      ],
    },
  },
];

export function createPuzzle(opts: { seed: number; difficulty: number }): LogicGridPuzzle {
  const pool = PUZZLES.filter(p => p.difficulty === opts.difficulty);
  const pick = pool[Math.abs(opts.seed) % pool.length];
  return pick.puzzle;
}
