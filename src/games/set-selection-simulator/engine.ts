import { SetSelectionAction, SetSelectionState } from "./types";

export function reduce(state: SetSelectionState, action: SetSelectionAction): SetSelectionState {
  switch (action.type) {
    case "tick": {
      if (state.phase === "done") return state;

      if (state.phase === "scan") {
        const next = Math.max(0, state.scanRemaining - 1);
        if (next === 0) {
          return { ...state, phase: "commit", scanRemaining: 0 };
        }
        return { ...state, scanRemaining: next };
      }

      if (state.phase === "commit") {
        const next = Math.max(0, state.commitRemaining - 1);
        if (next === 0) {
          // auto-finalize at end of commit window
          return {
            ...state,
            phase: "done",
            commitRemaining: 0,
            submitted: true,
          };
        }
        return { ...state, commitRemaining: next };
      }

      return state;
    }

    case "focus":
      return { ...state, focusedSetId: action.setId };

    case "toggleShortlist": {
      if (state.phase !== "scan") return state;
      const cur = !!state.shortlisted[action.setId];
      return {
        ...state,
        shortlisted: { ...state.shortlisted, [action.setId]: !cur },
      };
    }

    case "startCommit":
      if (state.phase !== "scan") return state;
      return { ...state, phase: "commit", scanRemaining: state.scanRemaining };

    case "setDecision": {
      if (state.phase !== "commit") return state;
      const prev = state.decisions[action.setId] ?? {
        decision: "later",
        reason: "",
      };
      return {
        ...state,
        decisions: {
          ...state.decisions,
          [action.setId]: { ...prev, decision: action.decision },
        },
      };
    }

    case "setReason": {
      if (state.phase !== "commit") return state;
      const prev = state.decisions[action.setId] ?? {
        decision: "later",
        reason: "",
      };
      return {
        ...state,
        decisions: {
          ...state.decisions,
          [action.setId]: { ...prev, reason: action.reason },
        },
      };
    }

    case "finalize":
      return { ...state, phase: "done", submitted: true };

    case "__RESET__":
      return action.newState;

    default:
      return state;
  }
}
