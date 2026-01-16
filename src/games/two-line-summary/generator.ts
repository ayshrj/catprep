import { makeId, pick } from "../core/generator-utils";
import { makeRng } from "../core/rng";

type Topic = {
  title: string;
  passage: string;
  keywords: string[];
  sample: string;
};

const TOPICS: Topic[] = [
  {
    title: "Tradeoffs in focus",
    passage:
      "Multitasking feels productive, but it increases switching costs. Each time attention shifts, the brain spends effort reloading context. " +
      "Short bursts of focused work reduce this overhead and improve accuracy. The gain is not just speed, but fewer errors that otherwise require rework.",
    keywords: ["switching", "focus", "errors"],
    sample:
      "Multitasking raises switching costs by forcing repeated context reloads. Focused work reduces overhead and errors, improving speed and quality.",
  },
  {
    title: "Incentives and behavior",
    passage:
      "People respond to incentives, but not always in predictable ways. When a single metric dominates evaluation, behavior shifts to optimize that metric. " +
      "This can improve performance on the measured dimension while harming unmeasured outcomes. Designing metrics therefore requires anticipating gaming.",
    keywords: ["metric", "optimize", "unmeasured"],
    sample:
      "Dominant metrics reshape behavior to optimize what is measured. This can damage unmeasured outcomes, so metrics must be designed to reduce gaming.",
  },
  {
    title: "Prediction vs explanation",
    passage:
      "A story can fit past events without predicting future ones. Explanation can be retrospective, selecting details that make outcomes seem inevitable. " +
      "Prediction must confront uncertainty and be tested on unseen cases. Confusing explanation for prediction leads to misplaced confidence.",
    keywords: ["retrospective", "prediction", "uncertainty"],
    sample:
      "Retrospective explanations can fit the past without forecasting. Prediction must handle uncertainty and pass tests on unseen cases, or confidence is misplaced.",
  },
  {
    title: "Remote alignment",
    passage:
      "Distributed teams lack informal context, so assumptions go unspoken and priorities drift. Clear written norms and decision logs help replace hallway clarity. " +
      "More messages alone do not fix alignment if they are vague or inconsistent.",
    keywords: ["alignment", "norms", "assumptions"],
    sample:
      "Remote teams avoid drift when they replace informal cues with clear norms and decision records. More messages alone do not solve alignment if clarity is missing.",
  },
];

export function createPuzzle(opts: { seed: number; difficulty: number }) {
  const rng = makeRng(opts.seed);
  const difficulty = Math.max(1, Math.min(3, opts.difficulty));
  const topic = pick(rng, TOPICS);

  const minWords = difficulty <= 1 ? 22 : difficulty === 2 ? 24 : 26;
  const maxWords = difficulty <= 1 ? 35 : difficulty === 2 ? 38 : 40;

  return {
    id: makeId(rng, "tls"),
    promptTitle: topic.title,
    passage: topic.passage,
    minWords,
    maxWords,
    requiredKeywords: topic.keywords,
    sampleGoodSummary: topic.sample,
  };
}
