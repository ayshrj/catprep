import { pick, randInt, sampleUnique, shuffle } from "../core/generator-utils";
import { makeRng } from "../core/rng";
import { LogicGridPuzzle } from "./types";

const THEMES = [
  {
    row: { name: "Person", items: ["Asha", "Bharat", "Chitra", "Deepak", "Esha", "Farhan"] },
    col: { name: "Pet", items: ["Cat", "Dog", "Fish", "Parrot", "Hamster", "Turtle"] },
  },
  {
    row: { name: "Student", items: ["Neha", "Om", "Ria", "Sameer", "Tara", "Vik"] },
    col: { name: "City", items: ["Delhi", "Pune", "Kolkata", "Chennai", "Jaipur", "Surat"] },
  },
  {
    row: { name: "Team", items: ["Alpha", "Beta", "Gamma", "Delta", "Sigma", "Omega"] },
    col: { name: "Rank", items: ["1st", "2nd", "3rd", "4th", "5th", "6th"] },
  },
  {
    row: { name: "Chef", items: ["Aman", "Bianca", "Carlos", "Diya", "Eli", "Fatima"] },
    col: { name: "Cuisine", items: ["Italian", "Mexican", "Thai", "Indian", "French", "Korean"] },
  },
  {
    row: { name: "Project", items: ["Apollo", "Boreal", "Caspian", "Drift", "Equinox", "Flux"] },
    col: { name: "Budget", items: ["10L", "12L", "14L", "16L", "18L", "20L"] },
  },
];

function buildClues(
  rng: () => number,
  rows: string[],
  cols: string[],
  solution: number[],
  difficulty: number,
  rowLabel: string
) {
  const targetCount = difficulty <= 1 ? 4 : difficulty === 2 ? 5 : 6;
  const clues: string[] = [];
  const used = new Set<string>();

  const add = (clue: string) => {
    if (used.has(clue)) return false;
    used.add(clue);
    clues.push(clue);
    return true;
  };

  const rPos = randInt(rng, 0, rows.length - 1);
  add(`${rows[rPos]} is ${cols[solution[rPos]]}.`);

  while (clues.length < targetCount) {
    const r = randInt(rng, 0, rows.length - 1);
    const correct = solution[r];
    const wrongCols = cols.map((_, idx) => idx).filter(idx => idx !== correct);
    const wrong = pick(rng, wrongCols);

    if (rng() < 0.25 && wrongCols.length >= 2) {
      const other = pick(
        rng,
        wrongCols.filter(idx => idx !== wrong)
      );
      add(`${rows[r]} is not in ${cols[wrong]} or ${cols[other]}.`);
    } else if (rng() < 0.55) {
      add(`${rows[r]} is not in ${cols[wrong]}.`);
    } else {
      const otherRow = pick(
        rng,
        rows.filter((_, i) => i !== r)
      );
      add(`The ${rowLabel} in ${cols[correct]} is not ${otherRow}.`);
    }
  }

  return clues;
}

export function createPuzzle(opts: { seed: number; difficulty: number }): LogicGridPuzzle {
  const rng = makeRng(opts.seed);
  const difficulty = Math.max(1, Math.min(3, opts.difficulty));
  const theme = pick(rng, THEMES);
  const rows = sampleUnique(rng, theme.row.items, 4);
  const cols = sampleUnique(rng, theme.col.items, 4);
  const solution = shuffle(rng, [0, 1, 2, 3]);
  const clues = buildClues(rng, rows, cols, solution, difficulty, theme.row.name.toLowerCase());

  return {
    rowCategory: { name: theme.row.name, items: rows },
    colCategory: { name: theme.col.name, items: cols },
    solution,
    clues,
  };
}
