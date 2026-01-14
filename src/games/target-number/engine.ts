import { TargetNumberAction, TargetNumberState } from "./types";

export function reduce(state: TargetNumberState, action: TargetNumberAction): TargetNumberState {
  switch (action.type) {
    case "selectNumber": {
      const idx = action.index;

      if (state.firstIndex === null) return { ...state, firstIndex: idx };
      if (state.firstIndex !== null && state.operator === null) return { ...state, firstIndex: idx };
      if (state.firstIndex !== null && state.operator !== null && state.secondIndex === null) {
        if (idx === state.firstIndex) return state;
        return { ...state, secondIndex: idx };
      }
      if (state.firstIndex !== null && state.operator !== null && state.secondIndex !== null) {
        if (idx === state.firstIndex) return state;
        return { ...state, secondIndex: idx };
      }
      return state;
    }

    case "selectOperator": {
      if (state.firstIndex === null) return state;
      return { ...state, operator: action.operator };
    }

    case "applyStep": {
      const { firstIndex, secondIndex, operator } = state;
      if (firstIndex === null || secondIndex === null || !operator) return state;

      const nums = state.currentNumbers;
      const a = nums[firstIndex];
      const b = nums[secondIndex];

      let result: number | null = null;
      let opSym = operator;

      switch (operator) {
        case "+":
          result = a + b;
          break;
        case "-":
          result = a - b;
          break;
        case "*":
        case "x":
          opSym = "*";
          result = a * b;
          break;
        case "/":
          if (b === 0) return { ...state, operator: null, secondIndex: null };
          result = a / b;
          break;
        default:
          return state;
      }

      const remaining = nums.filter((_, i) => i !== firstIndex && i !== secondIndex);
      remaining.push(result);

      const step = `${a} ${opSym} ${b} = ${Number.isInteger(result) ? result : result.toFixed(3)}`;
      return {
        ...state,
        currentNumbers: remaining,
        firstIndex: null,
        secondIndex: null,
        operator: null,
        steps: [...state.steps, step],
      };
    }

    case "reset":
      return {
        ...state,
        currentNumbers: [...state.originalNumbers],
        firstIndex: null,
        secondIndex: null,
        operator: null,
        steps: [],
      };

    case "__RESET__":
      return action.newState;

    default:
      return state;
  }
}
