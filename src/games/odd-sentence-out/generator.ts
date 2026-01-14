import { OddSentenceOutPuzzle } from "./types";

type BankItem = Omit<OddSentenceOutPuzzle, "difficulty"> & {
  minDifficulty: number;
};

const BANK: BankItem[] = [
  {
    id: "oso-1",
    minDifficulty: 1,
    prompt: "Pick the sentence that does NOT logically fit the paragraph’s flow.",
    sentences: [
      "Sleep deprivation affects attention and working memory within a single day.",
      "It also weakens emotional regulation, making small setbacks feel larger than they are.",
      "Long-term sleep loss is linked to higher risk of metabolic disorders.",
      "Many people report they are more creative when they sleep less.",
      "Consistent sleep schedules improve learning consolidation over time.",
    ],
    oddIndex: 3,
    rationale:
      "Sentence 4 makes a broad claim about creativity that doesn’t connect with the causal, evidence-based chain about cognitive/emotional/metabolic effects and consolidation.",
  },
  {
    id: "oso-2",
    minDifficulty: 1,
    prompt: "Pick the odd sentence out.",
    sentences: [
      "Urban heat islands form when concrete and asphalt absorb and re-radiate heat.",
      "Trees cool cities via shade and evapotranspiration.",
      "High night temperatures can increase electricity demand for cooling.",
      "Some deserts receive less than 250 mm of rainfall annually.",
      "Cool roofs and reflective materials reduce heat absorption.",
    ],
    oddIndex: 3,
    rationale: "Sentence 4 switches to desert rainfall, unrelated to the urban heat island discussion.",
  },
  {
    id: "oso-3",
    minDifficulty: 2,
    prompt: "Pick the sentence that breaks coherence.",
    sentences: [
      "In negotiations, anchoring sets a reference point that shapes later offers.",
      "Even arbitrary numbers can influence counteroffers when parties lack clear benchmarks.",
      "Experienced negotiators reduce anchoring effects by preparing objective standards.",
      "The tallest mountain in Africa is Mount Kilimanjaro.",
      "Anchors are especially powerful when first offers are made confidently.",
    ],
    oddIndex: 3,
    rationale: "Sentence 4 is a factual geography insertion unrelated to negotiation anchoring.",
  },
  {
    id: "oso-4",
    minDifficulty: 2,
    prompt: "Pick the odd sentence out.",
    sentences: [
      "Public speaking anxiety often peaks just before starting the talk.",
      "Slow breathing lowers physiological arousal by engaging parasympathetic responses.",
      "Rehearsal helps speakers allocate attention to structure rather than self-monitoring.",
      "High arousal always improves performance because it increases motivation.",
      "Cognitive reappraisal reframes arousal as readiness rather than threat.",
    ],
    oddIndex: 3,
    rationale:
      "Sentence 4 makes an absolute claim (‘always’) that contradicts well-known performance theory and breaks the nuanced argument.",
  },
  {
    id: "oso-5",
    minDifficulty: 3,
    prompt: "Pick the sentence that doesn’t belong.",
    sentences: [
      "A scientific model simplifies reality to make predictions testable.",
      "Useful models specify assumptions so their limits are clear.",
      "When predictions fail, models are revised or replaced to better match evidence.",
      "Some theories remain influential even when repeatedly contradicted by data.",
      "Model comparison favors explanations that balance fit with parsimony.",
    ],
    oddIndex: 3,
    rationale:
      "Sentence 4 undermines the scientific-method frame without support and breaks the epistemic logic of the paragraph.",
  },
  {
    id: "oso-6",
    minDifficulty: 3,
    prompt: "Pick the odd sentence out.",
    sentences: [
      "A persuasive essay benefits from a clear thesis that previews the argument.",
      "Transitions help readers track how each paragraph advances the central claim.",
      "Evidence is stronger when it is specific, relevant, and fairly interpreted.",
      "Good writing avoids all passive voice because it is always unclear.",
      "A conclusion should synthesize rather than merely repeat earlier lines.",
    ],
    oddIndex: 3,
    rationale:
      "Sentence 4 uses an absolute prescription (‘avoid all passive voice’) that’s not aligned with the balanced writing advice elsewhere.",
  },
];

export function createPuzzle(opts: { seed: number; difficulty: number }): OddSentenceOutPuzzle {
  const difficulty = Math.max(1, Math.min(3, opts.difficulty));
  const eligible = BANK.filter(b => b.minDifficulty <= difficulty);
  const picked = eligible[Math.abs(opts.seed) % eligible.length];

  return {
    id: picked.id,
    prompt: picked.prompt,
    sentences: picked.sentences.slice(),
    oddIndex: picked.oddIndex,
    rationale: picked.rationale,
    difficulty,
  };
}
