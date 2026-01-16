import { makeId, pick, shuffle } from "../core/generator-utils";
import { makeRng } from "../core/rng";
import type { ParaSummaryPuzzle } from "./types";

type Topic = {
  title: string;
  thesis: string;
  support: string;
  caveat: string;
  summary: string;
  distractors: string[];
};

const TOPICS: Topic[] = [
  {
    title: "Friction and habits",
    thesis: "Reducing friction makes habits easier to maintain.",
    support: "When steps are removed, the desired action becomes more repeatable and less effortful.",
    caveat: "This does not remove the need for motivation, but it makes consistency less fragile.",
    summary: "Removing steps lowers friction, making habits more consistent over time.",
    distractors: [
      "Habits are determined mainly by personality traits.",
      "Motivation is the only driver of sustained habits.",
      "Harder routines always create better results.",
    ],
  },
  {
    title: "Metrics and incentives",
    thesis: "When one metric dominates evaluation, behavior shifts to optimize that metric.",
    support: "This can improve the measured dimension while harming outcomes that are not tracked.",
    caveat: "Good measurement anticipates gaming and balances incentives.",
    summary: "Dominant metrics reshape behavior and can hurt unmeasured outcomes, so balanced measures are needed.",
    distractors: [
      "Metrics are always harmful and should be eliminated.",
      "Gaming is impossible if incentives are clear.",
      "Only long-term metrics matter; short-term metrics are useless.",
    ],
  },
  {
    title: "Explanation vs prediction",
    thesis: "A retrospective explanation can fit the past without predicting the future.",
    support: "Prediction must confront uncertainty and be tested on unseen cases.",
    caveat: "Confusing the two leads to misplaced confidence.",
    summary: "Explanation can fit past events, but prediction must handle unknowns and be tested.",
    distractors: [
      "If a theory explains the past, it will predict the future reliably.",
      "Prediction and explanation are identical because both use models.",
      "Uncertainty makes all prediction worthless.",
    ],
  },
  {
    title: "Remote alignment",
    thesis: "Remote teams need explicit norms to avoid drift.",
    support: "Silent assumptions multiply when context is not shared in person.",
    caveat: "More communication is not always better; clarity matters more than volume.",
    summary: "Remote work succeeds when teams replace implicit cues with clear communication norms.",
    distractors: [
      "Remote work fails mainly because motivation is lower at home.",
      "More messages always improve alignment.",
      "Async communication should replace all meetings.",
    ],
  },
];

function buildOptions(rng: () => number, correct: string, distractors: string[]) {
  const options = shuffle(rng, [correct, ...distractors.slice(0, 3)]);
  const ids = ["a", "b", "c", "d"] as const;
  return {
    options: options.map((text, idx) => ({ id: ids[idx], text })),
    correctOptionId: ids[options.indexOf(correct)],
  };
}

export function createPuzzle(opts: { seed: number; difficulty: number }): ParaSummaryPuzzle {
  const rng = makeRng(opts.seed);
  const topic = pick(rng, TOPICS);

  const passage = [topic.thesis, topic.support, topic.caveat].join(" ");
  const built = buildOptions(rng, topic.summary, topic.distractors);

  return {
    id: makeId(rng, "ps"),
    title: topic.title,
    passage,
    options: built.options,
    correctOptionId: built.correctOptionId,
    explanation: "Choose the option that matches the passage’s thesis without adding new claims.",
  };
}
