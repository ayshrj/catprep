import { SchedulingPuzzle, SchedulingState } from "./types";

export function getHint(puzzle: SchedulingPuzzle, state: SchedulingState) {
  const slot = state.selectedSlot;
  const correct = puzzle.solution[slot];

  return {
    title: "Hint: Fix one slot",
    body: `In the hidden solution, ${puzzle.slots[slot]} is "${correct}". Use constraints to justify before committing.`,
  };
}
