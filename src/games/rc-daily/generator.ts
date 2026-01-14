import type { RcDailyPuzzle } from "./types";

const EASY: RcDailyPuzzle[] = [
  {
    id: "rc-e1",
    title: "Habits and friction",
    difficulty: 1,
    strategyNote:
      "Find the author's main claim, then eliminate options that add new ideas not supported by the passage.",
    passage:
      "People often blame motivation when habits fail. But habits frequently fail because the environment makes the desired action costly. " +
      "A small friction—like searching for shoes or opening a complicated app—can be enough to derail repetition. " +
      "Designing habits is therefore less about willpower and more about reducing the steps between intention and action. " +
      "When friction is lowered, repetition becomes easier, and consistency follows.",
    questions: [
      {
        id: "q1",
        prompt: "The passage primarily argues that habits fail because:",
        options: [
          { id: "a", text: "people lack discipline in the long run" },
          { id: "b", text: "motivation is always temporary" },
          { id: "c", text: "environmental friction raises the cost of action" },
          { id: "d", text: "habits should be redesigned every week" },
        ],
        correctOptionId: "c",
        explanation: "The passage emphasizes friction and environment over motivation or discipline.",
      },
      {
        id: "q2",
        prompt: "Which option best captures the role of willpower in the passage?",
        options: [
          { id: "a", text: "Willpower is the only reliable driver of habits." },
          {
            id: "b",
            text: "Willpower matters, but environment can override it.",
          },
          { id: "c", text: "Willpower is irrelevant; habits are genetic." },
          { id: "d", text: "Willpower increases when friction increases." },
        ],
        correctOptionId: "b",
        explanation: "Willpower is not denied, but the argument is: reduce friction to make habits stick.",
      },
      {
        id: "q3",
        prompt: "A practical implication consistent with the passage is to:",
        options: [
          { id: "a", text: "make tasks harder to build resilience" },
          { id: "b", text: "add steps to test commitment" },
          { id: "c", text: "remove unnecessary steps before starting" },
          { id: "d", text: "avoid routines to stay flexible" },
        ],
        correctOptionId: "c",
        explanation: "Lower friction = fewer steps between intention and action.",
      },
    ],
  },
];

const MED: RcDailyPuzzle[] = [
  {
    id: "rc-m1",
    title: "Markets and measurement",
    difficulty: 2,
    strategyNote:
      "Track scope: options that overgeneralize (always/never) are usually wrong unless the passage is absolute.",
    passage:
      "Markets are praised for allocating resources efficiently, but efficiency depends on what is measured. " +
      "When only short-term outputs are counted, decisions optimize for near-term gains even if long-term costs rise. " +
      "This is not an argument against markets; it is a warning about incentives. " +
      "Measurement systems act like a map: they guide action, but they also hide what they do not represent.",
    questions: [
      {
        id: "q1",
        prompt: "The passage suggests that market efficiency is influenced by:",
        options: [
          { id: "a", text: "the number of buyers and sellers" },
          { id: "b", text: "what outcomes are measured and rewarded" },
          { id: "c", text: "government ownership of firms" },
          { id: "d", text: "eliminating all incentives" },
        ],
        correctOptionId: "b",
        explanation: "The argument hinges on measurement/incentives shaping decisions.",
      },
      {
        id: "q2",
        prompt: "The author’s tone toward markets is best described as:",
        options: [
          { id: "a", text: "hostile; markets are inherently harmful" },
          { id: "b", text: "dismissive; markets are outdated" },
          { id: "c", text: "qualified; markets work but depend on incentives" },
          { id: "d", text: "uncertain; markets cannot be studied" },
        ],
        correctOptionId: "c",
        explanation: "The passage explicitly says it is not against markets—just warns about incentives.",
      },
      {
        id: "q3",
        prompt: "The map analogy implies that measurement systems:",
        options: [
          { id: "a", text: "represent reality completely" },
          { id: "b", text: "are useless because they hide information" },
          { id: "c", text: "guide action but omit some details" },
          { id: "d", text: "replace incentives with fairness" },
        ],
        correctOptionId: "c",
        explanation: "Maps guide but simplify; measurement similarly guides and hides what it doesn’t capture.",
      },
    ],
  },
];

const HARD: RcDailyPuzzle[] = [
  {
    id: "rc-h1",
    title: "Explanation versus prediction",
    difficulty: 3,
    strategyNote: "Separate 'what is said' from 'what is implied'. Inference questions punish overreach.",
    passage:
      "A theory can explain why an event happened without helping us predict future events. " +
      "Explanation can be retrospective: it fits a story to known outcomes. Prediction is prospective: it must survive unknowns. " +
      "The temptation is to treat a good explanation as a reliable predictor, but the two can diverge. " +
      "A model that predicts well may even be hard to interpret, while a model that reads like common sense may fail on new data.",
    questions: [
      {
        id: "q1",
        prompt: "The passage distinguishes explanation from prediction mainly by:",
        options: [
          { id: "a", text: "declaring prediction impossible" },
          {
            id: "b",
            text: "stating explanation requires math and prediction does not",
          },
          {
            id: "c",
            text: "highlighting retrospective fit vs prospective robustness",
          },
          {
            id: "d",
            text: "arguing that interpretation is always better than accuracy",
          },
        ],
        correctOptionId: "c",
        explanation: "Explanation fits known outcomes; prediction must handle unknown future conditions.",
      },
      {
        id: "q2",
        prompt: "Which statement is most consistent with the passage?",
        options: [
          {
            id: "a",
            text: "A model that sounds intuitive is likely to generalize.",
          },
          { id: "b", text: "Some predictive models may be hard to interpret." },
          { id: "c", text: "All models that explain well also predict well." },
          { id: "d", text: "Prediction should be replaced by explanation." },
        ],
        correctOptionId: "b",
        explanation: "The passage explicitly says predictive models may be hard to interpret.",
      },
      {
        id: "q3",
        prompt: "The passage would most likely criticize which approach?",
        options: [
          { id: "a", text: "Testing a model on unseen data" },
          {
            id: "b",
            text: "Assuming a plausible story guarantees future accuracy",
          },
          {
            id: "c",
            text: "Separating interpretability from predictive success",
          },
          { id: "d", text: "Recognizing limits of retrospective explanations" },
        ],
        correctOptionId: "b",
        explanation: "It warns against treating good explanations as reliable predictors.",
      },
    ],
  },
];

export function createPuzzle(opts: { seed: number; difficulty: number }): RcDailyPuzzle {
  const { seed, difficulty } = opts;
  const pool = difficulty <= 1 ? EASY : difficulty === 2 ? MED : HARD;
  return pool[Math.abs(seed) % pool.length];
}
