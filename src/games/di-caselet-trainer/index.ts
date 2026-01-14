import { GameModule } from "../core/types";
import { reduce } from "./engine";
import { evaluate } from "./evaluator";
import { createPuzzle } from "./generator";
import { getHint } from "./hints";
import { DICaseletAction, DICaseletPuzzle, DICaseletState } from "./types";
import { DICaseletTrainerUI } from "./ui";

const diCaseletTrainer: GameModule<DICaseletPuzzle, DICaseletState, DICaseletAction> = {
  id: "diCaseletTrainer",
  title: "DI Caselet Trainer",
  section: "hybrid",
  skillTags: ["Table-building", "Selective Computation", "Accuracy Under Time"],
  description:
    "Mimics CAT DI mini-sets: build a quick table, compute only what’s required, and avoid traps via approximation and unit discipline.",
  difficulties: [
    { id: 1, label: "Easy" },
    { id: 2, label: "Medium" },
    { id: 3, label: "Hard" },
  ],
  createPuzzle,
  getInitialState: () => ({ answers: {}, submitted: false }),
  reduce,
  evaluate,
  getHint,
  Component: DICaseletTrainerUI,
};

export default diCaseletTrainer;
