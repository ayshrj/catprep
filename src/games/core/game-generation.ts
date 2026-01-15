export const LLM_GAME_IDS = new Set([
  "rcDaily",
  "oddSentenceOut",
  "paraJumble",
  "paraSummary",
  "twoLineSummary",
  "inferenceJudge",
  "diCaseletTrainer",
]);

export const LLM_GAME_ID_LIST = Array.from(LLM_GAME_IDS);

export function isLlmGame(gameId: string) {
  return LLM_GAME_IDS.has(gameId);
}

// Code-only toggle for LLM-backed games.
export const LLM_GENERATION_ENABLED = true;
export const LLM_FALLBACK_TO_LOCAL = true;

export function shouldUseLlmGeneration(gameId: string) {
  return LLM_GENERATION_ENABLED && isLlmGame(gameId);
}
