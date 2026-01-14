import { GameModule } from "../core/types";
import { reduce } from "./engine";
import { evaluate } from "./evaluator";
import { createPuzzle } from "./generator";
import { getHint } from "./hints";
import { RoutesAction, RoutesPuzzle, RoutesState } from "./types";
import { RoutesPuzzleUI } from "./ui";

const moduleDef: GameModule<RoutesPuzzle, RoutesState, RoutesAction> = {
  id: "routesPuzzle",
  title: "Routes & Networks",
  section: "dilr",
  skillTags: ["Graph reasoning", "Constraint pruning", "Path planning"],
  description:
    "Routes/network DILR sets require pruning and constraint-based exploration. This game trains you to reason using remaining cost, avoid dead ends, and validate feasibility quickly.",
  difficulties: [
    { id: 1, label: "Easy" },
    { id: 2, label: "Medium" },
    { id: 3, label: "Hard" },
  ],
  createPuzzle,
  getInitialState: puzzle => ({ path: [puzzle.start] }),
  reduce,
  evaluate,
  getHint,
  Component: RoutesPuzzleUI,
};

export default moduleDef;
