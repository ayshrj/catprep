import type { LlmCatCoachResponse } from "@/types/llm-response";

const VALID_INTENTS = new Set([
  "greeting",
  "plan_request",
  "mock_review",
  "formula_request",
  "topic_question",
  "gdpi_request",
  "other",
]);

const VALID_RESPONSE_MODES = new Set(["onboarding_questions", "normal_coaching"]);

const VALID_SCENARIO_CODES = new Set([
  "S1",
  "S2",
  "S3",
  "S4",
  "S5",
  "S6",
  "S7",
  "S8",
  "S9",
  "S10",
  "S11",
  "S12",
  "S13",
  "S14",
  "S15",
  "S16",
  "S17",
  "S18",
  "unknown",
]);

const VALID_MAIN_TYPES = new Set([
  "greeting",
  "onboarding_questions",
  "plan",
  "mock_review",
  "formula",
  "topic",
  "gdpi",
  "other",
]);

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function extractFirstJsonObject(text: string): string | null {
  const s = text.trim();
  if (!s) return null;

  if (s.startsWith("{") && s.endsWith("}")) return s;

  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) return null;
  return s.slice(first, last + 1).trim();
}

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeStringArray(value: unknown) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeString(item))
      .filter((item) => item.length > 0);
  }
  const single = normalizeString(value);
  return single ? [single] : [];
}

function normalizeScenario(value: unknown): LlmCatCoachResponse["scenario"] {
  if (!isPlainObject(value)) {
    return { code: "unknown", confidence: "low", reason: "" };
  }
  const code = normalizeString(value.code);
  const confidence = normalizeString(value.confidence);
  const reason = normalizeString(value.reason);
  return {
    code: VALID_SCENARIO_CODES.has(code) ? (code as any) : "unknown",
    confidence:
      confidence === "low" || confidence === "med" || confidence === "high"
        ? (confidence as any)
        : "low",
    reason,
  };
}

function normalizeTable(
  value: unknown
): LlmCatCoachResponse["mainAnswer"]["table"] {
  if (!isPlainObject(value)) return null;
  const headers = normalizeStringArray(value.headers);
  const rows = Array.isArray(value.rows)
    ? value.rows.map((row) =>
        Array.isArray(row)
          ? row.map((cell) => normalizeString(cell))
          : [normalizeString(row)]
      )
    : [];

  if (headers.length === 0) return null;
  return {
    headers,
    rows,
  };
}

function normalizeMainAnswer(
  value: unknown
): LlmCatCoachResponse["mainAnswer"] {
  if (!isPlainObject(value)) {
    return { type: "other", bullets: [], table: null, notes: [] };
  }
  const type = normalizeString(value.type);
  return {
    type: VALID_MAIN_TYPES.has(type) ? (type as any) : "other",
    bullets: normalizeStringArray(value.bullets),
    table: normalizeTable(value.table),
    notes: normalizeStringArray(value.notes),
  };
}

function normalizeNextActions(
  value: unknown
): LlmCatCoachResponse["nextActions"] {
  if (!isPlainObject(value)) {
    return { today: [], thisWeek: [] };
  }
  return {
    today: normalizeStringArray(value.today),
    thisWeek: normalizeStringArray(value.thisWeek),
  };
}

function normalizeAssistantJson(raw: unknown): LlmCatCoachResponse {
  if (!isPlainObject(raw)) {
    return {
      intent: "other",
      responseMode: "normal_coaching",
      shouldAskQuickQuestions: false,
      quickQuestions: [],
      scenario: { code: "unknown", confidence: "low", reason: "" },
      section: null,
      topicTag: null,
      whatUserNeedsNow: "",
      mainAnswer: { type: "other", bullets: [], table: null, notes: [] },
      nextActions: { today: [], thisWeek: [] },
    };
  }

  const intent = normalizeString(raw.intent);
  const responseMode = normalizeString(raw.responseMode);
  const section = normalizeString(raw.section);
  const topicTag = normalizeString(raw.topicTag);

  return {
    intent: VALID_INTENTS.has(intent) ? (intent as any) : "other",
    responseMode: VALID_RESPONSE_MODES.has(responseMode)
      ? (responseMode as any)
      : "normal_coaching",
    shouldAskQuickQuestions: Boolean(raw.shouldAskQuickQuestions),
    quickQuestions: normalizeStringArray(raw.quickQuestions),
    scenario: normalizeScenario(raw.scenario),
    section:
      section === "QA" || section === "VARC" || section === "DILR"
        ? (section as any)
        : null,
    topicTag: topicTag || null,
    whatUserNeedsNow: normalizeString(raw.whatUserNeedsNow),
    mainAnswer: normalizeMainAnswer(raw.mainAnswer),
    nextActions: normalizeNextActions(raw.nextActions),
  };
}

export function parseAssistantJsonOrThrow(
  raw: string
): LlmCatCoachResponse {
  const candidate = extractFirstJsonObject(raw);
  if (!candidate) throw new Error("Model did not return a JSON object.");

  let parsed: any;
  try {
    parsed = JSON.parse(candidate);
  } catch {
    throw new Error("Model returned invalid JSON (JSON.parse failed).");
  }

  if (!isPlainObject(parsed)) {
    throw new Error("Model JSON is not an object.");
  }

  return normalizeAssistantJson(parsed);
}
