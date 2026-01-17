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
