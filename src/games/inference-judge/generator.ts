import { makeId, pick, randInt, shuffle } from "../core/generator-utils";
import { makeRng } from "../core/rng";
import { InferenceJudgePuzzle } from "./types";

type Option = { text: string; why: string; correct?: boolean };

type Scenario = {
  build: (rng: () => number) => { passage: string; options: Option[] };
};

const SCENARIOS: Scenario[] = [
  {
    build: rng => {
      const carDrop = randInt(rng, 10, 25);
      const busRise = randInt(rng, 5, 15);
      const speedGain = randInt(rng, 3, 9);
      const passage =
        `A city introduced a congestion charge for private cars in the central zone. ` +
        `In six months, car entries fell by ${carDrop}%. Bus ridership rose by ${busRise}%, ` +
        `and average bus speeds improved by ${speedGain}%. Retail footfall in the zone remained stable.`;
      const options: Option[] = [
        {
          text: `Average bus speeds increased after the charge was introduced.`,
          why: "Directly stated.",
          correct: true,
        },
        { text: `Retailers in the zone opposed the congestion charge.`, why: "No evidence about opposition." },
        { text: `Citywide traffic congestion decreased.`, why: "Only the central zone is discussed." },
        { text: `Car owners shifted mostly to cycling.`, why: "Mode shift beyond buses is not stated." },
      ];
      return { passage, options };
    },
  },
  {
    build: rng => {
      const fatigueGap = randInt(rng, 8, 18);
      const passage =
        `In a study of two groups, participants who took brief walking breaks every hour reported ` +
        `lower late-afternoon fatigue by about ${fatigueGap}% compared with those who worked continuously. ` +
        `Productivity scores were similar in both groups.`;
      const options: Option[] = [
        {
          text: `The walking-break group reported lower fatigue later in the day.`,
          why: "Directly stated.",
          correct: true,
        },
        { text: `Productivity improved substantially in the walking-break group.`, why: "Productivity was similar." },
        {
          text: `Walking breaks reduced fatigue for every participant.`,
          why: "Group averages do not imply all individuals.",
        },
        { text: `Continuous workers experienced higher stress levels.`, why: "Stress is not mentioned." },
      ];
      return { passage, options };
    },
  },
  {
    build: rng => {
      const clarityGain = randInt(rng, 6, 14);
      const passage =
        `A firm replaced a yearly performance review with quarterly check-ins. After a year, ` +
        `survey responses showed clarity about goals increased by ${clarityGain}%, but manager time ` +
        `spent on performance discussions rose.`;
      const options: Option[] = [
        {
          text: "Managers spent more time on performance discussions after introducing check-ins.",
          why: "Directly stated.",
          correct: true,
        },
        { text: "Employee satisfaction improved in every department.", why: "No department breakdown is given." },
        { text: "The policy reduced turnover.", why: "Turnover is not mentioned." },
        { text: "Quarterly check-ins are always better than yearly reviews.", why: "Absolute claim not supported." },
      ];
      return { passage, options };
    },
  },
  {
    build: rng => {
      const completionGap = randInt(rng, 10, 25);
      const passage =
        `An online course offered two tracks: self-paced and instructor-led. Completion rates were ` +
        `higher in the instructor-led track by ${completionGap} percentage points, but average quiz ` +
        `scores among completers were similar across tracks.`;
      const options: Option[] = [
        { text: "Completion rates differed between the two tracks.", why: "Directly stated.", correct: true },
        { text: "Instructor-led teaching improved quiz performance.", why: "Quiz scores were similar." },
        { text: "Most learners prefer self-paced courses.", why: "Preference is not stated." },
        { text: "Self-paced learners studied fewer hours.", why: "Study hours are not given." },
      ];
      return { passage, options };
    },
  },
];

function finalizeOptions(rng: () => number, options: Option[]) {
  const shuffled = shuffle(rng, options);
  const ids = ["A", "B", "C", "D"] as const;
  const mapped = shuffled.map((opt, idx) => ({
    id: ids[idx],
    text: opt.text,
    why: opt.why,
    correct: opt.correct,
  }));
  const correct = mapped.find(m => m.correct);
  return {
    options: mapped.map(({ id, text, why }) => ({ id, text, why })),
    correctOptionId: correct?.id ?? "A",
  };
}

export function createPuzzle(opts: { seed: number; difficulty: number }): InferenceJudgePuzzle {
  const rng = makeRng(opts.seed);
  const difficulty = Math.max(1, Math.min(3, opts.difficulty));
  const scenario = pick(rng, SCENARIOS);
  const built = scenario.build(rng);
  const finalized = finalizeOptions(rng, built.options);

  return {
    id: makeId(rng, "inf"),
    passage: built.passage,
    question: "Which statement must be true?",
    options: finalized.options,
    correctOptionId: finalized.correctOptionId,
    difficulty,
  };
}
