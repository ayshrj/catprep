import { TwentyFourAction, TwentyFourState } from "./types";

export function reduce(state: TwentyFourState, action: TwentyFourAction): TwentyFourState {
  switch (action.type) {
    case "selectNumber": {
      const idx = action.index;
      if (state.firstIndex === null) {
        return { ...state, firstIndex: idx };
      }
      if (state.firstIndex !== null && state.operator === null) {
        return { ...state, firstIndex: idx }; // change first selection
      }
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
      const op = action.operator;
      if (state.firstIndex === null) return state;
      return { ...state, operator: op };
    }
    case "applyStep": {
      const { firstIndex, secondIndex, operator } = state;
      if (firstIndex === null || secondIndex === null || operator === null) {
        return state;
      }
      const nums = state.currentNumbers;
      const a = nums[firstIndex],
        b = nums[secondIndex];
      let result: number;
      switch (operator) {
        case "+":
          result = a + b;
          break;
        case "-":
          result = a - b;
          break;
        case "*":
        case "x":
          result = a * b;
          break;
        case "/":
          if (b === 0) {
            // cannot divide by zero -> clear operator and second selection
            return { ...state, operator: null, secondIndex: null };
          }
          result = a / b;
          break;
        default:
          return state;
      }
      // Remove the two used numbers and append the result as a new number
      const newNumbers = nums.filter((_, i) => i !== firstIndex && i !== secondIndex);
      newNumbers.push(result);
      return {
        ...state,
        currentNumbers: newNumbers,
        firstIndex: null,
        secondIndex: null,
        operator: null,
      };
    }
    case "resetExpression": {
      return {
        ...state,
        currentNumbers: [...state.originalNumbers],
        firstIndex: null,
        secondIndex: null,
        operator: null,
      };
    }
    case "__RESET__": {
      return action.newState;
    }
    default:
      return state;
  }
}
