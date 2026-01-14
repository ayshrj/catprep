export type ScheduleConstraint =
  | { type: "notInSlot"; item: string; slot: number }
  | { type: "inSlot"; item: string; slot: number }
  | { type: "before"; a: string; b: string }
  | { type: "after"; a: string; b: string }
  | { type: "notAdjacent"; a: string; b: string }
  | { type: "adjacent"; a: string; b: string };

export type SchedulingPuzzle = {
  slots: string[]; // ordered slots
  items: string[]; // unique items
  constraints: ScheduleConstraint[];
  solution: string[]; // assignment by slot index -> item
};

export type SchedulingState = {
  selectedSlot: number;
  assignment: Array<string | null>; // length = slots
  notes: string;
};

export type SchedulingAction =
  | { type: "selectSlot"; slot: number }
  | { type: "setSlot"; slot: number; item: string | null }
  | { type: "setNotes"; notes: string }
  | { type: "__RESET__"; newState: SchedulingState };
