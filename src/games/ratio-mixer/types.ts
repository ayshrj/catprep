export type RatioMixerPuzzle = {
  id: string;
  scenario: string;
  aPercent: number; // concentration of A (e.g., 20)
  bPercent: number; // concentration of B (e.g., 50)
  targetPercent: number; // desired concentration (e.g., 35)
  correctPercentA: number; // expected percent of A in final mix (0..100)
  tolerancePct: number; // acceptable absolute deviation in percent points
  explanation: string;
};

export type RatioMixerState = {
  percentA: number; // 0..100 chosen by user
  submitted: boolean;
  lastSubmittedAt?: number;
};

export type RatioMixerAction =
  | { type: "setPercentA"; value: number }
  | { type: "nudgePercentA"; delta: number }
  | { type: "submit" }
  | { type: "reset" }
  | { type: "__RESET__"; newState: RatioMixerState };
