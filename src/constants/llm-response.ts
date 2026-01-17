import type { LlmMainAnswer } from "@/types/llm-response";

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
