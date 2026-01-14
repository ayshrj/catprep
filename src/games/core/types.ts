export type GameStatus = "inProgress" | "solved" | "failed";

export type GameModule<Puzzle, State, Action> = {
  id: string;
  title: string;
  section: "dilr" | "qa" | "varc" | "hybrid";
  skillTags: string[];
  description: string;
  difficulties: Array<{ id: number; label: string }>;
  timeLimitSeconds?: number;

  createPuzzle: (opts: { seed: number; difficulty: number }) => Puzzle;
  getInitialState: (puzzle: Puzzle) => State;
  reduce: (state: State, action: Action) => State;
  evaluate: (
    puzzle: Puzzle,
    state: State
  ) => {
    status: GameStatus;

    errors: Array<{ type: string; message: string; meta?: any }>;
    scoreDelta: number;
  };
  getHint?: (puzzle: Puzzle, state: State) => { title: string; body: string };

  Component: React.ComponentType<{
    puzzle: Puzzle;
    state: State;
    dispatch: React.Dispatch<Action>;
  }>;
};

export type GameRegistry = Record<string, GameModule<any, any, any>>;
