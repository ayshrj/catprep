import { pick, randInt } from "../core/generator-utils";
import { makeRng } from "../core/rng";
import { RoutesPuzzle } from "./types";

type Layer = string[];

function buildLayers(difficulty: number): number[] {
  if (difficulty <= 1) return [1, 2, 2, 1];
  if (difficulty === 2) return [1, 2, 3, 2, 1];
  return [1, 3, 3, 3, 1];
}

function nodeIdFromIndex(idx: number): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (idx < alphabet.length) return alphabet[idx];
  return `N${idx + 1}`;
}

function generateNodes(rng: () => number, layerSizes: number[]) {
  const layers: Layer[] = [];
  const nodes: RoutesPuzzle["nodes"] = [];
  let nodeIndex = 0;

  const totalLayers = layerSizes.length;
  for (let l = 0; l < totalLayers; l++) {
    const count = layerSizes[l];
    const layer: string[] = [];
    const xBase = (l / (totalLayers - 1)) * 100;
    const yStep = count === 1 ? 0 : 60 / (count - 1);
    for (let i = 0; i < count; i++) {
      const id = nodeIdFromIndex(nodeIndex++);
      layer.push(id);
      const jitterX = randInt(rng, -3, 3);
      const jitterY = randInt(rng, -4, 4);
      const yBase = count === 1 ? 50 : 20 + i * yStep;
      nodes.push({
        id,
        label: id,
        x: Math.max(5, Math.min(95, xBase + jitterX)),
        y: Math.max(8, Math.min(92, yBase + jitterY)),
      });
    }
    layers.push(layer);
  }

  return { layers, nodes };
}

function addEdge(edges: RoutesPuzzle["edges"], used: Set<string>, from: string, to: string, cost: number) {
  const key = [from, to].sort().join("-");
  if (used.has(key)) return;
  used.add(key);
  edges.push({ from, to, cost });
}

function buildGraph(rng: () => number, difficulty: number): RoutesPuzzle {
  const layersConfig = buildLayers(difficulty);
  const { layers, nodes } = generateNodes(rng, layersConfig);
  const edges: RoutesPuzzle["edges"] = [];
  const used = new Set<string>();

  const path: string[] = [];
  for (const layer of layers) {
    path.push(pick(rng, layer));
  }

  const costMin = difficulty <= 1 ? 2 : difficulty === 2 ? 3 : 4;
  const costMax = difficulty <= 1 ? 8 : difficulty === 2 ? 10 : 12;
  let targetCost = 0;

  for (let i = 0; i < path.length - 1; i++) {
    const cost = randInt(rng, costMin, costMax);
    addEdge(edges, used, path[i], path[i + 1], cost);
    targetCost += cost;
  }

  for (let l = 0; l < layers.length - 1; l++) {
    const left = layers[l];
    const right = layers[l + 1];
    for (const a of left) {
      const connections = randInt(rng, 1, Math.min(2, right.length));
      const picks = new Set<string>([path[l + 1]]);
      while (picks.size < connections) {
        picks.add(pick(rng, right));
      }
      for (const b of picks) {
        addEdge(edges, used, a, b, randInt(rng, costMin, costMax));
      }
    }
  }

  const start = path[0];
  const end = path[path.length - 1];
  const constraints = [
    "Build any valid path from Start to End with total cost exactly equal to Target.",
    "Use remaining-cost pruning instead of brute force.",
    difficulty === 3 ? "Hard: more nodes, more branch choices." : "Keep a running total as you extend the path.",
  ];

  return {
    nodes,
    edges,
    start,
    end,
    targetCost,
    constraints,
    solutionPath: path,
  };
}

export function createPuzzle(opts: { seed: number; difficulty: number }): RoutesPuzzle {
  const rng = makeRng(opts.seed);
  const difficulty = Math.max(1, Math.min(3, opts.difficulty));
  return buildGraph(rng, difficulty);
}
