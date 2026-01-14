import { GameStatus } from "../core/types";
import { ScheduleConstraint, SchedulingPuzzle, SchedulingState } from "./types";

function indexOfItem(assignment: Array<string | null>, item: string): number {
  return assignment.findIndex(x => x === item);
}

function isAdjacent(i: number, j: number) {
  return Math.abs(i - j) === 1;
}

export function evaluate(puzzle: SchedulingPuzzle, state: SchedulingState) {
  const errors: Array<{ type: string; message: string }> = [];
  const A = state.assignment;

  // duplicates check
  const used = new Map<string, number>();
  for (let i = 0; i < A.length; i++) {
    const v = A[i];
    if (!v) continue;
    used.set(v, (used.get(v) ?? 0) + 1);
  }
  for (const [item, count] of used.entries()) {
    if (count > 1)
      errors.push({
        type: "duplicate",
        message: `"${item}" is assigned multiple times.`,
      });
  }

  // Evaluate constraints only for items that are placed
  const checkConstraint = (c: ScheduleConstraint) => {
    switch (c.type) {
      case "notInSlot": {
        const idx = indexOfItem(A, c.item);
        if (idx === c.slot) return `"${c.item}" cannot be in ${puzzle.slots[c.slot]}.`;
        return null;
      }
      case "inSlot": {
        const idx = indexOfItem(A, c.item);
        if (idx !== -1 && idx !== c.slot) return `"${c.item}" must be in ${puzzle.slots[c.slot]}.`;
        return null;
      }
      case "before": {
        const ia = indexOfItem(A, c.a);
        const ib = indexOfItem(A, c.b);
        if (ia !== -1 && ib !== -1 && ia >= ib) return `"${c.a}" must be before "${c.b}".`;
        return null;
      }
      case "after": {
        const ia = indexOfItem(A, c.a);
        const ib = indexOfItem(A, c.b);
        if (ia !== -1 && ib !== -1 && ia <= ib) return `"${c.a}" must be after "${c.b}".`;
        return null;
      }
      case "adjacent": {
        const ia = indexOfItem(A, c.a);
        const ib = indexOfItem(A, c.b);
        if (ia !== -1 && ib !== -1 && !isAdjacent(ia, ib)) return `"${c.a}" must be adjacent to "${c.b}".`;
        return null;
      }
      case "notAdjacent": {
        const ia = indexOfItem(A, c.a);
        const ib = indexOfItem(A, c.b);
        if (ia !== -1 && ib !== -1 && isAdjacent(ia, ib)) return `"${c.a}" cannot be adjacent to "${c.b}".`;
        return null;
      }
    }
  };

  for (const c of puzzle.constraints) {
    const msg = checkConstraint(c);
    if (msg) errors.push({ type: "constraint", message: msg });
  }

  const allFilled = puzzle.items.every(it => A.includes(it));
  const noNulls = A.every(x => x !== null);

  // solved if all slots filled with unique items AND no errors
  const solved = allFilled && noNulls && errors.length === 0;
  const status: GameStatus = solved ? "solved" : "inProgress";

  return {
    status,
    errors,
    scoreDelta: solved ? 150 : 0,
  };
}
