import { makeId, pick, shuffle } from "../core/generator-utils";
import { makeRng } from "../core/rng";
import { OddSentenceOutPuzzle } from "./types";

type Topic = {
  subject: string;
  sentences: string[];
};

const TOPICS: Topic[] = [
  {
    subject: "sleep deprivation",
    sentences: [
      "Sleep deprivation affects attention and working memory within a single day.",
      "It weakens emotional regulation, making small setbacks feel larger than they are.",
      "Long-term sleep loss is linked to higher risk of metabolic disorders.",
      "Consistent sleep schedules improve learning consolidation over time.",
    ],
  },
  {
    subject: "urban heat islands",
    sentences: [
      "Urban heat islands form when concrete and asphalt absorb and re-radiate heat.",
      "Trees cool cities via shade and evapotranspiration.",
      "High night temperatures can increase electricity demand for cooling.",
      "Cool roofs and reflective materials reduce heat absorption.",
    ],
  },
  {
    subject: "negotiation anchoring",
    sentences: [
      "Anchoring sets a reference point that shapes later offers in negotiations.",
      "Even arbitrary numbers can influence counteroffers when benchmarks are unclear.",
      "Experienced negotiators reduce anchoring effects by preparing objective standards.",
      "Anchors are especially powerful when first offers are made confidently.",
    ],
  },
  {
    subject: "public speaking anxiety",
    sentences: [
      "Public speaking anxiety often peaks just before starting the talk.",
      "Slow breathing lowers physiological arousal by engaging parasympathetic responses.",
      "Rehearsal helps speakers allocate attention to structure rather than self-monitoring.",
      "Cognitive reappraisal reframes arousal as readiness rather than threat.",
    ],
  },
  {
    subject: "scientific models",
    sentences: [
      "A scientific model simplifies reality to make predictions testable.",
      "Useful models specify assumptions so their limits are clear.",
      "When predictions fail, models are revised or replaced to better match evidence.",
      "Model comparison favors explanations that balance fit with parsimony.",
    ],
  },
  {
    subject: "persuasive writing",
    sentences: [
      "A persuasive essay benefits from a clear thesis that previews the argument.",
      "Transitions help readers track how each paragraph advances the central claim.",
      "Evidence is stronger when it is specific, relevant, and fairly interpreted.",
      "A conclusion should synthesize rather than merely repeat earlier lines.",
    ],
  },
];

const UNRELATED_SENTENCES = [
  "Some deserts receive less than 250 mm of rainfall annually.",
  "The tallest mountain in Africa is Mount Kilimanjaro.",
  "The Earth’s core is primarily composed of iron and nickel.",
  "A standard chessboard has 64 squares arranged in an 8×8 grid.",
  "The Amazon River carries more water than any other river.",
];

function buildOddSentence(topic: Topic, difficulty: number, rng: () => number) {
  if (difficulty === 1 && rng() < 0.7) {
    return {
      sentence: pick(rng, UNRELATED_SENTENCES),
      rationale: "It introduces an unrelated topic that breaks the paragraph’s flow.",
    };
  }

  const absolute = `Studies of ${topic.subject} always show the same outcome for everyone.`;
  return {
    sentence: absolute,
    rationale: "It makes an absolute claim that breaks the nuanced discussion.",
  };
}

export function createPuzzle(opts: { seed: number; difficulty: number }): OddSentenceOutPuzzle {
  const rng = makeRng(opts.seed);
  const difficulty = Math.max(1, Math.min(3, opts.difficulty));
  const topic = pick(rng, TOPICS);

  const { sentence: oddSentence, rationale } = buildOddSentence(topic, difficulty, rng);
  const sentences = shuffle(rng, [...topic.sentences, oddSentence]);
  const oddIndex = sentences.indexOf(oddSentence);

  return {
    id: makeId(rng, "oso"),
    prompt: "Pick the sentence that does NOT logically fit the paragraph’s flow.",
    sentences,
    oddIndex,
    rationale: `Sentence ${oddIndex + 1}: ${rationale}`,
    difficulty,
  };
}
