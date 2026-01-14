import { SchedulingAction, SchedulingState } from "./types";

export function reduce(state: SchedulingState, action: SchedulingAction): SchedulingState {
  switch (action.type) {
    case "selectSlot":
      return { ...state, selectedSlot: action.slot };

    case "setSlot": {
      const assignment = state.assignment.slice();
      assignment[action.slot] = action.item;
      return { ...state, assignment };
    }

    case "setNotes":
      return { ...state, notes: action.notes };

    case "__RESET__":
      return action.newState;

    default:
      return state;
  }
}
