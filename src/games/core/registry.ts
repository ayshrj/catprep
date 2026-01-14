import diCaseletTrainer from "../di-caselet-trainer";
import estimationDuel from "../estimation-duel";
import inferenceJudge from "../inference-judge";
import kenken from "../kenken";
import logicGrid from "../logic-grid";
import mentalMath from "../mental-math";
import minesweeper from "../minesweeper";
import nonogram from "../nonogram";
import oddSentenceOut from "../odd-sentence-out";
import paraJumble from "../para-jumble";
import paraSummary from "../para-summary";
import pointsTable from "../points-table";
import ratioMixer from "../ratio-mixer";
import rcDaily from "../rc-daily";
import routesPuzzle from "../routes-puzzle";
import schedulingPuzzle from "../scheduling-puzzle";
import setSelectionSimulator from "../set-selection-simulator";
import sudoku from "../sudoku";
import targetNumber from "../target-number";
import twentyFour from "../twenty-four";
import twoLineSummary from "../two-line-summary";
import { GameRegistry } from "./types";

const gameRegistry: GameRegistry = {
  [sudoku.id]: sudoku,
  [twentyFour.id]: twentyFour,
  [kenken.id]: kenken,
  [logicGrid.id]: logicGrid,
  [minesweeper.id]: minesweeper,
  [nonogram.id]: nonogram,
  [schedulingPuzzle.id]: schedulingPuzzle,
  [pointsTable.id]: pointsTable,
  [routesPuzzle.id]: routesPuzzle,
  [mentalMath.id]: mentalMath,
  [targetNumber.id]: targetNumber,
  [estimationDuel.id]: estimationDuel,
  [ratioMixer.id]: ratioMixer,
  [rcDaily.id]: rcDaily,
  [twoLineSummary.id]: twoLineSummary,
  [paraJumble.id]: paraJumble,
  [paraSummary.id]: paraSummary,
  [oddSentenceOut.id]: oddSentenceOut,
  [inferenceJudge.id]: inferenceJudge,
  [diCaseletTrainer.id]: diCaseletTrainer,
  [setSelectionSimulator.id]: setSelectionSimulator,
};

export default gameRegistry;
