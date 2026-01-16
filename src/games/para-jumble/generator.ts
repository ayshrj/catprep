import { makeId, pick, shuffle } from "../core/generator-utils";
import { makeRng } from "../core/rng";
import type { ParaJumblePuzzle } from "./types";

type Topic = {
  title: string;
  context: string;
  cause: string;
  effect: string;
  implication: string;
};

const TOPICS: Topic[] = [
  {
    title: "Focus and errors",
    context: "Many people try to work faster when deadlines tighten.",
    cause: "Fragmented attention forces the brain to reload context repeatedly.",
    effect: "This creates fatigue and increases small mistakes.",
    implication: "Therefore, deliberate focus often beats frantic multitasking.",
  },
  {
    title: "Metrics and gaming",
    context: "Organizations often rely on a single performance metric.",
    cause: "When one number dominates, people optimize for it at the expense of others.",
    effect: "Short-term scores rise while unmeasured quality can drop.",
    implication: "So balanced metrics are needed to prevent gaming.",
  },
  {
    title: "Remote alignment",
    context: "Distributed teams lack the casual signals of an office.",
    cause: "Assumptions go unspoken, so priorities drift across time zones.",
    effect: "Projects slow as teams rework mismatched decisions.",
    implication: "Clear written norms restore alignment without extra meetings.",
  },
  {
    title: "Learning retention",
    context: "Students often cram before exams to feel prepared.",
    cause: "Spacing practice creates effortful recall, which strengthens memory.",
    effect: "Cramming boosts short-term recall but decays quickly.",
    implication: "Hence, short reviews across days beat a single marathon.",
  },
];

export function createPuzzle(opts: { seed: number; difficulty: number }): ParaJumblePuzzle {
  const rng = makeRng(opts.seed);
  const topic = pick(rng, TOPICS);

  const ordered = [topic.context, topic.cause, topic.effect, topic.implication];
  const shuffled = shuffle(
    rng,
    ordered.map((text, idx) => ({ text, idx }))
  );

  const sentences = shuffled.map(s => s.text);
  const correctOrder = ordered.map((_, idx) => shuffled.findIndex(s => s.idx === idx));

  const explanation = "Start with context, then cause, then effect, and end with the implication/conclusion.";

  return {
    id: makeId(rng, "pj"),
    title: topic.title,
    sentences,
    correctOrder,
    explanation,
  };
}
