import { RatioMixerPuzzle, RatioMixerState } from "./types";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getHint(puzzle: RatioMixerPuzzle, _state: RatioMixerState) {
  const ratioA = puzzle.bPercent - puzzle.targetPercent;
  const ratioB = puzzle.targetPercent - puzzle.aPercent;

  return {
    title: "Alligation shortcut",
    body:
      `A:B = (B−T):(T−A) = (${puzzle.bPercent}−${puzzle.targetPercent}):(${puzzle.targetPercent}−${puzzle.aPercent}) ` +
      `= ${ratioA}:${ratioB}. Then %A = ratioA/(ratioA+ratioB).`,
  };
}
