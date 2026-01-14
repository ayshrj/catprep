import { GameModule } from "../core/types";
import { reduce } from "./engine";
import { evaluate } from "./evaluator";
import { createPuzzle } from "./generator";
import { getHint } from "./hints";
import { OddSentenceOutAction, OddSentenceOutPuzzle, OddSentenceOutState } from "./types";
import { OddSentenceOutUI } from "./ui";

const oddSentenceOut: GameModule<OddSentenceOutPuzzle, OddSentenceOutState, OddSentenceOutAction> = {
  id: "oddSentenceOut",
  title: "Odd Sentence Out",
  section: "varc",
  skillTags: ["Coherence", "Elimination", "Logical Flow"],
  description:
    "Trains VA elimination: identify topic drift, broken references, and logical discontinuities—exactly what CAT Odd Sentence Out rewards.",
  difficulties: [
    { id: 1, label: "Easy" },
    { id: 2, label: "Medium" },
    { id: 3, label: "Hard" },
  ],
  createPuzzle,
  getInitialState: () => ({
    selectedIndex: null,
    explanation: "",
    submitted: false,
  }),
  reduce,
  evaluate,
  getHint,
  Component: OddSentenceOutUI,
};

export default oddSentenceOut;
