import { LogicGridPuzzle, LogicGridState } from "./types";

export function getHint(puzzle: LogicGridPuzzle, state: LogicGridState) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { r, c } = state.selected;
  const correctCol = puzzle.solution[r];
  const rowName = puzzle.rowCategory.items[r];
  const colName = puzzle.colCategory.items[correctCol];

  return {
    title: "Hint: Lock one match",
    body: `For "${rowName}", the correct match is "${colName}". Mark that cell as YES and eliminate others in the row/column.`,
  };
}
