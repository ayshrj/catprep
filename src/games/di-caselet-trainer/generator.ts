import { DICaseletPuzzle } from "./types";

type BankItem = Omit<DICaseletPuzzle, "difficulty"> & { minDifficulty: number };

const BANK: BankItem[] = [
  {
    id: "di-1",
    minDifficulty: 1,
    title: "Quarterly Sales Snapshot",
    caselet:
      "A startup tracks quarterly unit sales (in thousands) for two products. Use the table to answer the questions. Assume values are exact.",
    table: {
      headers: ["Quarter", "Product A", "Product B"],
      rows: [
        { label: "Q1", values: [40, 30] },
        { label: "Q2", values: [50, 36] },
        { label: "Q3", values: [55, 33] },
        { label: "Q4", values: [60, 42] },
      ],
    },
    questions: [
      {
        id: "q1",
        prompt: "What is the percentage increase in Product A sales from Q1 to Q4?",
        answer: 50, // (60-40)/40 * 100
        tolerance: 0.01,
        unit: "%",
        solution: "Increase = 60-40=20. % increase = 20/40 ×100 = 50%.",
      },
      {
        id: "q2",
        prompt: "In Q2, Product B sales are what percent of Product A sales?",
        answer: 72, // 36/50*100
        tolerance: 0.01,
        unit: "%",
        solution: "36/50 ×100 = 72%.",
      },
    ],
  },
  {
    id: "di-2",
    minDifficulty: 2,
    title: "Call Center Metrics",
    caselet:
      "A call center records average handling time (AHT, in minutes) and daily calls handled by two teams. Use the data to compute weighted average AHT.",
    table: {
      headers: ["Day", "Team X Calls", "Team X AHT", "Team Y Calls", "Team Y AHT"],
      rows: [
        { label: "Mon", values: [120, 4.5, 100, 5.0] },
        { label: "Tue", values: [150, 4.2, 90, 5.4] },
        { label: "Wed", values: [130, 4.6, 110, 5.1] },
      ],
    },
    questions: [
      {
        id: "q1",
        prompt: "Compute the overall weighted average AHT for Monday (weight by calls).",
        answer: 4.7272727, // (120*4.5 + 100*5)/220
        tolerance: 0.02,
        unit: "minutes",
        solution: "Weighted AHT = (120×4.5 + 100×5.0) / (120+100) = (540+500)/220 = 1040/220 ≈ 4.73.",
      },
      {
        id: "q2",
        prompt: "On Tuesday, what is the ratio of Team X calls to Team Y calls?",
        answer: 150 / 90, // 1.666...
        tolerance: 0.02,
        unit: "",
        solution: "Ratio = 150:90 = 5:3 ≈ 1.67.",
      },
    ],
  },
  {
    id: "di-3",
    minDifficulty: 3,
    title: "Inventory & Returns",
    caselet:
      "A retailer tracks shipments and returns for three categories over two months. Use the table to compute net units and percentage shares.",
    table: {
      headers: ["Category", "Jan Shipped", "Jan Returned", "Feb Shipped", "Feb Returned"],
      rows: [
        { label: "Electronics", values: [800, 80, 900, 99] },
        { label: "Home", values: [600, 30, 750, 45] },
        { label: "Fashion", values: [700, 140, 650, 130] },
      ],
    },
    questions: [
      {
        id: "q1",
        prompt: "Total net units (shipped - returned) in January across all categories?",
        answer: 800 - 80 + (600 - 30) + (700 - 140), // 1850
        tolerance: 0.01,
        unit: "units",
        solution: "Jan net = 720 + 570 + 560 = 1850.",
      },
      {
        id: "q2",
        prompt: "In February, what percent of total net units are Electronics? (Round to 2 decimals)",
        answer: ((900 - 99) / (900 - 99 + (750 - 45) + (650 - 130))) * 100,
        tolerance: 0.05,
        unit: "%",
        solution: "Feb net: E=801, H=705, F=520. Total=2026. %E = 801/2026×100 ≈ 39.54%.",
      },
    ],
  },
];

export function createPuzzle(opts: { seed: number; difficulty: number }): DICaseletPuzzle {
  const difficulty = Math.max(1, Math.min(3, opts.difficulty));
  const eligible = BANK.filter(b => b.minDifficulty <= difficulty);
  const picked = eligible[Math.abs(opts.seed) % eligible.length];

  return {
    id: picked.id,
    title: picked.title,
    caselet: picked.caselet,
    table: {
      headers: picked.table.headers.slice(),
      rows: picked.table.rows.map(r => ({
        label: r.label,
        values: r.values.slice(),
      })),
    },
    questions: picked.questions.map(q => ({ ...q })),
    difficulty,
  };
}
