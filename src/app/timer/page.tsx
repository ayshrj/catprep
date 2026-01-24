"use client";

import { Flag, Pause, Play, RotateCcw, Timer } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { APP_CONTENT_HEIGHT, AppContent } from "@/components/app-content";
import { AppNavbar } from "@/components/app-navbar";
import { AppNavbarActions } from "@/components/app-navbar-actions";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuthAndTheme } from "@/hooks/use-auth-and-theme";
import { cn } from "@/lib/utils";

type Lap = {
  id: string;
  index: number;
  totalMs: number;
  deltaMs: number;
};

const formatClockParts = (ms: number) => {
  const safeMs = Math.max(ms, 0);
  const totalSeconds = Math.floor(safeMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutesTotal = Math.floor(totalSeconds / 60);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const centis = Math.floor((safeMs % 1000) / 10);

  const main =
    hours > 0
      ? `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
          .toString()
          .padStart(2, "0")}`
      : `${minutesTotal.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  return { main, centis: centis.toString().padStart(2, "0") };
};

const formatCompact = (ms: number) => {
  const safeMs = Math.max(ms, 0);
  const totalSeconds = Math.floor(safeMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const centis = Math.floor((safeMs % 1000) / 10);

  const main =
    hours > 0
      ? `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
          .toString()
          .padStart(2, "0")}`
      : `${Math.floor(totalSeconds / 60)
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  return `${main}.${centis.toString().padStart(2, "0")}`;
};

export default function TimerPage() {
  const { handleLogout, handleThemeToggle } = useAuthAndTheme();
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [laps, setLaps] = useState<Lap[]>([]);
  const rafRef = useRef<number | null>(null);
  const runningSinceRef = useRef<number | null>(null);
  const accumulatedMsRef = useRef(0);

  const getCurrentMs = useCallback(() => {
    if (runningSinceRef.current === null) {
      return accumulatedMsRef.current;
    }
    return accumulatedMsRef.current + (performance.now() - runningSinceRef.current);
  }, []);

  const tick = useCallback(
    (now: number) => {
      if (runningSinceRef.current === null) return;
      const next = accumulatedMsRef.current + (now - runningSinceRef.current);
      setElapsedMs(next);
      rafRef.current = requestAnimationFrame(tick);
    },
    [setElapsedMs]
  );

  const start = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);
    runningSinceRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
  }, [isRunning, tick]);

  const pause = useCallback(() => {
    if (!isRunning) return;
    const now = performance.now();
    const next = accumulatedMsRef.current + (now - (runningSinceRef.current ?? now));
    accumulatedMsRef.current = next;
    runningSinceRef.current = null;
    setElapsedMs(next);
    setIsRunning(false);
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, [isRunning]);

  const toggleRun = useCallback(() => {
    if (isRunning) {
      pause();
    } else {
      start();
    }
  }, [isRunning, pause, start]);

  const reset = useCallback(() => {
    accumulatedMsRef.current = 0;
    runningSinceRef.current = isRunning ? performance.now() : null;
    setElapsedMs(0);
    setLaps([]);
  }, [isRunning]);

  const clearLaps = useCallback(() => {
    setLaps([]);
  }, []);

  const handleLap = useCallback(() => {
    const currentMs = getCurrentMs();
    if (currentMs <= 0) return;
    setLaps(prev => {
      const previousTotal = prev[0]?.totalMs ?? 0;
      const nextLap: Lap = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        index: prev.length + 1,
        totalMs: currentMs,
        deltaMs: currentMs - previousTotal,
      };
      return [nextLap, ...prev];
    });
  }, [getCurrentMs]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || target?.isContentEditable) return;

      if (event.code === "Space") {
        event.preventDefault();
        toggleRun();
      } else if (event.key.toLowerCase() === "r") {
        event.preventDefault();
        reset();
      } else if (event.key.toLowerCase() === "l") {
        event.preventDefault();
        handleLap();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleLap, reset, toggleRun]);

  const timeParts = useMemo(() => formatClockParts(elapsedMs), [elapsedMs]);
  const statusLabel = isRunning ? "Running" : elapsedMs > 0 ? "Paused" : "Ready";

  const lapStats = useMemo(() => {
    if (!laps.length) return null;
    return laps.reduce(
      (acc, lap) => {
        const nextTotal = acc.total + lap.deltaMs;
        return {
          total: nextTotal,
          fastest: lap.deltaMs < acc.fastest.deltaMs ? lap : acc.fastest,
          slowest: lap.deltaMs > acc.slowest.deltaMs ? lap : acc.slowest,
        };
      },
      { total: 0, fastest: laps[0], slowest: laps[0] }
    );
  }, [laps]);

  const averageLap = lapStats ? lapStats.total / laps.length : null;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <AppNavbar
        title="Cat99"
        subtitle="Timer"
        trailing={
          <AppNavbarActions
            value="timer"
            onChange={next => {
              if (next === "chat") {
                window.location.href = "/chat";
              } else if (next === "notes") {
                window.location.href = "/notes";
              } else if (next === "saved") {
                window.location.href = "/rough-notes";
              } else if (next === "games") {
                window.location.href = "/games";
              } else if (next === "papers") {
                window.location.href = "/papers";
              } else if (next === "timer") {
                window.location.href = "/timer";
              }
            }}
            onLogout={handleLogout}
            onThemeToggle={handleThemeToggle}
          />
        }
      />

      <AppContent className={APP_CONTENT_HEIGHT}>
        <div className="h-full min-h-0 overflow-y-auto py-3 sm:py-4">
          <div className="space-y-6 pb-6">
            <section className="game-panel relative overflow-hidden">
              <div className="relative game-panel-padded space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="game-chip">Focus timer</span>
                      <span className="flex items-center gap-1">
                        <Timer className="h-3.5 w-3.5" />
                        {statusLabel}
                      </span>
                    </div>
                    <h1 className="text-xl font-semibold tracking-tight">Keep time without distractions.</h1>
                    <p className="max-w-2xl text-sm text-muted-foreground">
                      Big display, space bar controls, and quick laps to track sprints.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="game-kbd">Space</span>
                    <span>play/pause</span>
                    <span className="game-kbd">L</span>
                    <span>lap</span>
                    <span className="game-kbd">R</span>
                    <span>reset</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="game-panel">
                <div className="game-panel-padded space-y-6">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={toggleRun}
                    onKeyDown={event => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        toggleRun();
                      }
                    }}
                    className={cn(
                      "rounded-2xl border border-border/60 bg-background px-4 py-6 text-center shadow-sm transition",
                      "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    )}
                  >
                    <div className="text-5xl font-semibold tabular-nums tracking-tight sm:text-7xl lg:text-8xl">
                      {timeParts.main}
                    </div>
                    <div className="mt-2 text-lg font-medium tabular-nums text-muted-foreground">
                      .{timeParts.centis}
                    </div>
                    <div className="mt-3 text-xs text-muted-foreground">Tap to {isRunning ? "pause" : "start"}.</div>
                  </div>

                  <div className="game-action-row">
                    <Button size="lg" onClick={toggleRun} className="min-w-[140px]">
                      {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      {isRunning ? "Pause" : "Start"}
                    </Button>
                    <Button size="lg" variant="secondary" onClick={handleLap} disabled={elapsedMs <= 0}>
                      <Flag className="h-4 w-4" />
                      Lap
                    </Button>
                    <Button size="lg" variant="outline" onClick={reset} disabled={elapsedMs <= 0}>
                      <RotateCcw className="h-4 w-4" />
                      Reset
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="game-panel">
                  <div className="game-panel-padded space-y-3">
                    <div className="game-panel-title">Session stats</div>
                    <div className="grid gap-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Total time</span>
                        <span className="tabular-nums">{formatCompact(elapsedMs)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Laps</span>
                        <span>{laps.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Average lap</span>
                        <span className="tabular-nums">{averageLap ? formatCompact(averageLap) : "—"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Fastest lap</span>
                        <span className="tabular-nums">{lapStats ? formatCompact(lapStats.fastest.deltaMs) : "—"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Slowest lap</span>
                        <span className="tabular-nums">{lapStats ? formatCompact(lapStats.slowest.deltaMs) : "—"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="game-panel">
                  <div className="game-panel-padded space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="game-panel-title">Laps</div>
                      <Button size="sm" variant="ghost" onClick={clearLaps} disabled={!laps.length}>
                        Clear
                      </Button>
                    </div>
                    <Separator className="bg-border/60" />
                    {laps.length ? (
                      <ScrollArea className="h-60 pr-3">
                        <div className="space-y-2 text-sm">
                          {laps.map(lap => (
                            <div key={lap.id} className="rounded-2xl border border-border/60 bg-background px-3 py-2">
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Lap {lap.index}</span>
                                <span className="tabular-nums">{formatCompact(lap.totalMs)}</span>
                              </div>
                              <div className="mt-1 flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">Split</span>
                                <span className="tabular-nums font-medium">{formatCompact(lap.deltaMs)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <div className="text-sm text-muted-foreground">No laps yet. Press L to add one.</div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </AppContent>
    </div>
  );
}
