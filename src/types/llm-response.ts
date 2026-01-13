import type { CatCoachIntent, CatCoachResponseMode, CatScenarioCode } from "@/lib/cat-tools";

export type LlmConfidence = "low" | "med" | "high";

export type LlmScenario = {
  code: CatScenarioCode;
  confidence: LlmConfidence;
  reason: string;
};

export type LlmMainAnswer = {
  type: "greeting" | "onboarding_questions" | "plan" | "mock_review" | "formula" | "topic" | "gdpi" | "other";
  bullets: string[];
  table: { headers: string[]; rows: string[][] } | null;
  notes: string[];
};

export type LlmNextActions = {
  today: string[];
  thisWeek: string[];
};

export type LlmSection = "QA" | "VARC" | "DILR" | null;

export type LlmCatCoachResponse = {
  intent: CatCoachIntent;
  responseMode: CatCoachResponseMode;
  shouldAskQuickQuestions: boolean;
  quickQuestions: string[];
  scenario: LlmScenario;
  section: LlmSection;
  topicTag: string | null;
  whatUserNeedsNow: string;
  mainAnswer: LlmMainAnswer;
  nextActions: LlmNextActions;
};

export const LlmMainAnswerTypeLabels: Record<LlmMainAnswer["type"], string> = {
  greeting: "Greeting",
  onboarding_questions: "Onboarding Questions",
  plan: "Study Plan",
  mock_review: "Mock Test Review",
  formula: "Formulas & Concepts",
  topic: "Topic Explanation",
  gdpi: "GDPI Preparation",
  other: "Other",
};

export function isLlmCatCoachResponse(value: unknown): value is LlmCatCoachResponse {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const obj = value as Record<string, unknown>;

  if (typeof obj.intent !== "string") return false;
  if (typeof obj.responseMode !== "string") return false;
  if (typeof obj.shouldAskQuickQuestions !== "boolean") return false;
  if (!Array.isArray(obj.quickQuestions)) return false;
  if (typeof obj.whatUserNeedsNow !== "string") return false;

  const scenario = obj.scenario as Record<string, unknown> | null;
  if (!scenario || typeof scenario !== "object" || Array.isArray(scenario)) {
    return false;
  }
  if (typeof scenario.code !== "string") return false;
  if (typeof scenario.confidence !== "string") return false;
  if (typeof scenario.reason !== "string") return false;

  const mainAnswer = obj.mainAnswer as Record<string, unknown> | null;
  if (!mainAnswer || typeof mainAnswer !== "object" || Array.isArray(mainAnswer)) {
    return false;
  }
  if (typeof mainAnswer.type !== "string") return false;
  if (!Array.isArray(mainAnswer.bullets)) return false;
  if (!Array.isArray(mainAnswer.notes)) return false;

  const nextActions = obj.nextActions as Record<string, unknown> | null;
  if (!nextActions || typeof nextActions !== "object" || Array.isArray(nextActions)) {
    return false;
  }
  if (!Array.isArray(nextActions.today)) return false;
  if (!Array.isArray(nextActions.thisWeek)) return false;

  return true;
}
