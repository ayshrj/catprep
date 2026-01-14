import { GameModule } from "../core/types";
import { reduce } from "./engine";
import { evaluate } from "./evaluator";
import { createPuzzle } from "./generator";
import { getHint } from "./hints";
import { EstimationDuelAction, EstimationDuelPuzzle, EstimationDuelState } from "./types";
import { EstimationDuelUI } from "./ui";

const moduleDef: GameModule<EstimationDuelPuzzle, EstimationDuelState, EstimationDuelAction> = {
  id: "estimationDuel",
  title: "Estimation Duel",
  section: "qa",
  skillTags: ["Approximation", "Elimination", "Speed"],
  description:
    "CAT QA loves approximation + elimination. This game trains fast rounding, near-product tricks, and quick evaluation under time pressure.",
  difficulties: [
    { id: 1, label: "Easy" },
    { id: 2, label: "Medium" },
    { id: 3, label: "Hard" },
  ],
  createPuzzle,
  getInitialState: puzzle => ({
    index: 0,
    selected: null,
    answered: Array(puzzle.rounds.length).fill(null),
    revealed: Array(puzzle.rounds.length).fill(false),
  }),
  reduce,
  evaluate,
  getHint,
  Component: EstimationDuelUI,
};

export default moduleDef;
