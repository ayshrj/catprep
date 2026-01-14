import type { GameModule } from "../core/types";
import { reduce } from "./engine";
import { evaluate } from "./evaluator";
import { createPuzzle } from "./generator";
import { getHint } from "./hints";
import type { ParaJumbleAction, ParaJumblePuzzle, ParaJumbleState } from "./types";
import { ParaJumbleUI } from "./ui";

const paraJumble: GameModule<ParaJumblePuzzle, ParaJumbleState, ParaJumbleAction> = {
  id: "paraJumble",
  title: "Para-jumble Builder",
  section: "varc",
  skillTags: ["Cohesion", "Connectors", "Pronoun Tracking", "Logic"],
  description: "Improves VA ordering: tracking connectors, pronouns, and logical flow—key CAT Para-jumble skills.",
  difficulties: [
    { id: 1, label: "Easy" },
    { id: 2, label: "Medium" },
    { id: 3, label: "Hard" },
  ],
  timeLimitSeconds: 240,

  createPuzzle,
  getInitialState: puzzle => ({
    order: puzzle.sentences.map((_, i) => i), // start in given order
    submitted: false,
    focusedIndex: 0,
  }),
  reduce,
  evaluate,
  getHint,
  Component: ParaJumbleUI,
};

export default paraJumble;
