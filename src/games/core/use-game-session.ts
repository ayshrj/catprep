"use client";
import { useEffect, useMemo, useReducer, useState } from "react";

import gameRegistry from "./registry";
import { clearGameSession, getGameSession, getGameStats, setGameSession, setGameStats } from "./storage";

export function useGameSession(gameId: string, initialDifficulty: number = 1) {
  const gameModule = gameRegistry[gameId];

  // Load any existing session from storage
  const storedSession = typeof window !== "undefined" ? getGameSession(gameId) : null;
  const initialStats = typeof window !== "undefined" ? getGameStats(gameId) : getGameStats(gameId);

  // Initialize puzzle and state (either resume from stored session or start new)
  const initialPuzzle = storedSession?.puzzle
    ? storedSession.puzzle
    : gameModule.createPuzzle({ seed: Date.now(), difficulty: initialDifficulty });
  const initialState = storedSession?.state ? storedSession.state : gameModule.getInitialState(initialPuzzle);

  // If starting a new attempt, increment attempts and save initial session
  if (!storedSession) {
    initialStats.attempts += 1;
    initialStats.lastPlayedAt = new Date().toISOString();
    setGameStats(gameId, initialStats);
    setGameSession(gameId, { puzzle: initialPuzzle, state: initialState });
  } else {
    // Mark last played time for resumed session
    initialStats.lastPlayedAt = new Date().toISOString();
    setGameStats(gameId, initialStats);
  }

  const [puzzle, setPuzzle] = useState(initialPuzzle);
  const [state, dispatch] = useReducer(gameModule.reduce, initialState);
  const [stats, setStats] = useState(initialStats);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Evaluate puzzle state on each change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const evaluation = useMemo(() => gameModule.evaluate(puzzle, state), [puzzle, state]);

  // Persist session state on each change
  useEffect(() => {
    setGameSession(gameId, { puzzle, state });
  }, [gameId, puzzle, state]);

  // Timer effect: start/stop interval based on game status
  useEffect(() => {
    let timerId: any;
    if (evaluation.status === "inProgress") {
      timerId = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [evaluation.status, puzzle]);

  // Handle end-of-game events (solved or failed) to update stats
  useEffect(() => {
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
  }, [evaluation.status]);

  // Start a new puzzle (optionally with a different difficulty)
  const startNewPuzzle = (newDifficulty?: number) => {
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
