export type Node = { id: string; label: string; x: number; y: number };

export type Edge = { from: string; to: string; cost: number };

export type RoutesPuzzle = {
  nodes: Node[];
  edges: Edge[]; // undirected for this MVP
  start: string;
  end: string;
  targetCost: number;
  constraints: string[];
  solutionPath: string[]; // for hints
};

export type RoutesState = {
  path: string[]; // sequence of nodeIds
};

export type RoutesAction =
  | { type: "appendNode"; nodeId: string }
  | { type: "popNode" }
  | { type: "clearPath" }
  | { type: "__RESET__"; newState: RoutesState };
