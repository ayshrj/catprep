import type { GameModule } from "../core/types";
import { reduce } from "./engine";
import { evaluate } from "./evaluator";
import { createPuzzle } from "./generator";
import { getHint } from "./hints";
import type { RatioMixerAction, RatioMixerPuzzle, RatioMixerState } from "./types";
import { RatioMixerUI } from "./ui";

const ratioMixer: GameModule<RatioMixerPuzzle, RatioMixerState, RatioMixerAction> = {
  id: "ratioMixer",
  title: "Ratio Mixer",
  section: "qa",
  skillTags: ["Alligation", "Ratios", "Number Sense", "Speed"],
  description:
    "Builds CAT QA instinct for mixtures, alligation, and ratios. Reinforces quick setup + mental math under time constraints.",
  difficulties: [
    { id: 1, label: "Easy" },
    { id: 2, label: "Medium" },
    { id: 3, label: "Hard" },
  ],
  timeLimitSeconds: 180,

  createPuzzle,
  getInitialState: () => ({
    percentA: 50,
    submitted: false,
  }),
  reduce,
  evaluate,
  getHint,
  Component: RatioMixerUI,
};

export default ratioMixer;
