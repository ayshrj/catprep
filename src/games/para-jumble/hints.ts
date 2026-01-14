import type { ParaJumblePuzzle, ParaJumbleState } from "./types";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getHint(_puzzle: ParaJumblePuzzle, _state: ParaJumbleState) {
  return {
    title: "Ordering cues",
    body:
      "Look for: (1) opener sentence (broad context), (2) pronouns needing antecedents, (3) contrast words (however/but), " +
      "(4) conclusion markers (therefore/so/as a result). Build a logical chain.",
  };
}
