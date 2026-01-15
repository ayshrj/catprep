"use client";
import { useEffect, useMemo, useReducer, useState } from "react";

import gameRegistry from "./registry";
import {
  clearGameSession,
  fetchCloudGameData,
  getGameSession,
  getGameStats,
  setGameSession,
  setGameStats,
} from "./storage";

export function useGameSession(gameId: string, initialDifficulty: number = 1) {
  const gameModule = gameRegistry[gameId];

  const [initialized, setInitialized] = useState(false);

  // Seed with a placeholder puzzle/state; real data is loaded (and hydrated from cloud) in an effect below.
  const [puzzle, setPuzzle] = useState(() =>
    gameModule.createPuzzle({ seed: Date.now(), difficulty: initialDifficulty })
  );
  const [state, dispatch] = useReducer(gameModule.reduce, gameModule.getInitialState(puzzle));
  const [stats, setStats] = useState(() => getGameStats(gameId));
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Initialize session from local storage, then hydrate from cloud if enabled.
  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      const localSession = getGameSession(gameId);
      const localStats = getGameStats(gameId);

      const cloud = await fetchCloudGameData(gameId);
      const session = cloud?.session ?? localSession;
      const baseStats = cloud?.stats ?? localStats;

      let workingSession = session;
      const workingStats = { ...baseStats };

      if (!workingSession) {
        const seed = Date.now();
        const newPuzzle = gameModule.createPuzzle({ seed, difficulty: initialDifficulty });
        const newState = gameModule.getInitialState(newPuzzle);
        workingSession = { puzzle: newPuzzle, state: newState };
        workingStats.attempts += 1;
      }

      workingStats.lastPlayedAt = new Date().toISOString();
      setGameSession(gameId, workingSession, { skipCloud: Boolean(cloud?.session) });
      setGameStats(gameId, workingStats, { skipCloud: Boolean(cloud?.stats) });

      if (cancelled) return;

      setPuzzle(workingSession.puzzle);
      dispatch({ type: "__RESET__", newState: workingSession.state } as any);
      setStats(workingStats);
      setElapsedSeconds(0);
      setInitialized(true);
    };

    void initialize();

    return () => {
      cancelled = true;
    };
  }, [gameId, gameModule, initialDifficulty]);

  // Evaluate puzzle state on each change
  const evaluation = useMemo(() => gameModule.evaluate(puzzle, state), [gameModule, puzzle, state]);

  // Persist session state on each change
  useEffect(() => {
    if (!initialized) return;
    setGameSession(gameId, { puzzle, state });
  }, [gameId, initialized, puzzle, state]);

  // Timer effect: start/stop interval based on game status
  useEffect(() => {
    if (!initialized) return;
    let timerId: any;
    if (evaluation.status === "inProgress") {
      timerId = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [evaluation.status, initialized, puzzle]);

  // Handle end-of-game events (solved or failed) to update stats
  useEffect(() => {
    if (!initialized) return;
    if (evaluation.status === "solved" || evaluation.status === "failed") {
      const newStats = { ...stats };
      if (evaluation.status === "solved") {
        newStats.solves += 1;
        // Update streak count
        const today = new Date().toDateString();
        if (newStats.lastSolvedDate) {
          const last = new Date(newStats.lastSolvedDate).toDateString();
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          if (last === yesterday.toDateString()) {
            newStats.streakDays = (newStats.streakDays || 0) + 1;
          } else if (last !== today) {
            newStats.streakDays = 1;
          }
        } else {
          newStats.streakDays = 1;
        }
        newStats.lastSolvedDate = today;
        // Update best time if this solve is fastest
        if (newStats.bestTimeSeconds === null || elapsedSeconds < newStats.bestTimeSeconds) {
          newStats.bestTimeSeconds = elapsedSeconds;
        }
      }
      newStats.lastPlayedAt = new Date().toISOString();
      setStats(newStats);
      setGameStats(gameId, newStats);
      clearGameSession(gameId); // clear session storage as puzzle is complete
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evaluation.status, initialized]);

  // Start a new puzzle (optionally with a different difficulty)
  const startNewPuzzle = (newDifficulty?: number) => {
    if (!initialized) return;
    const difficulty = newDifficulty ?? gameModule.difficulties[0].id;
    const seed = Date.now();
    const newPuzzle = gameModule.createPuzzle({ seed, difficulty });
    const newState = gameModule.getInitialState(newPuzzle);
    // Update stats for a new attempt
    const updatedStats = { ...stats };
    updatedStats.attempts += 1;
    updatedStats.lastPlayedAt = new Date().toISOString();
    setStats(updatedStats);
    setGameStats(gameId, updatedStats);
    // Initialize new puzzle session
    setPuzzle(newPuzzle);
    setElapsedSeconds(0);

    dispatch({ type: "__RESET__", newState } as any);
    setGameSession(gameId, { puzzle: newPuzzle, state: newState });
  };

  // Reset current puzzle to its initial state (without counting a new attempt)
  const resetPuzzle = () => {
    if (!initialized) return;
    const newState = gameModule.getInitialState(puzzle);

    dispatch({ type: "__RESET__", newState } as any);
    setGameSession(gameId, { puzzle, state: newState });
    setElapsedSeconds(0);
  };

  return {
    puzzle,
    state,
    dispatch,
    evaluation,
    stats,
    elapsedSeconds,
    startNewPuzzle,
    resetPuzzle,
  };
}
