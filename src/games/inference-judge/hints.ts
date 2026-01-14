import { InferenceJudgePuzzle, InferenceJudgeState } from "./types";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getHint(_: InferenceJudgePuzzle, __: InferenceJudgeState) {
  return {
    title: "Inference discipline",
    body: "Pick ONLY what must follow from the passage. Avoid extreme words ('always', 'never'), added causes, and citywide/general claims when the text is local/specific. If an option needs extra assumptions, eliminate it.",
  };
}
