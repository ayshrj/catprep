import { makeId, pick, shuffle } from "../core/generator-utils";
import { makeRng } from "../core/rng";
import type { RcDailyPuzzle } from "./types";

type Topic = {
  title: string;
  claim: string;
  support: string;
  caveat: string;
  implication: string;
  example: string;
  mainDistractors: string[];
  caveatDistractors: string[];
  implicationDistractors: string[];
};

const TOPICS: Topic[] = [
  {
    title: "Habits and friction",
    claim: "Habits fail less from lack of willpower and more from small frictions in the environment.",
    support: "Minor setup costs compound, so repetition drops when the first step feels effortful.",
    caveat: "Motivation helps, but it is unreliable unless the path is simplified.",
    implication: "Reduce steps between intention and action to make routines stick.",
    example: "A default calendar reminder can outperform a big motivation speech.",
    mainDistractors: [
      "Habits are mostly determined by personality and cannot be changed.",
      "Long-term success depends entirely on sustained willpower.",
      "The passage argues against routines altogether.",
    ],
    caveatDistractors: [
      "Willpower is irrelevant once a habit starts.",
      "Friction only matters for complex tasks, not simple ones.",
      "The author says environments are fixed and cannot be redesigned.",
    ],
    implicationDistractors: [
      "Make routines harder to test commitment.",
      "Add more steps to build resilience.",
      "Avoid planning so habits feel spontaneous.",
    ],
  },
  {
    title: "Metrics and incentives",
    claim: "Systems optimize for what they measure, not necessarily for what they claim to value.",
    support: "When a single metric dominates, behavior shifts to hit that number even if other outcomes suffer.",
    caveat: "This is a warning about incentive design, not an argument against measurement itself.",
    implication: "Design metrics that balance short-term gains with long-term costs.",
    example: "A call-center metric can improve speed while degrading resolution quality.",
    mainDistractors: [
      "Measurement is useless because it hides information.",
      "Markets always allocate resources efficiently regardless of metrics.",
      "Incentives never affect behavior once rules are clear.",
    ],
    caveatDistractors: [
      "The author claims all metrics are harmful and should be removed.",
      "The passage says incentives do not influence decision-making.",
      "The author believes performance is best judged qualitatively only.",
    ],
    implicationDistractors: [
      "Pick a single metric and optimize it aggressively.",
      "Ignore unmeasured outcomes since they cannot be tracked.",
      "Eliminate incentives to prevent gaming.",
    ],
  },
  {
    title: "Explanation vs prediction",
    claim: "Explanation can fit the past without guaranteeing accurate prediction of the future.",
    support: "Retrospective stories often select details that make outcomes seem inevitable.",
    caveat: "Predictive accuracy can come from models that are hard to interpret.",
    implication: "Test models on unseen data before trusting them for decisions.",
    example: "A neat narrative can still fail when conditions shift.",
    mainDistractors: [
      "Any model that explains well will predict well.",
      "Prediction is impossible, so explanations are all that matter.",
      "Interpretability is always more important than accuracy.",
    ],
    caveatDistractors: [
      "The author says only intuitive models can generalize.",
      "Interpretability guarantees predictive performance.",
      "Predictive models must always be simple.",
    ],
    implicationDistractors: [
      "Adopt models that sound reasonable without testing them.",
      "Prefer explanations over forecasting in all cases.",
      "Avoid updating models when evidence contradicts them.",
    ],
  },
  {
    title: "Remote work communication",
    claim: "Remote work succeeds when teams replace ad hoc conversations with explicit communication norms.",
    support: "Without shared context, silent assumptions multiply and misalignment grows.",
    caveat: "More communication is not always better; clarity and timing matter more than volume.",
    implication: "Define which decisions require synchronous discussion and which can be documented.",
    example: "A brief weekly alignment note can prevent scattered priorities.",
    mainDistractors: [
      "Remote work fails because people are less motivated at home.",
      "Informal conversations are unnecessary for coordination.",
      "Only synchronous meetings can keep teams aligned.",
    ],
    caveatDistractors: [
      "The author wants more meetings regardless of their purpose.",
      "Clarity is less important than frequency of updates.",
      "Asynchronous communication always beats live discussion.",
    ],
    implicationDistractors: [
      "Increase message volume to ensure visibility.",
      "Avoid documentation to keep decisions flexible.",
      "Make all decisions in real-time meetings.",
    ],
  },
  {
    title: "Trust in automation",
    claim: "People trust automation when it is predictable and transparent about its limits.",
    support: "Inconsistent outputs create confusion even if average accuracy is high.",
    caveat: "Transparency alone is not enough if the system is erratic.",
    implication: "Design interfaces that communicate confidence and known failure cases.",
    example: "A navigation app that flags uncertain routes is used more consistently.",
    mainDistractors: [
      "Accuracy does not matter as long as the system is fast.",
      "Automation should hide uncertainty to avoid user doubt.",
      "Predictability is irrelevant to adoption.",
    ],
    caveatDistractors: [
      "The author claims transparency guarantees perfect trust.",
      "Consistency matters only for novice users.",
      "Erratic systems can be trusted if they are complex.",
    ],
    implicationDistractors: [
      "Remove confidence indicators to reduce clutter.",
      "Optimize only for speed, not reliability.",
      "Prevent users from seeing system limitations.",
    ],
  },
  {
    title: "Learning and spacing",
    claim: "Spacing practice improves long-term retention more than cramming does.",
    support: "Retrieval after a delay forces deeper processing than immediate repetition.",
    caveat: "Spacing still requires feedback; repeating mistakes can reinforce errors.",
    implication: "Schedule short reviews across days rather than one long session.",
    example: "A 10-minute recap every other day outperforms a weekend marathon.",
    mainDistractors: [
      "Cramming always leads to durable mastery.",
      "Only total study hours matter, not timing.",
      "Spacing is effective because it shortens study time.",
    ],
    caveatDistractors: [
      "The author says feedback is unnecessary.",
      "Spacing works even if mistakes are never corrected.",
      "Delays should be avoided because they reduce motivation.",
    ],
    implicationDistractors: [
      "Front-load all practice into a single block.",
      "Review only when you feel unsure.",
      "Avoid revisiting difficult material.",
    ],
  },
];

const STRATEGY_NOTES = [
  "Find the author's main claim, then eliminate options that add new ideas.",
  "Track scope: avoid options that overgeneralize with always/never.",
  "Separate what is stated from what is implied; inference questions punish overreach.",
];

function buildOptions(rng: () => number, correct: string, wrongs: string[]) {
  const options = shuffle(rng, [correct, ...wrongs.slice(0, 3)]);
  const ids = ["a", "b", "c", "d"] as const;
  const correctIndex = options.indexOf(correct);
  return {
    options: options.map((text, idx) => ({ id: ids[idx], text })),
    correctOptionId: ids[correctIndex],
  };
}

function buildPassage(rng: () => number, topic: Topic) {
  const openers = [
    "Many discussions focus on surface causes, but deeper patterns matter.",
    "At first glance the issue looks like a motivation problem, yet design plays a larger role.",
    "The common diagnosis misses a quieter driver in the background.",
  ];
  const contrasts = ["However,", "Yet,", "Still,", "Even so,"];
  const implications = ["As a result,", "Therefore,", "In practice,"];

  const sentences = [
    `${pick(rng, openers)} ${topic.claim}`,
    topic.support,
    `${pick(rng, contrasts)} ${topic.caveat}`,
    `${pick(rng, implications)} ${topic.implication}`,
    topic.example,
  ];

  return sentences.join(" ");
}

export function createPuzzle(opts: { seed: number; difficulty: number }): RcDailyPuzzle {
  const rng = makeRng(opts.seed);
  const difficulty = Math.max(1, Math.min(3, opts.difficulty));
  const topic = pick(rng, TOPICS);

  const passage = buildPassage(rng, topic);
  const strategyNote = STRATEGY_NOTES[difficulty - 1] ?? STRATEGY_NOTES[0];

  const q1 = buildOptions(rng, topic.claim, topic.mainDistractors);
  const q2 = buildOptions(rng, topic.caveat, topic.caveatDistractors);
  const q3 = buildOptions(rng, topic.implication, topic.implicationDistractors);

  return {
    id: makeId(rng, "rc"),
    title: topic.title,
    difficulty,
    strategyNote,
    passage,
    questions: [
      {
        id: "q1",
        prompt: "The passage primarily argues that:",
        options: q1.options,
        correctOptionId: q1.correctOptionId,
        explanation: "The main claim is stated directly in the opening of the passage.",
      },
      {
        id: "q2",
        prompt: "Which statement best captures the passage’s caveat?",
        options: q2.options,
        correctOptionId: q2.correctOptionId,
        explanation: "The author qualifies the claim in the contrast sentence.",
      },
      {
        id: "q3",
        prompt: "A practical implication consistent with the passage is to:",
        options: q3.options,
        correctOptionId: q3.correctOptionId,
        explanation: "The passage ends with a clear action implication.",
      },
    ],
  };
}
