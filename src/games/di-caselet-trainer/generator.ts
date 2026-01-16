import { makeId, pick, randInt } from "../core/generator-utils";
import { makeRng } from "../core/rng";
import { DICaseletPuzzle } from "./types";

type Scenario = {
  title: string;
  caselet: string;
  headers: string[];
  rowLabels: string[];
  buildRows: (rng: () => number, difficulty: number) => Array<{ label: string; values: number[] }>;
  buildQuestions: (rows: Array<{ label: string; values: number[] }>) => DICaseletPuzzle["questions"];
};

const SCENARIOS: Scenario[] = [
  {
    title: "Quarterly Sales Snapshot",
    caselet:
      "A startup tracks quarterly unit sales (in thousands) for two products. Use the table to answer the questions. Assume values are exact.",
    headers: ["Quarter", "Product A", "Product B"],
    rowLabels: ["Q1", "Q2", "Q3", "Q4"],
    buildRows: (rng, difficulty) => {
      const baseA =
        difficulty <= 1 ? randInt(rng, 35, 70) : difficulty === 2 ? randInt(rng, 45, 90) : randInt(rng, 55, 110);
      const baseB =
        difficulty <= 1 ? randInt(rng, 25, 60) : difficulty === 2 ? randInt(rng, 35, 80) : randInt(rng, 45, 95);
      const stepA = randInt(rng, 3, 8);
      const stepB = randInt(rng, 2, 7);

      return ["Q1", "Q2", "Q3", "Q4"].map((label, idx) => ({
        label,
        values: [baseA + idx * stepA, baseB + idx * stepB],
      }));
    },
    buildQuestions: rows => {
      const q1Start = rows[0].values[0];
      const q1End = rows[rows.length - 1].values[0];
      const q1Ans = ((q1End - q1Start) / q1Start) * 100;

      const q2Row = rows[1];
      const q2Ans = (q2Row.values[1] / q2Row.values[0]) * 100;

      return [
        {
          id: "q1",
          prompt: "What is the percentage increase in Product A sales from Q1 to Q4?",
          answer: q1Ans,
          tolerance: 0.05,
          unit: "%",
          solution: `Increase = ${q1End}-${q1Start}=${q1End - q1Start}. % increase = ${
            q1End - q1Start
          }/${q1Start} ×100 = ${q1Ans.toFixed(2)}%.`,
        },
        {
          id: "q2",
          prompt: "In Q2, Product B sales are what percent of Product A sales?",
          answer: q2Ans,
          tolerance: 0.05,
          unit: "%",
          solution: `${q2Row.values[1]}/${q2Row.values[0]} ×100 = ${q2Ans.toFixed(2)}%.`,
        },
      ];
    },
  },
  {
    title: "Regional Revenue",
    caselet:
      "A company reports revenue (in millions) across regions for two years. Use the table to answer the questions.",
    headers: ["Region", "2023", "2024"],
    rowLabels: ["North", "South", "East", "West"],
    buildRows: (rng, difficulty) =>
      ["North", "South", "East", "West"].map(label => {
        const base =
          difficulty <= 1 ? randInt(rng, 40, 90) : difficulty === 2 ? randInt(rng, 55, 120) : randInt(rng, 70, 160);
        const growth = randInt(rng, -5, 20);
        return { label, values: [base, Math.max(10, base + growth)] };
      }),
    buildQuestions: rows => {
      const total2024 = rows.reduce((sum, r) => sum + r.values[1], 0);
      const focus = rows[0];
      const pctChange = ((focus.values[1] - focus.values[0]) / focus.values[0]) * 100;
      return [
        {
          id: "q1",
          prompt: "What is the total revenue in 2024 across all regions?",
          answer: total2024,
          tolerance: 0.05,
          unit: "million",
          solution: `Sum 2024 values = ${rows.map(r => r.values[1]).join(" + ")} = ${total2024}.`,
        },
        {
          id: "q2",
          prompt: `What is the percentage change in ${focus.label} revenue from 2023 to 2024?`,
          answer: pctChange,
          tolerance: 0.05,
          unit: "%",
          solution: `(${focus.values[1]}-${focus.values[0]})/${focus.values[0]} ×100 = ${pctChange.toFixed(2)}%.`,
        },
      ];
    },
  },
  {
    title: "Production and Defects",
    caselet:
      "A manufacturer tracks daily output (in units) and defects for three plants. Use the table to compute rates and totals.",
    headers: ["Plant", "Output", "Defects"],
    rowLabels: ["Plant A", "Plant B", "Plant C"],
    buildRows: (rng, difficulty) =>
      ["Plant A", "Plant B", "Plant C"].map(label => {
        const output =
          difficulty <= 1 ? randInt(rng, 180, 320) : difficulty === 2 ? randInt(rng, 240, 420) : randInt(rng, 300, 520);
        const defectRate =
          difficulty <= 1 ? randInt(rng, 2, 6) : difficulty === 2 ? randInt(rng, 3, 8) : randInt(rng, 4, 10);
        const defects = Math.max(1, Math.round((output * defectRate) / 100));
        return { label, values: [output, defects] };
      }),
    buildQuestions: rows => {
      const focus = rows[1];
      const defectRate = (focus.values[1] / focus.values[0]) * 100;
      const totalOutput = rows.reduce((sum, r) => sum + r.values[0], 0);
      return [
        {
          id: "q1",
          prompt: `What is the defect rate for ${focus.label}?`,
          answer: defectRate,
          tolerance: 0.05,
          unit: "%",
          solution: `${focus.values[1]}/${focus.values[0]} ×100 = ${defectRate.toFixed(2)}%.`,
        },
        {
          id: "q2",
          prompt: "What is the total output across all plants?",
          answer: totalOutput,
          tolerance: 0.05,
          unit: "units",
          solution: `Sum output = ${rows.map(r => r.values[0]).join(" + ")} = ${totalOutput}.`,
        },
      ];
    },
  },
];

export function createPuzzle(opts: { seed: number; difficulty: number }): DICaseletPuzzle {
  const rng = makeRng(opts.seed);
  const difficulty = Math.max(1, Math.min(3, opts.difficulty));
  const scenario = pick(rng, SCENARIOS);

  const rows = scenario.buildRows(rng, difficulty);

  const questions = scenario.buildQuestions(rows);

  return {
    id: makeId(rng, "di"),
    title: scenario.title,
    caselet: scenario.caselet,
    table: {
      headers: scenario.headers.slice(),
      rows: rows.map(r => ({ label: r.label, values: r.values.slice() })),
    },
    questions,
    difficulty,
  };
}
