import { InferenceJudgePuzzle } from "./types";

type BankItem = Omit<InferenceJudgePuzzle, "difficulty"> & {
  minDifficulty: number;
};

const BANK: BankItem[] = [
  {
    id: "inf-1",
    minDifficulty: 1,
    passage:
      "A city introduced a congestion charge for private cars in the central zone. In the first six months, car entries fell by 18%. Bus ridership rose by 9%, and average bus speeds improved by 6%. Retail footfall in the zone remained stable.",
    question: "Which statement must be true based on the passage?",
    correctOptionId: "B",
    options: [
      {
        id: "A",
        text: "Retailers in the zone opposed the congestion charge.",
        why: "No info about opposition.",
      },
      {
        id: "B",
        text: "Average bus speeds increased after the congestion charge was introduced.",
        why: "Directly stated: bus speeds improved by 6%.",
      },
      {
        id: "C",
        text: "Overall traffic congestion in the entire city decreased.",
        why: "Only central zone described; citywide not guaranteed.",
      },
      {
        id: "D",
        text: "Car owners switched to cycling more than public transport.",
        why: "Mode shift not specified beyond bus ridership.",
      },
    ],
  },
  {
    id: "inf-2",
    minDifficulty: 1,
    passage:
      "In a study of two groups, participants who took brief walking breaks every hour reported lower fatigue by late afternoon than those who worked continuously. Productivity scores were similar in both groups.",
    question: "Which statement must be true?",
    correctOptionId: "C",
    options: [
      {
        id: "A",
        text: "Walking breaks reduced fatigue for all participants.",
        why: "The passage says 'reported lower fatigue' at group level, not for all individuals.",
      },
      {
        id: "B",
        text: "Productivity improved substantially in the walking-break group.",
        why: "Productivity was similar.",
      },
      {
        id: "C",
        text: "The walking-break group reported lower fatigue late in the day.",
        why: "Directly stated.",
      },
      {
        id: "D",
        text: "Continuous workers experienced higher stress levels.",
        why: "Stress not mentioned.",
      },
    ],
  },
  {
    id: "inf-3",
    minDifficulty: 2,
    passage:
      "A firm replaced a yearly performance review with quarterly check-ins. After a year, employee survey responses showed higher clarity about goals, but manager time spent on performance discussions increased.",
    question: "Which statement must be true?",
    correctOptionId: "A",
    options: [
      {
        id: "A",
        text: "Managers spent more time on performance discussions after introducing check-ins.",
        why: "Directly stated.",
      },
      {
        id: "B",
        text: "Employee satisfaction increased in every department.",
        why: "No department breakdown.",
      },
      {
        id: "C",
        text: "The policy reduced turnover.",
        why: "Turnover not mentioned.",
      },
      {
        id: "D",
        text: "Quarterly check-ins are always better than yearly reviews.",
        why: "Absolute claim not supported.",
      },
    ],
  },
  {
    id: "inf-4",
    minDifficulty: 3,
    passage:
      "An online course offered two tracks: self-paced and instructor-led. Completion rates were higher in the instructor-led track, but average quiz scores among completers were similar across tracks.",
    question: "Which statement must be true?",
    correctOptionId: "D",
    options: [
      {
        id: "A",
        text: "Self-paced learners studied fewer hours than instructor-led learners.",
        why: "Study hours not given.",
      },
      {
        id: "B",
        text: "Instructor-led instruction improved quiz performance.",
        why: "Quiz scores among completers were similar.",
      },
      {
        id: "C",
        text: "Most learners prefer self-paced courses.",
        why: "Preference not stated.",
      },
      {
        id: "D",
        text: "Completion rates differed between the two tracks.",
        why: "Directly stated: higher in instructor-led track.",
      },
    ],
  },
];

export function createPuzzle(opts: { seed: number; difficulty: number }): InferenceJudgePuzzle {
  const difficulty = Math.max(1, Math.min(3, opts.difficulty));
  const eligible = BANK.filter(b => b.minDifficulty <= difficulty);
  const picked = eligible[Math.abs(opts.seed) % eligible.length];

  return {
    id: picked.id,
    passage: picked.passage,
    question: picked.question,
    options: picked.options.map(o => ({ ...o })),
    correctOptionId: picked.correctOptionId,
    difficulty,
  };
}
