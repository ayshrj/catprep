import { OddSentenceOutPuzzle, OddSentenceOutState } from "./types";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getHint(puzzle: OddSentenceOutPuzzle, state: OddSentenceOutState) {
  return {
    title: "Elimination heuristic",
    body: "Look for a sentence that changes topic, tense/timeframe, or makes an absolute claim ('always', 'never'). Also check for broken references (pronouns with no antecedent) and missing logical connectors.",
  };
}
