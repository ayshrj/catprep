export function randInt(rng: () => number, min: number, max: number): number {
  if (max < min) [min, max] = [max, min];
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function pick<T>(rng: () => number, list: T[]): T {
  if (list.length === 0) {
    throw new Error("Cannot pick from an empty list.");
  }
  return list[randInt(rng, 0, list.length - 1)];
}

export function shuffle<T>(rng: () => number, list: T[]): T[] {
  const arr = list.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function sampleUnique<T>(rng: () => number, list: T[], count: number): T[] {
  if (count <= 0) return [];
  if (count >= list.length) return shuffle(rng, list);
  return shuffle(rng, list).slice(0, count);
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function makeId(rng: () => number, prefix: string): string {
  return `${prefix}-${Math.floor(rng() * 1_000_000_000)}`;
}
