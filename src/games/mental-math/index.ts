import { GameModule } from "../core/types";
import { reduce } from "./engine";
import { evaluate } from "./evaluator";
import { createPuzzle } from "./generator";
import { getHint } from "./hints";
import { MentalMathAction, MentalMathPuzzle, MentalMathState } from "./types";
import { MentalMathUI } from "./ui";

const moduleDef: GameModule<MentalMathPuzzle, MentalMathState, MentalMathAction> = {
  id: "mentalMath",
  title: "Mental Math Arena",
  section: "qa",
  skillTags: ["Speed", "Number sense", "Accuracy"],
  description:
    "QA rewards fast, accurate computation. This drill set trains percent arithmetic, multiplication decomposition, fraction-decimal conversion, and quick squares.",
  difficulties: [
    { id: 1, label: "Easy" },
    { id: 2, label: "Medium" },
    { id: 3, label: "Hard" },
  ],
  createPuzzle,
  getInitialState: puzzle => ({
    index: 0,
    input: "",
    submitted: Array(puzzle.questions.length).fill(false),
    correct: Array(puzzle.questions.length).fill(null),
    answers: Array(puzzle.questions.length).fill(""),
    lastMessage: null,
  }),
  reduce,
  evaluate,
  getHint,
  Component: MentalMathUI,
};

export default moduleDef;
