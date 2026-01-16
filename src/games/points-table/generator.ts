import { pick, sampleUnique } from "../core/generator-utils";
import { makeRng } from "../core/rng";
import { Outcome, PointsTablePuzzle } from "./types";

const basePointsSystem = { win: 3, draw: 1, loss: 0 };

const TEAM_NAMES = [
  "Apex",
  "Bolt",
  "Crest",
  "Drift",
  "Atlas",
  "Blaze",
  "Cobalt",
  "Delta",
  "Echo",
  "Nova",
  "Orion",
  "Pulse",
  "Quark",
  "Rift",
  "Solstice",
  "Zenith",
];

function buildMatches(teamIds: string[]) {
  const matches: PointsTablePuzzle["matches"] = [];
  let id = 1;
  for (let i = 0; i < teamIds.length; i++) {
    for (let j = i + 1; j < teamIds.length; j++) {
      matches.push({ id: `m${id++}`, home: teamIds[i], away: teamIds[j] });
    }
  }
  return matches;
}

function randomOutcome(rng: () => number, difficulty: number): Outcome {
  const roll = rng();
  const drawBias = difficulty <= 1 ? 0.2 : difficulty === 2 ? 0.25 : 0.3;
  if (roll < drawBias) return "D";
  return roll < 0.5 + drawBias / 2 ? "H" : "A";
}

function computeTeamPoints(matches: PointsTablePuzzle["matches"], outcomes: Record<string, Outcome>) {
  const points = new Map<string, number>();
  for (const m of matches) {
    if (!points.has(m.home)) points.set(m.home, 0);
    if (!points.has(m.away)) points.set(m.away, 0);
    const out = outcomes[m.id];
    if (out === "H") {
      points.set(m.home, (points.get(m.home) || 0) + basePointsSystem.win);
    } else if (out === "A") {
      points.set(m.away, (points.get(m.away) || 0) + basePointsSystem.win);
    } else {
      points.set(m.home, (points.get(m.home) || 0) + basePointsSystem.draw);
      points.set(m.away, (points.get(m.away) || 0) + basePointsSystem.draw);
    }
  }
  return points;
}

export function createPuzzle(opts: { seed: number; difficulty: number }): PointsTablePuzzle {
  const rng = makeRng(opts.seed);
  const difficulty = Math.max(1, Math.min(3, opts.difficulty));

  const teamCount = difficulty <= 1 ? 4 : 5;
  const teamNames = sampleUnique(rng, TEAM_NAMES, teamCount);
  const teams = teamNames.map((name, idx) => ({ id: String.fromCharCode(65 + idx), name }));
  const matches = buildMatches(teams.map(t => t.id));

  const solutionOutcomes: Record<string, Outcome> = {};
  for (const m of matches) {
    solutionOutcomes[m.id] = randomOutcome(rng, difficulty);
  }

  const fixedCount = difficulty <= 1 ? 3 : difficulty === 2 ? 4 : 3;
  const fixedOutcomes: Record<string, Outcome> = {};
  const matchIds = matches.map(m => m.id);
  const fixedIds = sampleUnique(rng, matchIds, fixedCount);
  for (const id of fixedIds) {
    fixedOutcomes[id] = solutionOutcomes[id];
  }

  const totalDraws = Object.values(solutionOutcomes).filter(out => out === "D").length;
  const points = computeTeamPoints(matches, solutionOutcomes);
  const pointEntries = Array.from(points.entries());
  const [spotTeamId, spotPoints] = pick(rng, pointEntries);
  const teamNameMap = new Map(teams.map(t => [t.id, t.name]));

  const constraints = [
    "Win = 3 points, Draw = 1 point.",
    `Total draws in the tournament: ${totalDraws}.`,
    `${teamNameMap.get(spotTeamId)} finishes with ${spotPoints} points.`,
  ];

  for (const [mid, out] of Object.entries(fixedOutcomes)) {
    const match = matches.find(m => m.id === mid)!;
    const home = teamNameMap.get(match.home)!;
    const away = teamNameMap.get(match.away)!;
    if (out === "H") constraints.push(`${home} beats ${away}.`);
    else if (out === "A") constraints.push(`${away} beats ${home}.`);
    else constraints.push(`${home} draws with ${away}.`);
  }

  return {
    teams,
    matches,
    pointsSystem: basePointsSystem,
    fixedOutcomes,
    solutionOutcomes,
    constraints,
  };
}
