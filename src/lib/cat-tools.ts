export type CatCoachIntent =
  | "greeting"
  | "plan_request"
  | "mock_review"
  | "topic_question"
  | "other"

export type CatCoachResponseMode =
  | "onboarding_questions"
  | "normal_coaching"

export type CatIntakeResult = {
  intent: CatCoachIntent
  responseMode: CatCoachResponseMode
  shouldAskQuickQuestions: boolean
  quickQuestions: string[]
  detectedSection: "QA" | "VARC" | "DILR" | null
  detectedTopicTag: string | null
  extractedMockScores: {
    overall: number | null
    VARC: number | null
    DILR: number | null
    QA: number | null
    attempts: number | null
    accuracyPercent: number | null
  } | null
  notes: string[]
}

export type OpenAiToolDefinition = {
  type: "function"
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}

const QUICK_QUESTIONS = [
  "CAT attempt month/year? (Assuming CAT 2026 unless you say otherwise.)",
  "Weekly study hours available? (weekday + weekend split)",
  "Current sectional level? (unknown is fine)",
]

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ")
}

function isGreetingMessage(message: string) {
  const text = normalizeText(message).toLowerCase()
  if (!text) return false
  if (text.length > 24) return false
  if (/[0-9]/.test(text)) return false
  return /^(hi|hii+|hello|hey|yo|sup|namaste|hola|good (morning|evening|afternoon))( there)?[!. ]*$/.test(
    text
  )
}

function detectSection(text: string): CatIntakeResult["detectedSection"] {
  const lower = text.toLowerCase()
  if (/(varc|rc|reading comprehension|para-?jumbles?|para-?summary)/.test(lower)) {
    return "VARC"
  }
  if (/(dilr|lrdi|logical reasoning|data interpretation|set selection)/.test(lower)) {
    return "DILR"
  }
  if (/(qa|quant|quants|arithmetic|algebra|geometry|number system)/.test(lower)) {
    return "QA"
  }
  return null
}

function detectTopicTag(text: string): string | null {
  const lower = text.toLowerCase()

  const rules: Array<[RegExp, string]> = [
    [/percent(age|ages)?/i, "QA → Arithmetic → Percentages"],
    [/profit|loss|discount/i, "QA → Arithmetic → Profit–Loss–Discount"],
    [/\bsi\b|simple interest|compound interest|\bci\b/i, "QA → Arithmetic → SI/CI"],
    [/ratio|proportion/i, "QA → Arithmetic → Ratio–Proportion"],
    [/average(s)?/i, "QA → Arithmetic → Averages"],
    [/mixture|alligation/i, "QA → Arithmetic → Mixtures–Alligation"],
    [/time\s*&?\s*work/i, "QA → Arithmetic → Time & Work"],
    [/pipes?|cistern/i, "QA → Arithmetic → Pipes–Cisterns"],
    [/speed|distance|train|boat/i, "QA → Arithmetic → Time–Speed–Distance"],
    [/linear equation|simultaneous|inequalit|quadratic|polynomial|logarithm|modulus/i, "QA → Algebra"],
    [/triangle|circle|coordinate geometry|lines?\s*&?\s*angles?/i, "QA → Geometry"],
    [/mensuration|surface area|volume/i, "QA → Mensuration"],
    [/divisibility|prime|hcf|lcm|remainder|cyclicity|factorial/i, "QA → Number System"],
    [/permutation|combination|probability|set(s)?\s*&?\s*venn|statistics/i, "QA → Modern Math"],
  ]

  for (const [re, tag] of rules) {
    if (re.test(lower)) return tag
  }
  return null
}

export function extractMockScores(text: string): CatIntakeResult["extractedMockScores"] {
  const lower = text.toLowerCase()
  if (!/(varc|dilr|lrdi|qa|quant|overall|mock|score|percentile)/.test(lower)) {
    return null
  }

  const readNum = (re: RegExp, groupIndex = 1) => {
    const match = re.exec(text)
    if (!match) return null
    const raw = match[groupIndex]
    const value = Number(raw)
    return Number.isFinite(value) ? value : null
  }

  const overall = readNum(/overall\s*[:=-]?\s*(\d{1,3})/i)
  const VARC = readNum(/varc\s*[:=-]?\s*(\d{1,3})/i)
  const DILR =
    readNum(/dilr\s*[:=-]?\s*(\d{1,3})/i) ?? readNum(/lrdi\s*[:=-]?\s*(\d{1,3})/i)
  const QA =
    readNum(/qa\s*[:=-]?\s*(\d{1,3})/i) ??
    readNum(/quant(s)?\s*[:=-]?\s*(\d{1,3})/i, 2)

  const attempts = readNum(/attempts?\s*[:=-]?\s*(\d{1,3})/i)
  const accuracyPercent = readNum(/accuracy\s*[:=-]?\s*(\d{1,3})\s*%/i)

  const hasAny =
    overall !== null ||
    VARC !== null ||
    DILR !== null ||
    QA !== null ||
    attempts !== null ||
    accuracyPercent !== null

  if (!hasAny) return null

  return { overall, VARC, DILR, QA, attempts, accuracyPercent }
}

export function intakeCatCoach(message: string): CatIntakeResult {
  const normalized = normalizeText(message)
  const lower = normalized.toLowerCase()

  const greeting = isGreetingMessage(normalized)
  const extractedMockScores = extractMockScores(normalized)
  const detectedSection = detectSection(normalized)
  const detectedTopicTag = detectTopicTag(normalized)

  let intent: CatCoachIntent = "other"
  if (greeting) {
    intent = "greeting"
  } else if (extractedMockScores) {
    intent = "mock_review"
  } else if (/(plan|schedule|routine|timetable|strategy|how do i start|start prep|prepare)/.test(lower)) {
    intent = "plan_request"
  } else if (detectedSection || detectedTopicTag || /\bqa\b|\bvarc\b|\bdilr\b/i.test(lower)) {
    intent = "topic_question"
  }

  // Only ask the quick onboarding questions when the user explicitly asks for a plan,
  // but provides no usable constraints. Do not block normal questions.
  const likelyMissingCriticalInfo =
    intent === "plan_request" &&
    !/(hours?|hrs?|weekday|weekend|resources?|books?|coaching|mock|score|percentile|job|working|months?|weeks?)/.test(
      lower
    )

  const shouldAskQuickQuestions = Boolean(likelyMissingCriticalInfo)
  const responseMode: CatCoachResponseMode = shouldAskQuickQuestions
    ? "onboarding_questions"
    : "normal_coaching"

  const notes: string[] = []
  if (greeting) notes.push("Detected greeting-only message.")
  if (shouldAskQuickQuestions) notes.push("Critical info likely missing; ask up to 5 quick questions.")

  return {
    intent,
    responseMode,
    shouldAskQuickQuestions,
    quickQuestions: shouldAskQuickQuestions ? QUICK_QUESTIONS : [],
    detectedSection,
    detectedTopicTag,
    extractedMockScores,
    notes,
  }
}

export const CAT_COACH_TOOLS: OpenAiToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "cat_intake",
      description:
        "Analyze a user message for the CAT coach: detect intent, whether to ask the 5 critical questions, and hints like section/topic and mock-score structure.",
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
]

export async function executeCatTool(name: string, args: unknown) {
  if (name === "cat_intake") {
    const message = typeof (args as any)?.message === "string" ? (args as any).message : ""
    return intakeCatCoach(message)
  }

  if (name === "cat_extract_mock_scores") {
    const text = typeof (args as any)?.text === "string" ? (args as any).text : ""
    return extractMockScores(text)
  }

  if (name === "cat_detect_topic") {
    const text = typeof (args as any)?.text === "string" ? (args as any).text : ""
    return { section: detectSection(text), topicTag: detectTopicTag(text) }
  }

  return { error: `Unknown tool: ${name}` }
}
