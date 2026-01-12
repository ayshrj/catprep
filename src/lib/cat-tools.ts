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
  if (
    /(varc|rc|reading comprehension|para-?jumbles?|para-?summary|odd sentence|summary question)/.test(
      lower
    )
  )
    return "VARC";
  if (
    /(dilr|lrdi|logical reasoning|data interpretation|set selection|puzzle|arrangement|caselet)/.test(
      lower
    )
  )
    return "DILR";
  if (
    /(qa|quant|quants|arithmetic|algebra|geometry|mensuration|number system|pnc|probability)/.test(
      lower
    )
  )
    return "QA";
  return null;
}

/** More granular tagging (so you can categorize mock questions better). */
function detectTopicTag(text: string): string | null {
  const lower = text.toLowerCase();

  const rules: Array<[RegExp, string]> = [
    // QA Arithmetic
    [
      /\bpercent(age|ages)?\b|percentage change|successive discount/i,
      "QA → Arithmetic → Percentages",
    ],
    [
      /profit|loss|discount|marked price|mp\b|sp\b|cp\b/i,
      "QA → Arithmetic → Profit–Loss–Discount",
    ],
    [
      /\bsi\b|simple interest|\bci\b|compound interest|effective rate/i,
      "QA → Arithmetic → SI/CI",
    ],
    [
      /ratio|proportion|variation|directly proportional|inversely/i,
      "QA → Arithmetic → Ratio–Proportion",
    ],
    [
      /\baverage\b|weighted average|mean\b|alligation average/i,
      "QA → Arithmetic → Averages",
    ],
    [
      /mixture|alligation|dilution|concentration|ppm/i,
      "QA → Arithmetic → Mixtures–Alligation",
    ],
    [
      /time\s*&?\s*work|work rate|efficiency|men-days|work done/i,
      "QA → Arithmetic → Time & Work",
    ],
    [/pipes?|cistern|inlet|outlet|tank/i, "QA → Arithmetic → Pipes–Cisterns"],
    [
      /time\s*speed\s*distance|relative speed|train|boat|stream|current|race track/i,
      "QA → Arithmetic → Time–Speed–Distance",
    ],

    // QA Algebra
    [
      /linear equation|simultaneous|system of equations/i,
      "QA → Algebra → Linear / Simultaneous",
    ],
    [
      /inequalit|minimum|maxim(um|ize)|optimi(s|z)e|am-gm|cauchy/i,
      "QA → Algebra → Inequalities / Optimization",
    ],
    [/quadratic|discriminant|roots|vieta/i, "QA → Algebra → Quadratic"],
    [
      /polynomial|factor(ization)?|identity|algebraic identity/i,
      "QA → Algebra → Polynomials / Identities",
    ],
    [
      /logarithm|log rules|indices|exponents|surds|roots/i,
      "QA → Algebra → Logs / Indices / Surds",
    ],
    [/modulus|\|x\||absolute value/i, "QA → Algebra → Modulus"],
    [
      /sequence|series|ap\b|gp\b|hp\b|sum of n terms/i,
      "QA → Algebra → Sequences & Series",
    ],
    [/function|graph|domain|range/i, "QA → Algebra → Functions / Graphs"],

    // QA Geometry / Mensuration
    [
      /lines?\s*&?\s*angles?|parallel|transversal/i,
      "QA → Geometry → Lines & Angles",
    ],
    [
      /triangle|pythagoras|similarity|congruence|sine|cosine|tan/i,
      "QA → Geometry → Triangles",
    ],
    [/circle|tangent|chord|arc|sector|cyclic/i, "QA → Geometry → Circles"],
    [
      /quadrilateral|polygon|parallelogram|trapez|rhombus/i,
      "QA → Geometry → Quadrilaterals / Polygons",
    ],
    [
      /coordinate geometry|distance formula|section formula|slope|equation of line/i,
      "QA → Geometry → Coordinate Geometry",
    ],
    [
      /mensuration|surface area|volume|tsa|csa|sphere|cone|cylinder|frustum/i,
      "QA → Mensuration",
    ],

    // QA Number system / Modern math
    [
      /divisibility|prime|hcf|lcm|gcd|coprime/i,
      "QA → Number System → Divisibility / Primes / HCF-LCM",
    ],
    [
      /remainder|mod\b|modulo|cyclicity|last digit|unit digit/i,
      "QA → Number System → Remainders / Cyclicity",
    ],
    [
      /factorial|trailing zeros|highest power|exponent of prime/i,
      "QA → Number System → Factorials / Trailing Zeros",
    ],
    [
      /permutation|combination|arrangements|selections|\bpnc\b/i,
      "QA → Modern Math → P&C",
    ],
    [/probability|expected value|bayes/i, "QA → Modern Math → Probability"],
    [/set(s)?\b|venn|union|intersection/i, "QA → Modern Math → Sets / Venn"],
    [
      /mean|median|mode|standard deviation|variance/i,
      "QA → Modern Math → Statistics",
    ],

    // VARC
    [
      /reading comprehension|\brc\b|inference|tone|main idea|author/i,
      "VARC → RC",
    ],
    [/para-?jumble|jumbled|sequence of sentences/i, "VARC → VA → Para-jumbles"],
    [/para-?summary|summary question/i, "VARC → VA → Summary"],
    [/odd sentence|odd one out/i, "VARC → VA → Odd sentence out"],

    // DILR
    [/table|bar graph|line graph|pie chart|caselet|data set/i, "DILR → DI"],
    [/arrangement|seating|circular|linear|grid/i, "DILR → LR → Arrangements"],
    [
      /tournament|matches|points table|ranking/i,
      "DILR → LR → Games/Tournaments",
    ],
    [
      /grouping|selection|distribution|assignment/i,
      "DILR → LR → Grouping/Distribution",
    ],
    [/venn|sets|overlap/i, "DILR → LR → Venn/Set logic"],
    [/route|network|paths|map/i, "DILR → LR → Routes/Networks"],
    [
      /set selection|which set|scan sets|time sink/i,
      "DILR → Strategy → Set selection",
    ],
  ];

  for (const [re, tag] of rules) {
    if (re.test(lower)) return tag;
  }
  return null;
}

export function extractMockScores(
  text: string
): CatIntakeResult["extractedMockScores"] {
  const lower = text.toLowerCase();
  if (
    !/(varc|dilr|lrdi|qa|quant|overall|mock|score|attempts|accuracy)/.test(
      lower
    )
  ) {
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
  const overall =
    readNum(/overall\s*[:=\-]?\s*(\d{1,3})/i) ??
    readNum(/total\s*[:=\-]?\s*(\d{1,3})/i);

  const VARC =
    readNum(/varc\s*[:=\-]?\s*(\d{1,3})/i) ??
    readNum(/verbal\s*[:=\-]?\s*(\d{1,3})/i);

  const DILR =
    readNum(/dilr\s*[:=\-]?\s*(\d{1,3})/i) ??
    readNum(/lrdi\s*[:=\-]?\s*(\d{1,3})/i) ??
    readNum(/logical\s*reasoning\s*[:=\-]?\s*(\d{1,3})/i);

  const QA =
    readNum(/\bqa\b\s*[:=\-]?\s*(\d{1,3})/i) ??
    readNum(/quant(s)?\s*[:=\-]?\s*(\d{1,3})/i, 2);

  const attempts =
    readNum(/attempts?\s*[:=\-]?\s*(\d{1,3})/i) ??
    readNum(/attempt(ed)?\s*[:=\-]?\s*(\d{1,3})/i, 2);

  const accuracyPercent =
    readNum(/accuracy\s*[:=\-]?\s*(\d{1,3})\s*%/i) ??
    readNum(/acc\s*[:=\-]?\s*(\d{1,3})\s*%/i);

  const hasAny =
    overall !== null ||
    VARC !== null ||
    DILR !== null ||
    QA !== null ||
    attempts !== null ||
    accuracyPercent !== null;

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

  // Strong explicit triggers first
  if (hit(/from scratch|beginner|no experience|how do i start|start prep/)) {
    return {
      code: "S1",
      confidence: "high",
      reason: "User indicates beginner/from-scratch.",
    };
  }
  if (
    hit(
      /only\s*(\d+)\s*(months?|weeks?)\s*left|cat in \d+\s*(months?|weeks?)|last\s*\d+\s*(months?|weeks?)/
    )
  ) {
    // map to time-low or last-8-weeks
    if (hit(/last\s*(8|7|6)\s*weeks?|last\s*2\s*months?/)) {
      return {
        code: "S18",
        confidence: "med",
        reason: "User indicates last ~8 weeks window.",
      };
    }
    return {
      code: "S2",
      confidence: "med",
      reason: "User indicates low time remaining.",
    };
  }
  if (
    hit(/busy|workload|overtime|no time|can'?t study weekdays|only weekends/)
  ) {
    return {
      code: "S3",
      confidence: "high",
      reason: "User indicates heavy work / low weekday time.",
    };
  }
  if (hit(/plateau|stuck|not improving|same score|no improvement/)) {
    return {
      code: "S5",
      confidence: "high",
      reason: "User explicitly mentions plateau/stuck.",
    };
  }
  if (hit(/panic|anxiety in mocks|chaos|random strategy|messy mock/)) {
    return {
      code: "S14",
      confidence: "high",
      reason: "User mentions panic/chaos in mocks.",
    };
  }

  // Section-specific weakness scenarios
  if (hit(/cutoff|sectional cutoff|not clearing/)) {
    return {
      code: "S6",
      confidence: "high",
      reason: "User mentions cutoff risk.",
    };
  }
  if (hit(/qa weak|quant weak|cannot solve quant|quants weak/)) {
    return {
      code: "S7",
      confidence: "med",
      reason: "User indicates QA weakness.",
    };
  }
  if (hit(/negative marks|too many wrong|accuracy low in qa|guessing/)) {
    return {
      code: "S8",
      confidence: "med",
      reason: "User indicates negative marks / guessing.",
    };
  }
  if (hit(/slow in qa|time runs out in qa|takes too long/)) {
    return {
      code: "S9",
      confidence: "med",
      reason: "User indicates QA speed issue.",
    };
  }
  if (hit(/rc accuracy low|cannot understand rc|inference wrong/)) {
    return {
      code: "S10",
      confidence: "med",
      reason: "User indicates RC accuracy issue.",
    };
  }
  if (hit(/para jumble|va weak|odd sentence|summary weak/)) {
    return {
      code: "S11",
      confidence: "med",
      reason: "User indicates VA weakness.",
    };
  }
  if (hit(/cannot start dilr|lrdi scary|blank in dilr/)) {
    return {
      code: "S12",
      confidence: "med",
      reason: "User indicates DILR start problem.",
    };
  }
  if (hit(/stuck in a set|wasting time in dilr|time sink set/)) {
    return {
      code: "S13",
      confidence: "med",
      reason: "User indicates DILR time sink.",
    };
  }

  // If mock scores present + one section is very low, gently flag cutoff-ish
  if (
    scores &&
    (scores.VARC !== null || scores.DILR !== null || scores.QA !== null)
  ) {
    const vals = [scores.VARC, scores.DILR, scores.QA].filter(
      (v): v is number => typeof v === "number"
    );
    if (vals.length >= 2) {
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      if (max - min >= 15) {
        return {
          code: "S17",
          confidence: "low",
          reason: "Uneven sectional scores detected (big gap).",
        };
      }
    }
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
      "New = Old × (1 ± p/100)",
      "Successive change: net% = a + b + (ab/100) (use signs)",
      "If A is x% more than B ⇒ A = B(1+x/100); B = A/(1+x/100)",
    ],
    shortcuts: [
      "Use fraction anchors: 1/3=33.33%, 1/6=16.67%, 1/8=12.5%, 1/11≈9.09%",
      "Approx: 19% = 20% − 1% (fast mental)",
    ],
    traps: [
      "Percent change base confusion (always decide base: Old or New)",
      "Two discounts are not additive (use successive formula)",
    ],
    practiceTypes: [
      "Successive % change (salary, price)",
      "Discount + profit combos",
      "Reverse percentages (original price)",
    ],
  },
  {
    tag: "QA → Arithmetic → Time & Work",
    mustKnow: [
      "Rate = 1/time; Combined rate = sum of rates",
      "A in a, B in b ⇒ together time = ab/(a+b)",
      "Work proportional to (men × days × hours × efficiency)",
    ],
    shortcuts: [
      "Use LCM as total work for multi-worker problems",
      "Convert 'A is k times as efficient' ⇒ time inverse",
    ],
    traps: [
      "Mixing 'work done' vs 'remaining work'",
      "Not treating 'leak/outlet' as negative rate",
    ],
    practiceTypes: [
      "2-person + 3-person combined work",
      "Efficiency ratios",
      "Alternate day work",
    ],
  },
  {
    tag: "QA → Arithmetic → Time–Speed–Distance",
    mustKnow: [
      "Distance = speed × time",
      "Relative speed: opposite = v1+v2; same direction = |v1−v2|",
      "Average speed (equal distance) = 2v1v2/(v1+v2)",
    ],
    shortcuts: [
      "Trains: time to cross pole = length/speed; platform = (train+platform)/speed",
      "Boats: downstream = u+v, upstream = u−v (u=boat in still water, v=current)",
    ],
    traps: [
      "Unit mismatch (km/h vs m/s; 1 m/s = 3.6 km/h)",
      "Wrong relative speed sign",
    ],
    practiceTypes: [
      "Trains crossing problems",
      "Boats & streams",
      "Circular track meet/catch",
    ],
  },

  // QA Algebra
  {
    tag: "QA → Algebra → Quadratic",
    mustKnow: [
      "ax^2+bx+c=0 ⇒ sum roots = −b/a, product = c/a",
      "Discriminant D=b^2−4ac (real roots if D≥0)",
    ],
    shortcuts: [
      "If options given, plug options into equation quickly",
      "Use Vieta to compute expressions in roots without solving",
    ],
    traps: ["Forgetting a≠1 scaling in sum/product"],
    practiceTypes: [
      "Roots-based expression",
      "Parameter-based quadratic",
      "Inequality using D",
    ],
  },
  {
    tag: "QA → Algebra → Sequences & Series",
    mustKnow: [
      "AP: Tn=a+(n−1)d; Sn=n/2(2a+(n−1)d)",
      "GP: Tn=ar^(n−1); Sn=a(r^n−1)/(r−1), r≠1",
    ],
    shortcuts: [
      "Use difference tables for pattern spotting",
      "For sums, check if telescoping possible",
    ],
    traps: ["Mixing Tn and Sn", "Sign errors in r<0"],
    practiceTypes: [
      "AP/GP word problems",
      "Sum constraints",
      "Nth term puzzles",
    ],
  },

  // Geometry
  {
    tag: "QA → Geometry → Triangles",
    mustKnow: [
      "Pythagoras: a^2+b^2=c^2 (right triangle)",
      "Area = 1/2 × base × height",
      "Special triangles: 45-45-90 (1:1:√2), 30-60-90 (1:√3:2)",
    ],
    shortcuts: [
      "Use common triples: 3-4-5, 5-12-13, 8-15-17",
      "Similarity ⇒ ratios of sides = ratios of heights = ratios of medians (in similar triangles)",
    ],
    traps: ["Confusing angle bisector ratio vs median"],
    practiceTypes: [
      "Similarity",
      "Right triangles",
      "Max area / min perimeter style",
    ],
  },
  {
    tag: "QA → Geometry → Circles",
    mustKnow: [
      "Angle in semicircle = 90°",
      "Tangent ⟂ radius at point of contact",
      "Cyclic quadrilateral: opposite angles sum 180°",
    ],
    shortcuts: [
      "If tangents from external point: lengths equal",
      "Use chord/arc symmetry for equal angles",
    ],
    traps: ["Mixing arc angle vs central angle"],
    practiceTypes: [
      "Tangents",
      "Cyclic quadrilaterals",
      "Chord-angle problems",
    ],
  },

  // Number system
  {
    tag: "QA → Number System → Remainders / Cyclicity",
    mustKnow: [
      "(a±b) mod m, (a×b) mod m, a^k mod m cycles",
      "Last digit cycles length usually 4 (for bases 2,3,7,8); 2 for 4,9; 1 for 0,1,5,6",
    ],
    shortcuts: [
      "Compute exponent mod cycle length",
      "Use mod 9 (digit sum) for quick sanity checks",
    ],
    traps: ["Wrong cycle length", "Forgetting mod with subtraction (negative)"],
    practiceTypes: [
      "Last digit",
      "Large power remainder",
      "Pattern-based remainder",
    ],
  },
  {
    tag: "QA → Number System → Factorials / Trailing Zeros",
    mustKnow: [
      "Trailing zeros in n! = count of 5s = ⌊n/5⌋+⌊n/25⌋+⌊n/125⌋+…",
      "Highest power of prime p in n! uses repeated division sum",
    ],
    shortcuts: [
      "Count 2s/5s separately in product-type trailing zero problems",
    ],
    traps: ["Forgetting higher powers 25,125..."],
    practiceTypes: [
      "Trailing zeros",
      "Highest power",
      "Factorial remainder (basic)",
    ],
  },

  // Modern math
  {
    tag: "QA → Modern Math → P&C",
    mustKnow: [
      "nPr = n!/(n−r)! ; nCr = n!/(r!(n−r)!)",
      "Arrangements with repetition: n^r",
      "Permutations of multiset: n!/ (a!b!c!)",
    ],
    shortcuts: [
      "Use complement counting (all − bad)",
      "Use symmetry: nCr = nC(n−r)",
    ],
    traps: ["Order vs selection confusion"],
    practiceTypes: [
      "Arrangements",
      "Grouping/committees",
      "Digit/letter counting",
    ],
  },
  {
    tag: "QA → Modern Math → Probability",
    mustKnow: [
      "P(A∪B)=P(A)+P(B)−P(A∩B)",
      "At least one = 1 − none",
      "Independent ⇒ P(A∩B)=P(A)P(B)",
    ],
    shortcuts: [
      "Use complement for 'at least one' always",
      "If choices are few, use casework systematically",
    ],
    traps: ["Double counting overlap", "Assuming independence wrongly"],
    practiceTypes: [
      "At least one",
      "Conditional probability (basic)",
      "Balls/cards classic",
    ],
  },

  // DILR Strategy (not formulas, but playbook)
  {
    tag: "DILR → Strategy → Set selection",
    mustKnow: [
      "First 2–3 mins: scan all sets; pick 2 easiest first",
      "Drop rule: if no progress by 8–10 mins, leave it",
      "Target: 2 solid sets consistently, then push to 3",
    ],
    shortcuts: [
      "Prefer sets with clean tables / fewer variables",
      "Avoid sets with too many cases unless it’s your strength",
    ],
    traps: ["Marrying a set", "Starting hardest set first"],
    practiceTypes: [
      "Timed set scans",
      "2-set strategy drills",
      "Reattempt old sets",
    ],
  },

  // VARC core heuristics
  {
    tag: "VARC → RC",
    mustKnow: [
      "Eliminate out-of-scope options",
      "Beware extreme words (always/never) unless passage supports",
      "Main idea ≠ detail; inference must be supported, not guessed",
    ],
    shortcuts: [
      "Read paragraph roles: intro → argument → caveat → conclusion",
      "Option elimination beats 'finding perfect answer'",
    ],
    traps: ["Using outside knowledge", "Over-inference"],
    practiceTypes: [
      "2 RC/day + review",
      "Inference-only drills",
      "Main idea drills",
    ],
  },
];

function formulaLookup(query: string): FormulaEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const scored = FORMULA_DB.map((e) => {
    const key = e.tag.toLowerCase();
    let score = 0;
    if (key === q) score += 10;
    if (key.includes(q)) score += 6;
    const parts = q
      .split(/[→>|/,-]/)
      .map((x) => x.trim())
      .filter(Boolean);
    for (const p of parts) {
      if (p && key.includes(p)) score += 2;
    }
    return { e, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((x) => x.e);

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
  } else if (
    /(formula|formulas|shortcut|shortcuts|trick|cheat sheet|revision sheet)/.test(
      lower
    )
  ) {
    intent = "formula_request";
  } else if (extractedMockScores) {
    intent = "mock_review";
  } else if (
    /(plan|schedule|routine|timetable|strategy|how do i start|start prep|prepare|roadmap)/.test(
      lower
    )
  ) {
    intent = "plan_request";
  } else if (
    detectedSection ||
    detectedTopicTag ||
    /\bqa\b|\bvarc\b|\bdilr\b|\blrdi\b/i.test(lower)
  ) {
    intent = "topic_question";
  }

  const detectedScenario = detectScenario(normalized, extractedMockScores);

  // Ask onboarding questions only if user wants a plan and gives zero usable constraints.
  const likelyMissingCriticalInfo =
    intent === "plan_request" &&
    !/(hours?|hrs?|weekday|weekend|resources?|books?|coaching|mock|score|job|working|months?|weeks?)/.test(
      lower
    );

  const shouldAskQuickQuestions = Boolean(likelyMissingCriticalInfo);
  const responseMode: CatCoachResponseMode = shouldAskQuickQuestions
    ? "onboarding_questions"
    : "normal_coaching";

  const notes: string[] = [];
  if (greeting) notes.push("Detected greeting/ack only.");
  if (shouldAskQuickQuestions)
    notes.push("Plan asked with missing constraints: ask quick questions.");
  if (detectedScenario.code !== "unknown")
    notes.push(`Scenario detected: ${detectedScenario.code}`);

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
  const { overall, VARC, DILR, QA, attempts, accuracyPercent, notesText } =
    args;

  const sectionScores = [
    { k: "VARC", v: typeof VARC === "number" ? VARC : null },
    { k: "DILR", v: typeof DILR === "number" ? DILR : null },
    { k: "QA", v: typeof QA === "number" ? QA : null },
  ].filter((x) => x.v !== null) as Array<{
    k: "VARC" | "DILR" | "QA";
    v: number;
  }>;

  let weakest: "VARC" | "DILR" | "QA" | null = null;
  if (sectionScores.length) {
    weakest = sectionScores.reduce((a, b) => (a.v < b.v ? a : b)).k;
  }

  const rootCauses: string[] = [];
  if (typeof accuracyPercent === "number" && accuracyPercent < 65) {
    rootCauses.push(
      "Accuracy low → guessing / weak elimination / weak fundamentals."
    );
  }
  if (typeof attempts === "number" && attempts < 40) {
    rootCauses.push(
      "Low attempts → speed + selection problem (or too cautious)."
    );
  }
  if (weakest === "DILR")
    rootCauses.push("DILR weak → set selection + representation likely.");
  if (weakest === "VARC")
    rootCauses.push("VARC weak → RC process + elimination likely.");
  if (weakest === "QA")
    rootCauses.push("QA weak → fundamentals + speed/2-pass likely.");
  if (notesText && /panic|chaos|random|strategy changes/i.test(notesText)) {
    rootCauses.push(
      "Mock instability → strategy not fixed (freeze for 5 mocks)."
    );
  }

  const plan14: string[] = [];
  plan14.push(
    "Do 2 full mocks/week + deep analysis (WRONG / GUESSED / TIME-SINK / SKIPPED-BUT-DOABLE)."
  );
  plan14.push(
    "Daily: 1 DILR set + 1 RC passage + 15 QA questions (mix easy+medium)."
  );
  if (weakest === "DILR")
    plan14.push(
      "DILR focus: scan sets 2–3 mins + pick 2 easiest; drop if stuck at 8–10 mins."
    );
  if (weakest === "VARC")
    plan14.push(
      "VARC focus: 2 RC/day, track inference mistakes, extreme/out-of-scope elimination drills."
    );
  if (weakest === "QA")
    plan14.push(
      "QA focus: 2-pass practice; accuracy-first; redo slow questions for speed."
    );

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
      description:
        "Heuristically detect CAT section and a likely topic tag from a user message.",
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
      description:
        "Given mock scores and optional notes, return likely root causes + a 14-day fix plan skeleton.",
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
    const message =
      typeof (args as any)?.message === "string" ? (args as any).message : "";
    return intakeCatCoach(message);
  }

  if (name === "cat_extract_mock_scores") {
    const text =
      typeof (args as any)?.text === "string" ? (args as any).text : "";
    return extractMockScores(text);
  }

  if (name === "cat_detect_topic") {
    const text =
      typeof (args as any)?.text === "string" ? (args as any).text : "";
    return { section: detectSection(text), topicTag: detectTopicTag(text) };
  }

  if (name === "cat_formula_lookup") {
    const query =
      typeof (args as any)?.query === "string" ? (args as any).query : "";
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
      accuracyPercent:
        typeof a.accuracyPercent === "number" ? a.accuracyPercent : null,
      notesText: typeof a.notesText === "string" ? a.notesText : null,
    });
  }

  return { error: `Unknown tool: ${name}` };
}
