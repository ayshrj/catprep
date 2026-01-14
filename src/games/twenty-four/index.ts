import { GameModule } from "../core/types";
import { reduce } from "./engine";
import { evaluate } from "./evaluator";
import { createPuzzle } from "./generator";
import { getHint } from "./hints";
import { TwentyFourAction, TwentyFourPuzzle, TwentyFourState } from "./types";
import { TwentyFourUI } from "./ui";

const TwentyFourGame: GameModule<TwentyFourPuzzle, TwentyFourState, TwentyFourAction> = {
  id: "twentyFour",
  title: "24 Game",
  section: "qa",
  skillTags: ["Mental Math", "Arithmetic Operations", "Algebraic Thinking"],
  description:
    "The 24 Game improves quick mental arithmetic and flexible thinking with numbers, enhancing calculation speed and accuracy for the QA section.",
  difficulties: [
    { id: 1, label: "Easy" },
    { id: 2, label: "Medium" },
    { id: 3, label: "Hard" },
  ],
  createPuzzle,
  getInitialState: puzzle => ({
    currentNumbers: [...puzzle.numbers],
    firstIndex: null,
    secondIndex: null,
    operator: null,
    originalNumbers: [...puzzle.numbers],
  }),
  reduce,
  evaluate,
  getHint,
  Component: TwentyFourUI,
};

export default TwentyFourGame;
