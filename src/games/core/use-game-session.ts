"use client";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";

import { LLM_FALLBACK_TO_LOCAL, shouldUseLlmGeneration } from "./game-generation";
import { fetchLlmPuzzle } from "./puzzle-api";
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const generationAbortRef = useRef<AbortController | null>(null);

  // Seed with a placeholder puzzle/state; real data is loaded (and hydrated from cloud) in an effect below.
  const [puzzle, setPuzzle] = useState(() =>
    gameModule.createPuzzle({ seed: Date.now(), difficulty: initialDifficulty })
  );
  const [state, dispatch] = useReducer(gameModule.reduce, gameModule.getInitialState(puzzle));
  const [stats, setStats] = useState(() => getGameStats(gameId));
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const createLocalPuzzle = useCallback(
    (difficulty: number) => {
      const seed = Date.now();
      const newPuzzle = gameModule.createPuzzle({ seed, difficulty });
      const newState = gameModule.getInitialState(newPuzzle);
      return { puzzle: newPuzzle, state: newState };
    },
    [gameModule]
  );

  const generatePuzzle = useCallback(
    async (difficulty: number) => {
      if (!shouldUseLlmGeneration(gameId)) {
        generationAbortRef.current?.abort();
        setIsGenerating(false);
        setGenerationError(null);
        return { ...createLocalPuzzle(difficulty), source: "local" as const };
      }

      generationAbortRef.current?.abort();
      const controller = new AbortController();
      generationAbortRef.current = controller;

      setIsGenerating(true);
      setGenerationError(null);

      try {
        const data = await fetchLlmPuzzle(gameId, difficulty, controller.signal);
        if (controller.signal.aborted) return null;
        const newPuzzle = data.puzzle;
        return {
          puzzle: newPuzzle,
          state: gameModule.getInitialState(newPuzzle),
          source: "llm" as const,
        };
      } catch (error) {
        if (controller.signal.aborted) return null;
        const message = error instanceof Error ? error.message : "Failed to generate puzzle.";
        if (LLM_FALLBACK_TO_LOCAL) {
          setGenerationError(`${message} Using a local puzzle for now.`);
          return { ...createLocalPuzzle(difficulty), source: "local" as const };
        }
        setGenerationError(message);
        return null;
      } finally {
        if (generationAbortRef.current === controller) {
          generationAbortRef.current = null;
          setIsGenerating(false);
        }
      }
    },
    [createLocalPuzzle, gameId, gameModule]
  );

  // Initialize session from local storage, then hydrate from cloud if enabled.
  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      setInitialized(false);
      setIsGenerating(false);
      setGenerationError(null);

      const localSession = getGameSession(gameId);
      const localStats = getGameStats(gameId);

      const cloud = await fetchCloudGameData(gameId);
      const session = cloud?.session ?? localSession;
      const baseStats = cloud?.stats ?? localStats;

      let workingSession = session;
      const workingStats = { ...baseStats };

      if (!workingSession) {
        const generated = await generatePuzzle(initialDifficulty);
        if (cancelled || !generated) return;
        workingSession = { puzzle: generated.puzzle, state: generated.state };
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
      generationAbortRef.current?.abort();
    };
  }, [gameId, generatePuzzle, initialDifficulty]);

  // Evaluate puzzle state on each change
  const evaluation = useMemo(() => gameModule.evaluate(puzzle, state), [gameModule, puzzle, state]);

  // Persist session state on each change
  useEffect(() => {
    if (!initialized || isGenerating) return;
    setGameSession(gameId, { puzzle, state });
  }, [gameId, initialized, isGenerating, puzzle, state]);

  // Timer effect: start/stop interval based on game status
  useEffect(() => {
    if (!initialized || isGenerating) return;
    let timerId: any;
    if (evaluation.status === "inProgress") {
      timerId = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [evaluation.status, initialized, isGenerating, puzzle]);

  // Handle end-of-game events (solved or failed) to update stats
  useEffect(() => {
    if (!initialized || isGenerating) return;
    if (evaluation.status !== "solved" && evaluation.status !== "failed") return;

    setStats(prev => {
      const newStats = { ...prev };
      if (evaluation.status === "solved") {
        newStats.solves += 1;
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
        if (newStats.bestTimeSeconds === null || elapsedSeconds < newStats.bestTimeSeconds) {
          newStats.bestTimeSeconds = elapsedSeconds;
        }
      }
      newStats.lastPlayedAt = new Date().toISOString();
      setGameStats(gameId, newStats);
      return newStats;
    });
    clearGameSession(gameId);
  }, [elapsedSeconds, evaluation.status, gameId, initialized, isGenerating]);

  // Start a new puzzle (optionally with a different difficulty)
  const startNewPuzzle = async (newDifficulty?: number) => {
    if (!initialized) return;
    const difficulty = newDifficulty ?? gameModule.difficulties[0].id;
    const generated = await generatePuzzle(difficulty);
    if (!generated) return;
    // Update stats for a new attempt
    const updatedStats = { ...stats };
    updatedStats.attempts += 1;
    updatedStats.lastPlayedAt = new Date().toISOString();
    setStats(updatedStats);
    setGameStats(gameId, updatedStats);
    // Initialize new puzzle session
    setPuzzle(generated.puzzle);
    setElapsedSeconds(0);

    dispatch({ type: "__RESET__", newState: generated.state } as any);
    setGameSession(gameId, { puzzle: generated.puzzle, state: generated.state });
  };

  // Reset current puzzle to its initial state (without counting a new attempt)
  const resetPuzzle = () => {
    if (!initialized || isGenerating) return;
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
    initialized,
    isGenerating,
    generationError,
    startNewPuzzle,
    resetPuzzle,
  };
}
