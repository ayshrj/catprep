export type CatCoachIntent =
  | "greeting"
  | "plan_request"
  | "mock_review"
  | "formula_request"
  | "topic_question"
  | "gdpi_request"
  | "other";

export type CatCoachResponseMode = "onboarding_questions" | "normal_coaching";

export type CatScenarioCode =
  | "S1"
  | "S2"
  | "S3"
  | "S4"
  | "S5"
  | "S6"
  | "S7"
  | "S8"
  | "S9"
  | "S10"
  | "S11"
  | "S12"
  | "S13"
  | "S14"
  | "S15"
  | "S16"
  | "S17"
  | "S18"
  | "unknown";

export const CatCoachIntentLabels: Record<CatCoachIntent, string> = {
  greeting: "Greeting",
  plan_request: "Plan Request",
  mock_review: "Mock Review",
  formula_request: "Formula Request",
  topic_question: "Topic Question",
  gdpi_request: "GDPI Request",
  other: "Other",
};

export const CatCoachResponseModeLabels: Record<CatCoachResponseMode, string> = {
  onboarding_questions: "Onboarding Questions",
  normal_coaching: "Normal Coaching",
};

export type CatIntakeResult = {
  intent: CatCoachIntent;
  responseMode: CatCoachResponseMode;
  shouldAskQuickQuestions: boolean;
  quickQuestions: string[];
  detectedSection: "QA" | "VARC" | "DILR" | null;
  detectedTopicTag: string | null;
  detectedScenario: {
    code: CatScenarioCode;
    confidence: "low" | "med" | "high";
    reason: string;
  };
  extractedMockScores: {
    overall: number | null;
    VARC: number | null;
    DILR: number | null;
    QA: number | null;
    attempts: number | null;
    accuracyPercent: number | null;
  } | null;
  notes: string[];
};

export type OpenAiToolDefinition = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

/** Keep onboarding compact (don’t ask 10 things). */
const QUICK_QUESTIONS = [
  "CAT attempt month/year? (Assuming CAT 2026 unless you say otherwise.)",
  "Weekly study hours available? (weekday + weekend split)",
  "Current level by section? (QA/VARC/DILR: weak/avg/strong or 'unknown')",
  "Which mock series/resources are you using (if any)?",
];

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function isShortAckOrGreeting(message: string) {
  const text = normalizeText(message).toLowerCase();
  if (!text) return false;
  if (text.length > 28) return false;
  if (/[0-9]/.test(text)) return false;
  return /^(hi|hii+|hello|hey|yo|sup|namaste|hola|thanks|thank you|thx|ok|okay|cool|nice|great|got it|sure)[!. ]*$/.test(
    text
  );
}

function detectSection(text: string): CatIntakeResult["detectedSection"] {
  const lower = text.toLowerCase();
  if (/(varc|rc|reading comprehension|para-?jumbles?|para-?summary|odd sentence|summary question)/.test(lower))
    return "VARC";
  if (/(dilr|lrdi|logical reasoning|data interpretation|set selection|puzzle|arrangement|caselet)/.test(lower))
    return "DILR";
  if (/(qa|quant|quants|arithmetic|algebra|geometry|mensuration|number system|pnc|probability)/.test(lower))
    return "QA";
  return null;
}

/** More granular tagging (so you can categorize mock questions better). */
function detectTopicTag(text: string): string | null {
  const lower = text.toLowerCase();

  const rules: Array<[RegExp, string]> = [
    // QA Arithmetic
    [/\bpercent(age|ages)?\b|percentage change|successive discount/i, "QA → Arithmetic → Percentages"],
    [/profit|loss|discount|marked price|mp\b|sp\b|cp\b/i, "QA → Arithmetic → Profit–Loss–Discount"],
    [/\bsi\b|simple interest|\bci\b|compound interest|effective rate/i, "QA → Arithmetic → SI/CI"],
    [/ratio|proportion|variation|directly proportional|inversely/i, "QA → Arithmetic → Ratio–Proportion"],
    [/\baverage\b|weighted average|mean\b|alligation average/i, "QA → Arithmetic → Averages"],
    [/mixture|alligation|dilution|concentration|ppm/i, "QA → Arithmetic → Mixtures–Alligation"],
    [/time\s*&?\s*work|work rate|efficiency|men-days|work done/i, "QA → Arithmetic → Time & Work"],
    [/pipes?|cistern|inlet|outlet|tank/i, "QA → Arithmetic → Pipes–Cisterns"],
    [
      /time\s*speed\s*distance|relative speed|train|boat|stream|current|race track/i,
      "QA → Arithmetic → Time–Speed–Distance",
    ],

    // QA Algebra
    [/linear equation|simultaneous|system of equations/i, "QA → Algebra → Linear / Simultaneous"],
    [/inequalit|minimum|maxim(um|ize)|optimi(s|z)e|am-gm|cauchy/i, "QA → Algebra → Inequalities / Optimization"],
    [/quadratic|discriminant|roots|vieta/i, "QA → Algebra → Quadratic"],
    [/polynomial|factor(ization)?|identity|algebraic identity/i, "QA → Algebra → Polynomials / Identities"],
    [/logarithm|log rules|indices|exponents|surds|roots/i, "QA → Algebra → Logs / Indices / Surds"],
    [/modulus|\|x\||absolute value/i, "QA → Algebra → Modulus"],
    [/sequence|series|ap\b|gp\b|hp\b|sum of n terms/i, "QA → Algebra → Sequences & Series"],
    [/function|graph|domain|range/i, "QA → Algebra → Functions / Graphs"],

    // QA Geometry / Mensuration
    [/lines?\s*&?\s*angles?|parallel|transversal/i, "QA → Geometry → Lines & Angles"],
    [/triangle|pythagoras|similarity|congruence|sine|cosine|tan/i, "QA → Geometry → Triangles"],
    [/circle|tangent|chord|arc|sector|cyclic/i, "QA → Geometry → Circles"],
    [/quadrilateral|polygon|parallelogram|trapez|rhombus/i, "QA → Geometry → Quadrilaterals / Polygons"],
    [
      /coordinate geometry|distance formula|section formula|slope|equation of line/i,
      "QA → Geometry → Coordinate Geometry",
    ],
    [/mensuration|surface area|volume|tsa|csa|sphere|cone|cylinder|frustum/i, "QA → Mensuration"],

    // QA Number system / Modern math
    [/divisibility|prime|hcf|lcm|gcd|coprime/i, "QA → Number System → Divisibility / Primes / HCF-LCM"],
    [/remainder|mod\b|modulo|cyclicity|last digit|unit digit/i, "QA → Number System → Remainders / Cyclicity"],
    [/factorial|trailing zeros|highest power|exponent of prime/i, "QA → Number System → Factorials / Trailing Zeros"],
    [/permutation|combination|arrangements|selections|\bpnc\b/i, "QA → Modern Math → P&C"],
    [/probability|expected value|bayes/i, "QA → Modern Math → Probability"],
    [/set(s)?\b|venn|union|intersection/i, "QA → Modern Math → Sets / Venn"],
    [/mean|median|mode|standard deviation|variance/i, "QA → Modern Math → Statistics"],

    // VARC
    [/reading comprehension|\brc\b|inference|tone|main idea|author/i, "VARC → RC"],
    [/para-?jumble|jumbled|sequence of sentences/i, "VARC → VA → Para-jumbles"],
    [/para-?summary|summary question/i, "VARC → VA → Summary"],
    [/odd sentence|odd one out/i, "VARC → VA → Odd sentence out"],

    // DILR
    [/table|bar graph|line graph|pie chart|caselet|data set/i, "DILR → DI"],
    [/arrangement|seating|circular|linear|grid/i, "DILR → LR → Arrangements"],
    [/tournament|matches|points table|ranking/i, "DILR → LR → Games/Tournaments"],
    [/grouping|selection|distribution|assignment/i, "DILR → LR → Grouping/Distribution"],
    [/venn|sets|overlap/i, "DILR → LR → Venn/Set logic"],
    [/route|network|paths|map/i, "DILR → LR → Routes/Networks"],
    [/set selection|which set|scan sets|time sink/i, "DILR → Strategy → Set selection"],
  ];

  for (const [re, tag] of rules) {
    if (re.test(lower)) return tag;
  }
  return null;
}

export function extractMockScores(text: string): CatIntakeResult["extractedMockScores"] {
  const lower = text.toLowerCase();
  if (!/(varc|dilr|lrdi|qa|quant|overall|mock|score|attempts|accuracy)/.test(lower)) {
    return null;
  }

  const readNum = (re: RegExp, groupIndex = 1) => {
    const match = re.exec(text);
    if (!match) return null;
    const raw = match[groupIndex];
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  };

  // Handle many styles: "VARC 24", "VARC:24", "VARC-24", "VARC=24"
  const overall = readNum(/overall\s*[:=\-]?\s*(\d{1,3})/i) ?? readNum(/total\s*[:=\-]?\s*(\d{1,3})/i);

  const VARC = readNum(/varc\s*[:=\-]?\s*(\d{1,3})/i) ?? readNum(/verbal\s*[:=\-]?\s*(\d{1,3})/i);

  const DILR =
    readNum(/dilr\s*[:=\-]?\s*(\d{1,3})/i) ??
    readNum(/lrdi\s*[:=\-]?\s*(\d{1,3})/i) ??
    readNum(/logical\s*reasoning\s*[:=\-]?\s*(\d{1,3})/i);

  const QA = readNum(/\bqa\b\s*[:=\-]?\s*(\d{1,3})/i) ?? readNum(/quant(s)?\s*[:=\-]?\s*(\d{1,3})/i, 2);

  const attempts = readNum(/attempts?\s*[:=\-]?\s*(\d{1,3})/i) ?? readNum(/attempt(ed)?\s*[:=\-]?\s*(\d{1,3})/i, 2);

  const accuracyPercent = readNum(/accuracy\s*[:=\-]?\s*(\d{1,3})\s*%/i) ?? readNum(/acc\s*[:=\-]?\s*(\d{1,3})\s*%/i);

  const hasAny =
    overall !== null || VARC !== null || DILR !== null || QA !== null || attempts !== null || accuracyPercent !== null;

  if (!hasAny) return null;

  return { overall, VARC, DILR, QA, attempts, accuracyPercent };
}

/** Scenario detection (light heuristics but very useful). */
function detectScenario(
  text: string,
  scores: CatIntakeResult["extractedMockScores"]
): CatIntakeResult["detectedScenario"] {
  const lower = text.toLowerCase();

  const hit = (re: RegExp) => re.test(lower);

  type ScenarioCandidate = {
    code: CatScenarioCode;
    confidence: "low" | "med" | "high";
    reason: string;
    score: number;
  };

  const candidates: ScenarioCandidate[] = [];

  const addCandidate = (
    code: CatScenarioCode,
    confidence: ScenarioCandidate["confidence"],
    reason: string,
    score: number
  ) => {
    candidates.push({ code, confidence, reason, score });
  };

  const findTimeLeft = () => {
    const patterns = [
      /(?:only|just|about|around|approx|approximately|nearly)?\s*(\d{1,2})\s*(weeks?|months?)\s*(?:left|remaining)\b/g,
      /(?:cat|exam)\s*(?:in|after)\s*(\d{1,2})\s*(weeks?|months?)\b/g,
      /last\s*(\d{1,2})\s*(weeks?|months?)\b/g,
    ];

    const matches: Array<{
      value: number;
      unit: "weeks" | "months";
      raw: string;
    }> = [];

    for (const pattern of patterns) {
      for (const match of lower.matchAll(pattern)) {
        const value = Number(match[1]);
        const unit = match[2].startsWith("week") ? "weeks" : "months";
        if (!Number.isFinite(value) || value <= 0) continue;
        matches.push({ value, unit, raw: match[0] });
      }
    }

    if (matches.length === 0) return null;

    const toWeeks = (m: { value: number; unit: "weeks" | "months" }) => (m.unit === "weeks" ? m.value : m.value * 4);

    matches.sort((a, b) => toWeeks(a) - toWeeks(b));
    return matches[0];
  };

  const timeLeft = findTimeLeft();
  if (timeLeft) {
    const { value, unit } = timeLeft;
    const weeks = unit === "weeks" ? value : value * 4;
    if (weeks <= 8) {
      addCandidate("S18", "high", `User indicates last ~8 weeks window (${value} ${unit} left).`, 95);
    } else if (weeks <= 16) {
      addCandidate("S2", "med", `User indicates low time remaining (${value} ${unit} left).`, 85);
    }
  }

  if (
    hit(
      /from scratch|beginner|no experience|how do i start|how should i start|start prep|starting from zero|starting from basics|first time/i
    )
  ) {
    addCandidate("S1", "high", "User indicates beginner/from-scratch.", 90);
  }

  if (
    hit(
      /busy|workload|overtime|no time|can'?t study weekdays|only weekends|long hours|shift work|working professional/i
    )
  ) {
    addCandidate("S3", "high", "User indicates heavy work / low weekday time.", 80);
  }

  if (
    hit(
      /improving slowly|slow improvement|progress slow|marks improving slowly|getting better but slow|improving but slow/i
    )
  ) {
    addCandidate("S4", "med", "User indicates improvement but slow progress.", 50);
  }

  const studyingALot = hit(
    /studying (a lot|lot|hard|too much)|studying for hours|hours daily|daily for \d+ hours|grinding|putting in a lot/i
  );
  const notSeeingResults = hit(
    /no score|score not improving|marks not improving|no results|not getting results|no improvement|score stuck/i
  );

  if (studyingALot && notSeeingResults) {
    addCandidate("S15", "high", "User studies a lot but scores are not improving.", 78);
  }

  if (hit(/plateau|stuck|same score|no improvement|not improving/i)) {
    addCandidate("S5", "high", "User explicitly mentions plateau/stuck scores.", 72);
  }

  if (hit(/panic|anxiety in mocks|chaos|random strategy|messy mock|mock panic/i)) {
    addCandidate("S14", "high", "User mentions panic/chaos in mocks.", 70);
  }

  if (
    hit(
      /forget(ting)?\s*(topics|stuff|formulas?|concepts?|things|chapters?)|weak revision|revision weak|revision poor|can'?t retain|not retaining|low retention|forget after|no revision/i
    )
  ) {
    addCandidate("S16", "high", "User indicates weak revision/forgetting topics.", 68);
  }

  // Section-specific weakness scenarios
  if (hit(/cutoff|sectional cutoff|not clearing cutoff|cutoff risk/i)) {
    addCandidate("S6", "high", "User mentions cutoff risk.", 76);
  }
  if (hit(/qa weak|quant weak|quants weak|quantitative weak|qa basics weak|qa fundamentals weak|cannot solve quant/i)) {
    addCandidate("S7", "med", "User indicates QA weakness.", 58);
  }
  if (hit(/negative marks|too many wrong|accuracy low in qa|guessing|negative marking|accuracy low/i)) {
    addCandidate("S8", "med", "User indicates negative marks / guessing / low accuracy.", 57);
  }
  if (hit(/slow in qa|time runs out in qa|takes too long|qa speed|qa time management/i)) {
    addCandidate("S9", "med", "User indicates QA speed issue.", 56);
  }
  if (hit(/rc accuracy low|cannot understand rc|rc comprehension|inference wrong|rc score low|rc accuracy/i)) {
    addCandidate("S10", "med", "User indicates RC accuracy issue.", 55);
  }
  if (hit(/para jumble|va weak|odd sentence|summary weak|para summary|sentence insertion|verbal ability weak/i)) {
    addCandidate("S11", "med", "User indicates VA weakness.", 54);
  }
  if (hit(/cannot start dilr|lrdi scary|blank in dilr|dilr basics weak|dilr start/i)) {
    addCandidate("S12", "med", "User indicates DILR start problem.", 53);
  }
  if (hit(/stuck in a set|wasting time in dilr|time sink set|dilr time sink|dilr stuck/i)) {
    addCandidate("S13", "med", "User indicates DILR time sink.", 52);
  }

  if (hit(/uneven strengths|imbalanced|one section weak|one section strong|section imbalance/i)) {
    addCandidate("S17", "low", "User indicates uneven section strengths.", 45);
  }

  // If mock scores present + one section is very low, gently flag uneven strengths
  if (scores && (scores.VARC !== null || scores.DILR !== null || scores.QA !== null)) {
    const vals = [scores.VARC, scores.DILR, scores.QA].filter((v): v is number => typeof v === "number");
    if (vals.length >= 2) {
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      if (max - min >= 15) {
        addCandidate("S17", "low", "Uneven sectional scores detected (big gap).", 44);
      }
    }
  }

  if (candidates.length > 0) {
    const ranked = candidates
      .map((candidate, index) => ({ ...candidate, index }))
      .sort((a, b) => b.score - a.score || a.index - b.index || a.code.localeCompare(b.code));
    const winner = ranked[0];
    return {
      code: winner.code,
      confidence: winner.confidence,
      reason: winner.reason,
    };
  }

  return {
    code: "unknown",
    confidence: "low",
    reason: "No strong scenario trigger found.",
  };
}

/** Minimal but useful formula + shortcut DB. Expand anytime. */
type FormulaEntry = {
  tag: string;
  mustKnow: string[];
  shortcuts: string[];
  traps: string[];
  practiceTypes: string[];
};

const FORMULA_DB: FormulaEntry[] = [
  // QA Arithmetic
  {
    tag: "QA → Arithmetic → Percentages",
    mustKnow: [
      "$$\\text{New}=\\text{Old}\\left(1\\pm\\frac{p}{100}\\right)$$",
      "$$\\text{Net\\%}=a+b+\\frac{ab}{100}\\ \\ (\\text{use signs})$$",
      "$$A=B\\left(1+\\frac{x}{100}\\right),\\quad B=\\frac{A}{1+\\frac{x}{100}}$$",
    ],
    shortcuts: [
      "$$\\frac{1}{8}=12.5\\%,\\ \\frac{1}{6}\\approx16.67\\%,\\ \\frac{1}{11}\\approx9.09\\%$$",
      "Mental: 19% = 20% - 1% (fast)",
    ],
    traps: [
      "Base confusion (Old vs New). Decide base before calculating.",
      "Two discounts are not additive (use successive change).",
    ],
    practiceTypes: ["Reverse percentage", "Successive changes", "Discount + profit chains"],
  },
  {
    tag: "QA → Arithmetic → Time & Work",
    mustKnow: [
      "$$\\text{Rate}=\\frac{1}{\\text{Time}},\\quad \\text{Combined rate}=\\sum \\text{rates}$$",
      "$$T_{\\text{together}}=\\frac{ab}{a+b}$$",
      "$$\\text{Work}\\propto (\\text{men})\\cdot(\\text{days})\\cdot(\\text{hours})\\cdot(\\text{efficiency})$$",
    ],
    shortcuts: [
      "Use LCM as total work for multi-worker problems.",
      "If A is k times efficient, time ratio is inverse (A:B = 1:k).",
    ],
    traps: ["Mixing work done vs remaining work.", "Not treating leak/outlet as negative rate."],
    practiceTypes: ["Combined work", "Efficiency ratios", "Alternate day work"],
  },
  {
    tag: "QA → Arithmetic → Time–Speed–Distance",
    mustKnow: [
      "$$D=S\\cdot T$$",
      "$$v_{\\text{rel}}=\\begin{cases}v_1+v_2 & \\text{opposite}\\\\|v_1-v_2| & \\text{same direction}\\end{cases}$$",
      "$$v_{\\text{avg}}=\\frac{2v_1v_2}{v_1+v_2}\\ \\ (\\text{equal distance})$$",
      "$$1\\ \\text{m/s}=3.6\\ \\text{km/h}$$",
    ],
    shortcuts: [
      "Trains: pole time = length/speed; platform time = (train+platform)/speed.",
      "Boats: downstream = u+v, upstream = u-v.",
    ],
    traps: ["Unit mismatch", "Wrong relative speed sign"],
    practiceTypes: ["Trains", "Boats & streams", "Circular track meet/catch"],
  },

  // QA Algebra
  {
    tag: "QA → Algebra → Quadratic",
    mustKnow: ["$$D=b^2-4ac$$", "$$\\alpha+\\beta=-\\frac{b}{a},\\quad \\alpha\\beta=\\frac{c}{a}$$"],
    shortcuts: [
      "If options exist, plug-in options quickly.",
      "Use Vieta to simplify expressions in roots without solving.",
    ],
    traps: ["Forgetting scaling when a \\neq 1."],
    practiceTypes: ["Roots expression", "Parameter quadratic", "D-based inequality"],
  },
  {
    tag: "QA → Algebra → Sequences & Series",
    mustKnow: [
      "$$\\text{AP: } T_n=a+(n-1)d,\\quad S_n=\\frac{n}{2}\\left(2a+(n-1)d\\right)$$",
      "$$\\text{GP: } T_n=ar^{n-1},\\quad S_n=a\\frac{r^n-1}{r-1}\\ (r\\ne 1)$$",
    ],
    shortcuts: ["Use difference tables for patterns.", "Check telescoping when possible."],
    traps: ["Mixing T_n and S_n", "Sign errors when r<0"],
    practiceTypes: ["AP/GP word problems", "Sum constraints", "Nth term puzzles"],
  },

  // Geometry
  {
    tag: "QA → Geometry → Triangles",
    mustKnow: [
      "$$a^2+b^2=c^2$$",
      "$$\\text{Area}=\\frac{1}{2}bh$$",
      "Special triangles: $45-45-90\\ (1:1:\\sqrt{2}),\\ 30-60-90\\ (1:\\sqrt{3}:2)$",
    ],
    shortcuts: [
      "Use triples: 3-4-5, 5-12-13, 8-15-17.",
      "Similarity: side ratios map to heights/medians in similar triangles.",
    ],
    traps: ["Confusing angle bisector rule vs median."],
    practiceTypes: ["Similarity", "Right triangles", "Max/min geometry"],
  },
  {
    tag: "QA → Geometry → Circles",
    mustKnow: [
      "Angle in semicircle = $90^{\\circ}$",
      "Tangent is perpendicular to radius at contact point",
      "Cyclic quadrilateral: opposite angles sum to $180^{\\circ}$",
    ],
    shortcuts: [
      "Tangents from external point have equal lengths.",
      "Use equal chords \\(\\Rightarrow\\) equal angles (and vice versa).",
    ],
    traps: ["Mixing central angle vs inscribed angle logic."],
    practiceTypes: ["Tangents", "Cyclic quads", "Chord-angle"],
  },

  // Number system
  {
    tag: "QA → Number System → Remainders / Cyclicity",
    mustKnow: [
      "Use modular rules: $(a\\pm b)\\bmod m$, $(a\\cdot b)\\bmod m$",
      "Last digit cycles: length 4 for 2,3,7,8; length 2 for 4,9; length 1 for 0,1,5,6",
    ],
    shortcuts: ["Reduce exponent modulo cycle length.", "Use mod 9 digit sum as quick sanity check (when applicable)."],
    traps: ["Wrong cycle length", "Negative remainder handling mistakes"],
    practiceTypes: ["Last digit", "Large power remainder", "Pattern remainder"],
  },
  {
    tag: "QA → Number System → Factorials / Trailing Zeros",
    mustKnow: [
      "$$Z(n!)=\\left\\lfloor\\frac{n}{5}\\right\\rfloor+\\left\\lfloor\\frac{n}{25}\\right\\rfloor+\\left\\lfloor\\frac{n}{125}\\right\\rfloor+\\cdots$$",
      "Highest power of prime p in $n!$ uses repeated division sum.",
    ],
    shortcuts: ["In products, count 2s and 5s separately."],
    traps: ["Forgetting 25, 125, ... contributions."],
    practiceTypes: ["Trailing zeros", "Highest power", "Factorial prime power"],
  },

  // Modern math
  {
    tag: "QA → Modern Math → P&C",
    mustKnow: [
      "$${}^nP_r=\\frac{n!}{(n-r)!},\\quad {}^nC_r=\\frac{n!}{r!(n-r)!}$$",
      "$$\\text{Repetition: } n^r$$",
      "$$\\text{Multiset permutations: } \\frac{n!}{a!b!c!\\cdots}$$",
    ],
    shortcuts: ["Use complement counting.", "$$\\binom{n}{r}=\\binom{n}{n-r}$$"],
    traps: ["Order vs selection confusion."],
    practiceTypes: ["Arrangements", "Committees", "Digit/letter counting"],
  },
  {
    tag: "QA → Modern Math → Probability",
    mustKnow: [
      "$$P(A\\cup B)=P(A)+P(B)-P(A\\cap B)$$",
      "$$P(\\ge 1)=1-P(0)$$",
      "$$\\text{Independence: } P(A\\cap B)=P(A)\\cdot P(B)$$",
    ],
    shortcuts: ["Use complement for 'at least one'.", "Do systematic casework when small."],
    traps: ["Assuming independence without justification.", "Double-counting overlap."],
    practiceTypes: ["At least one", "Conditional probability (basic)", "Balls/cards"],
  },

  // DILR Strategy (not formulas, but playbook)
  {
    tag: "DILR → Strategy → Set selection",
    mustKnow: [
      "Scan 2–3 mins: rank sets; attempt easiest 2 first.",
      "Drop if no progress by 8–10 mins.",
      "Target: 2 solid sets consistently, then push to 3.",
    ],
    shortcuts: [
      "Prefer sets with clean tables and fewer variables.",
      "Avoid heavy casework unless it’s your strength.",
    ],
    traps: ["Marrying a set", "Starting with the hardest set first"],
    practiceTypes: ["Timed scans", "2-set strategy drills", "Reattempt old sets"],
  },

  // VARC core heuristics
  {
    tag: "VARC → RC",
    mustKnow: [
      "Eliminate out-of-scope options.",
      "Beware extreme words (always/never) unless passage supports.",
      "Inference must be supported by passage logic (no outside knowledge).",
    ],
    shortcuts: [
      "Track structure: intro → claim → evidence → caveat → conclusion.",
      "Win by elimination, not by hunting 'perfect' phrasing.",
    ],
    traps: ["Outside knowledge", "Over-inference"],
    practiceTypes: ["2 RC/day + review", "Inference-only drills", "Main idea drills"],
  },
];

function formulaLookup(query: string): FormulaEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const scored = FORMULA_DB.map(e => {
    const key = e.tag.toLowerCase();
    let score = 0;
    if (key === q) score += 10;
    if (key.includes(q)) score += 6;
    const parts = q
      .split(/[→>|/,-]/)
      .map(x => x.trim())
      .filter(Boolean);
    for (const p of parts) {
      if (p && key.includes(p)) score += 2;
    }
    return { e, score };
  })
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(x => x.e);

  return scored;
}

export function intakeCatCoach(message: string): CatIntakeResult {
  const normalized = normalizeText(message);
  const lower = normalized.toLowerCase();

  const greeting = isShortAckOrGreeting(normalized);
  const extractedMockScores = extractMockScores(normalized);
  const detectedSection = detectSection(normalized);
  const detectedTopicTag = detectTopicTag(normalized);

  let intent: CatCoachIntent = "other";

  if (greeting) {
    intent = "greeting";
  } else if (/(gd|pi|wat|interview|personal interview)/.test(lower)) {
    intent = "gdpi_request";
  } else if (/(formula|formulas|shortcut|shortcuts|trick|cheat sheet|revision sheet)/.test(lower)) {
    intent = "formula_request";
  } else if (extractedMockScores) {
    intent = "mock_review";
  } else if (/(plan|schedule|routine|timetable|strategy|how do i start|start prep|prepare|roadmap)/.test(lower)) {
    intent = "plan_request";
  } else if (detectedSection || detectedTopicTag || /\bqa\b|\bvarc\b|\bdilr\b|\blrdi\b/i.test(lower)) {
    intent = "topic_question";
  }

  const detectedScenario = detectScenario(normalized, extractedMockScores);

  // Ask onboarding questions only if user wants a plan and gives zero usable constraints.
  const likelyMissingCriticalInfo =
    intent === "plan_request" &&
    !/(hours?|hrs?|weekday|weekend|resources?|books?|coaching|mock|score|job|working|months?|weeks?)/.test(lower);

  const shouldAskQuickQuestions = Boolean(likelyMissingCriticalInfo);
  const responseMode: CatCoachResponseMode = shouldAskQuickQuestions ? "onboarding_questions" : "normal_coaching";

  const notes: string[] = [];
  if (greeting) notes.push("Detected greeting/ack only.");
  if (shouldAskQuickQuestions) notes.push("Plan asked with missing constraints: ask quick questions.");
  if (detectedScenario.code !== "unknown") notes.push(`Scenario detected: ${detectedScenario.code}`);

  return {
    intent,
    responseMode,
    shouldAskQuickQuestions,
    quickQuestions: shouldAskQuickQuestions ? QUICK_QUESTIONS : [],
    detectedSection,
    detectedTopicTag,
    detectedScenario,
    extractedMockScores,
    notes,
  };
}

export function catFormulaLookupTool(textOrTag: string) {
  const hits = formulaLookup(textOrTag);
  return {
    query: textOrTag,
    matches: hits,
    note:
      hits.length === 0
        ? "No formula entry matched. Try passing a topic tag like 'QA → Arithmetic → Percentages'."
        : "Use mustKnow first, then shortcuts. Avoid traps.",
  };
}

/** Lightweight mock diagnosis tool: returns root causes + 14-day plan skeleton. */
export function catMockDiagnoseTool(args: {
  overall?: number | null;
  VARC?: number | null;
  DILR?: number | null;
  QA?: number | null;
  attempts?: number | null;
  accuracyPercent?: number | null;
  notesText?: string;
}) {
  const { overall, VARC, DILR, QA, attempts, accuracyPercent, notesText } = args;

  const sectionScores = [
    { k: "VARC", v: typeof VARC === "number" ? VARC : null },
    { k: "DILR", v: typeof DILR === "number" ? DILR : null },
    { k: "QA", v: typeof QA === "number" ? QA : null },
  ].filter(x => x.v !== null) as Array<{
    k: "VARC" | "DILR" | "QA";
    v: number;
  }>;

  let weakest: "VARC" | "DILR" | "QA" | null = null;
  if (sectionScores.length) {
    weakest = sectionScores.reduce((a, b) => (a.v < b.v ? a : b)).k;
  }

  const rootCauses: string[] = [];
  if (typeof accuracyPercent === "number" && accuracyPercent < 65) {
    rootCauses.push("Accuracy low → guessing / weak elimination / weak fundamentals.");
  }
  if (typeof attempts === "number" && attempts < 40) {
    rootCauses.push("Low attempts → speed + selection problem (or too cautious).");
  }
  if (weakest === "DILR") rootCauses.push("DILR weak → set selection + representation likely.");
  if (weakest === "VARC") rootCauses.push("VARC weak → RC process + elimination likely.");
  if (weakest === "QA") rootCauses.push("QA weak → fundamentals + speed/2-pass likely.");
  if (notesText && /panic|chaos|random|strategy changes/i.test(notesText)) {
    rootCauses.push("Mock instability → strategy not fixed (freeze for 5 mocks).");
  }

  const plan14: string[] = [];
  plan14.push("Do 2 full mocks/week + deep analysis (WRONG / GUESSED / TIME-SINK / SKIPPED-BUT-DOABLE).");
  plan14.push("Daily: 1 DILR set + 1 RC passage + 15 QA questions (mix easy+medium).");
  if (weakest === "DILR") plan14.push("DILR focus: scan sets 2–3 mins + pick 2 easiest; drop if stuck at 8–10 mins.");
  if (weakest === "VARC")
    plan14.push("VARC focus: 2 RC/day, track inference mistakes, extreme/out-of-scope elimination drills.");
  if (weakest === "QA") plan14.push("QA focus: 2-pass practice; accuracy-first; redo slow questions for speed.");

  return {
    snapshot: {
      overall: overall ?? null,
      VARC: VARC ?? null,
      DILR: DILR ?? null,
      QA: QA ?? null,
      attempts: attempts ?? null,
      accuracyPercent: accuracyPercent ?? null,
    },
    weakestSection: weakest,
    rootCauses: rootCauses.slice(0, 3),
    plan14Days: plan14,
  };
}

export const CAT_COACH_TOOLS: OpenAiToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "cat_intake",
      description:
        "Analyze a user message for the CAT coach: detect intent, scenario, whether to ask onboarding questions, and hints like section/topic and mock-score structure.",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          message: { type: "string", description: "The latest user message." },
        },
        required: ["message"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "cat_extract_mock_scores",
      description:
        "Extract mock score information (overall, VARC/DILR/QA, attempts, accuracy %) from free text when present.",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          text: { type: "string", description: "User message text." },
        },
        required: ["text"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "cat_detect_topic",
      description: "Heuristically detect CAT section and a likely topic tag from a user message.",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          text: { type: "string", description: "User message text." },
        },
        required: ["text"],
      },
    },
  },

  // formula lookup
  {
    type: "function",
    function: {
      name: "cat_formula_lookup",
      description:
        "Lookup must-know formulas + shortcuts + traps + practice types for a topic tag or query (e.g., 'percentages', 'QA → Arithmetic → Percentages').",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          query: { type: "string", description: "Topic tag or search query." },
        },
        required: ["query"],
      },
    },
  },

  // mock diagnosis
  {
    type: "function",
    function: {
      name: "cat_mock_diagnose",
      description: "Given mock scores and optional notes, return likely root causes + a 14-day fix plan skeleton.",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          overall: { type: ["number", "null"] },
          VARC: { type: ["number", "null"] },
          DILR: { type: ["number", "null"] },
          QA: { type: ["number", "null"] },
          attempts: { type: ["number", "null"] },
          accuracyPercent: { type: ["number", "null"] },
          notesText: { type: ["string", "null"] },
        },
        required: [],
      },
    },
  },
];

export async function executeCatTool(name: string, args: unknown) {
  if (name === "cat_intake") {
    const message = typeof (args as any)?.message === "string" ? (args as any).message : "";
    return intakeCatCoach(message);
  }

  if (name === "cat_extract_mock_scores") {
    const text = typeof (args as any)?.text === "string" ? (args as any).text : "";
    return extractMockScores(text);
  }

  if (name === "cat_detect_topic") {
    const text = typeof (args as any)?.text === "string" ? (args as any).text : "";
    return { section: detectSection(text), topicTag: detectTopicTag(text) };
  }

  if (name === "cat_formula_lookup") {
    const query = typeof (args as any)?.query === "string" ? (args as any).query : "";
    return catFormulaLookupTool(query);
  }

  if (name === "cat_mock_diagnose") {
    const a = (args ?? {}) as any;
    return catMockDiagnoseTool({
      overall: typeof a.overall === "number" ? a.overall : null,
      VARC: typeof a.VARC === "number" ? a.VARC : null,
      DILR: typeof a.DILR === "number" ? a.DILR : null,
      QA: typeof a.QA === "number" ? a.QA : null,
      attempts: typeof a.attempts === "number" ? a.attempts : null,
      accuracyPercent: typeof a.accuracyPercent === "number" ? a.accuracyPercent : null,
      notesText: typeof a.notesText === "string" ? a.notesText : null,
    });
  }

  return { error: `Unknown tool: ${name}` };
}
