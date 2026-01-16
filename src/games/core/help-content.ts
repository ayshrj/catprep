export type GameHelpContent = {
  rules: string[];
  examples: string[];
  scoring: string[];
  shortcuts: string[];
};

export const GAME_HELP_CONTENT: Record<string, GameHelpContent> = {
  sudoku: {
    rules: [
      "Fill every row and column with digits 1-9 without repeats.",
      "Each 3x3 box must also contain 1-9 exactly once.",
      "Use pencil marks to track candidates before committing.",
    ],
    examples: [
      "If a row has eight digits and only 5 is missing, place 5.",
      "If a box has only one spot where 9 can go, place 9.",
    ],
    scoring: ["Solve the grid for 100 points.", "Best time and streak are tracked per game."],
    shortcuts: ["Arrow keys move, 1-9 input.", "P toggles pencil, Del clears a cell."],
  },
  twentyFour: {
    rules: [
      "Use all four numbers once to reach 24.",
      "Combine numbers with +, -, *, and /; order and parentheses matter.",
    ],
    examples: ["6, 6, 6, 6 -> 6 + 6 + 6 + 6 = 24.", "8, 2, 6, 2 -> (8 - 2) * (6 - 2) = 24."],
    scoring: ["Exact 24 earns 100 points."],
    shortcuts: ["Tap numbers, pick an operator, then Apply.", "Reset clears the current attempt."],
  },
  kenken: {
    rules: [
      "Fill the grid with numbers 1..N so each row and column is unique.",
      "Each cage must satisfy its target and operation.",
    ],
    examples: ["A 3+ cage with two cells must be 1 and 2.", "A 2/ cage can be 2 and 1 in any order."],
    scoring: ["Solved grid earns 120 points."],
    shortcuts: ["Arrow keys move, number keys enter.", "Backspace clears a cell."],
  },
  logicGrid: {
    rules: [
      "Each row item matches exactly one column item.",
      "Use clues to mark yes, no, or maybe and eliminate conflicts.",
    ],
    examples: ["If A is not Cat and Cat is the only option left for B, mark B = Cat."],
    scoring: ["Solved with no contradictions earns 130 points."],
    shortcuts: ["Arrow keys move, Space cycles marks.", "Y/N/M set marks, Del clears."],
  },
  minesweeper: {
    rules: [
      "Reveal all safe cells without clicking a mine.",
      "Numbers show how many mines touch a cell; flags mark mines.",
    ],
    examples: ["A 1 with one hidden neighbor means that neighbor is a mine."],
    scoring: ["Solve the board for 140 points.", "Hitting a mine ends the round."],
    shortcuts: ["Arrows move, Enter or Space reveals.", "F flags, M toggles reveal/flag mode."],
  },
  nonogram: {
    rules: [
      "Row and column clues list runs of filled cells in order.",
      "Fill or mark X so each row and column matches its clues exactly.",
    ],
    examples: ["Clue 3 1 means three filled, at least one blank, then one filled."],
    scoring: ["Solved with no wrong marks earns 135 points."],
    shortcuts: ["Drag to paint; arrows move.", "Space cycles; F fill; X mark; Del clear."],
  },
  schedulingPuzzle: {
    rules: ["Assign each item to exactly one slot.", "Satisfy before/after, adjacency, and slot restrictions."],
    examples: ["If A must be before B and only two slots remain, A goes first."],
    scoring: ["Solved schedule earns 150 points."],
    shortcuts: ["Click a slot and choose from the dropdown.", "Use Notes to track deductions."],
  },
  pointsTable: {
    rules: [
      "Fill outcomes for each match while honoring locked results.",
      "Use points totals to deduce the remaining outcomes.",
    ],
    examples: ["If Team A already has 6 points, remaining outcomes must fit the totals."],
    scoring: ["All outcomes correct earns 100 points."],
    shortcuts: ["Use dropdowns to set outcomes.", "Clear resets a match selection."],
  },
  routesPuzzle: {
    rules: ["Build a path from Start to End using the edges.", "Total cost must match the target exactly."],
    examples: ["If current cost is 10 and target is 16, remaining edges must total 6."],
    scoring: ["Exact target path earns 100 points."],
    shortcuts: ["Click nodes to append.", "Backspace removes last; Esc clears the path."],
  },
  mentalMath: {
    rules: ["Answer all questions in the set.", "Move quickly while staying accurate."],
    examples: ["15% of 200 = 30.", "27 * 14 -> (27 * 10) + (27 * 4)."],
    scoring: ["Score equals percent correct out of 100."],
    shortcuts: ["Enter submits.", "Prev/Next or number buttons jump between questions."],
  },
  targetNumber: {
    rules: [
      "Combine the numbers using +, -, *, and / to reach the target.",
      "Each number can be used once; intermediate results are allowed.",
    ],
    examples: ["25, 2, 10, 5 -> 25 * 2 = 50."],
    scoring: ["Exact target earns 100 points."],
    shortcuts: ["Tap numbers, choose an operator, then Apply.", "Reset clears steps."],
  },
  estimationDuel: {
    rules: ["Pick the closest estimate for each round.", "Submit each round and move through the set."],
    examples: ["49 * 51 is about 2500.", "sqrt(980) is about 31."],
    scoring: ["Score equals percent correct across rounds."],
    shortcuts: ["Click an option, then Submit.", "Prev/Next lets you review rounds."],
  },
  ratioMixer: {
    rules: [
      "Find the percent of Solution A that reaches the target concentration.",
      "Target is always between A and B.",
    ],
    examples: ["A=20, B=50, target=35 -> A:B = 15:15 -> 50% A."],
    scoring: ["Within tolerance earns 100 points."],
    shortcuts: ["Use the slider or +/- buttons, or type a percent.", "Submit checks; Reset clears."],
  },
  rcDaily: {
    rules: ["Read the passage, then answer all questions.", "Choose options that are supported by the text only."],
    examples: ["If the passage says it is not against markets, pick a qualified tone."],
    scoring: ["All correct earns 100 points.", "Partial credit up to 60 on submit."],
    shortcuts: ["Select options and Submit.", "Reset starts over."],
  },
  twoLineSummary: {
    rules: [
      "Write a two sentence summary within the word range.",
      "Include the required keywords and avoid new ideas.",
    ],
    examples: ["Keep thesis plus one key support; avoid extra details."],
    scoring: ["100 if word count and keywords match.", "Partial score scales with word count and missing keywords."],
    shortcuts: ["Type the summary, then Submit.", "Edit lets you revise."],
  },
  paraJumble: {
    rules: ["Reorder sentences to form a coherent paragraph."],
    examples: ["Start with context, then cause -> effect -> implication."],
    scoring: ["Correct order earns 100 points.", "Partial credit for correct prefix order."],
    shortcuts: ["Drag and drop or use arrow buttons.", "Alt+Up/Down reorders focused sentence."],
  },
  paraSummary: {
    rules: ["Pick the option that best summarizes the passage.", "Reject extremes and unrelated details."],
    examples: ["If an option adds a new claim, it is likely wrong."],
    scoring: ["Correct earns 100 points.", "Incorrect still awards 30 points."],
    shortcuts: ["Click an option and Submit.", "Edit lets you retry."],
  },
  oddSentenceOut: {
    rules: ["Choose the sentence that breaks topic or logic continuity."],
    examples: ["Look for a sudden topic shift or an absolute claim."],
    scoring: ["Correct earns 100 points.", "Incorrect earns 0 points."],
    shortcuts: ["Click a sentence and Submit.", "Clear resets the selection."],
  },
  inferenceJudge: {
    rules: ["Pick the statement that must be true.", "Avoid plausible statements that are not guaranteed."],
    examples: ["If the passage states completion rates rose, that is the must-be-true option."],
    scoring: ["Correct earns 100 points."],
    shortcuts: ["Select an option and Submit.", "Notes are optional."],
  },
  diCaseletTrainer: {
    rules: ["Use the table to answer numeric questions.", "Keep track of units and percent vs absolute values."],
    examples: ["Percent change = (new - old) / old * 100."],
    scoring: ["All correct earns 140 points.", "Partial credit scales with correct answers."],
    shortcuts: ["Enter values and Submit.", "Clear resets answers."],
  },
  setSelectionSimulator: {
    rules: [
      "Scan all sets, shortlist likely winners, then commit to attempts.",
      "Decisions should balance setup cost, computation, and readability.",
    ],
    examples: ["Skip high setup + high computation unless the data is very clear."],
    scoring: ["Score is based on EV of chosen sets with penalties.", "Capped at 160 points."],
    shortcuts: ["Click cards to focus.", "Toggle shortlist, then set decision and reason."],
  },
};

export function getGameHelpContent(gameId: string, fallbackDescription?: string): GameHelpContent {
  const content = GAME_HELP_CONTENT[gameId];
  if (content) return content;
  return {
    rules: fallbackDescription ? [fallbackDescription] : ["Follow the on-screen instructions."],
    examples: ["Try a sample round to learn the inputs."],
    scoring: ["Scores update when a round ends."],
    shortcuts: ["Use taps or clicks; keyboard shortcuts vary by game."],
  };
}
