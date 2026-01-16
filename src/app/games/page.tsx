"use client";

import { SelectValue } from "@radix-ui/react-select";
import { Calendar, Search, Sparkles, Target, Trophy, Zap } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

import { APP_CONTENT_HEIGHT, AppContent } from "@/components/app-content";
import { AppNavbar } from "@/components/app-navbar";
import { AppNavbarActions } from "@/components/app-navbar-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import gameRegistry from "@/games/core/registry";
import { fetchCloudGameData, getGameStats } from "@/games/core/storage";
import { formatTime } from "@/games/core/timer";
import { useAuthAndTheme } from "@/hooks/use-auth-and-theme";

const ALL = "__all__";

const sectionConfig = {
  dilr: { label: "DILR", variant: "default" as const },
  qa: { label: "QA", variant: "secondary" as const },
  varc: { label: "VARC", variant: "outline" as const },
  hybrid: { label: "Hybrid", variant: "destructive" as const },
};

export default function DashboardPage() {
  const { handleLogout, handleThemeToggle } = useAuthAndTheme();
  const allGames = useMemo(() => Object.values(gameRegistry), []);
  const [filterSection, setFilterSection] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [statsMap, setStatsMap] = useState<{ [gameId: string]: any }>({});

  useEffect(() => {
    // Load stats for each game from localStorage, then hydrate from Firebase when available.
    const stats: { [id: string]: any } = {};
    allGames.forEach(game => {
      stats[game.id] = getGameStats(game.id);
    });
    setStatsMap(stats);

    let cancelled = false;
    const hydrateFromCloud = async () => {
      await Promise.all(
        allGames.map(async game => {
          const cloud = await fetchCloudGameData(game.id);
          if (!cancelled && cloud?.stats) {
            setStatsMap(current => ({ ...current, [game.id]: cloud.stats }));
          }
        })
      );
    };

    void hydrateFromCloud();

    return () => {
      cancelled = true;
    };
  }, [allGames]);

  const filteredGames = allGames.filter(game => {
    if (filterSection && game.section !== filterSection) return false;
    if (searchTerm && !game.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const summary = useMemo(() => {
    let attempts = 0;
    let solves = 0;
    let bestStreak = 0;
    let playedCount = 0;
    let lastPlayedAt = 0;
    let lastPlayedId: string | null = null;

    for (const game of allGames) {
      const stats = statsMap[game.id];
      if (!stats) continue;
      attempts += stats.attempts ?? 0;
      solves += stats.solves ?? 0;
      bestStreak = Math.max(bestStreak, stats.streakDays ?? 0);
      if ((stats.attempts ?? 0) > 0 || stats.lastPlayedAt) {
        playedCount += 1;
      }
      if (stats.lastPlayedAt) {
        const ts = Date.parse(stats.lastPlayedAt);
        if (!Number.isNaN(ts) && ts > lastPlayedAt) {
          lastPlayedAt = ts;
          lastPlayedId = game.id;
        }
      }
    }

    const accuracy = attempts ? Math.round((solves / attempts) * 100) : 0;
    const lastPlayedGame = lastPlayedId ? (allGames.find(game => game.id === lastPlayedId) ?? null) : null;

    return {
      attempts,
      solves,
      bestStreak,
      playedCount,
      accuracy,
      lastPlayedAt,
      lastPlayedGame,
    };
  }, [allGames, statsMap]);

  const totalGames = allGames.length;
  const showReset = Boolean(filterSection || searchTerm);
  const sectionChips = [
    { id: ALL, label: "All" },
    { id: "dilr", label: "DILR" },
    { id: "qa", label: "QA" },
    { id: "varc", label: "VARC" },
    { id: "hybrid", label: "Hybrid" },
  ];

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-gradient-to-b from-background via-background to-muted/30">
      <AppNavbar
        title="Cat99"
        subtitle="Games"
        trailing={
          <AppNavbarActions
            value="games"
            onChange={next => {
              if (next === "chat") {
                window.location.href = "/chat";
              } else if (next === "notes") {
                window.location.href = "/notes";
              } else if (next === "saved") {
                window.location.href = "/rough-notes";
              } else if (next === "games") {
                window.location.href = "/games";
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
              <div className="absolute inset-0 bg-gradient-to-br from-muted/40 via-background to-background" />
              <div className="relative game-panel-padded space-y-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="game-chip">Practice hub</span>
                      <span>{totalGames} games ready</span>
                    </div>
                    <div className="space-y-1">
                      <h1 className="text-xl font-semibold tracking-tight">Game library</h1>
                      <p className="max-w-2xl text-sm text-muted-foreground">
                        Pick a drill, build your streak, and track accuracy across every CAT section.
                      </p>
                    </div>
                    {summary.lastPlayedGame ? (
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        Last played: {summary.lastPlayedGame.title}
                        {summary.lastPlayedAt ? (
                          <span>({new Date(summary.lastPlayedAt).toLocaleDateString()})</span>
                        ) : null}
                        <Link href={`/games/${summary.lastPlayedGame.id}`}>
                          <Button size="sm" variant="secondary">
                            Resume
                          </Button>
                        </Link>
                      </div>
                    ) : null}
                  </div>

                  <div className="grid w-full gap-2 sm:grid-cols-2 lg:w-auto lg:grid-cols-4">
                    <div className="rounded-2xl border border-border/60 bg-background/70 px-3 py-2 shadow-sm">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Sparkles className="h-3.5 w-3.5" />
                        Games played
                      </div>
                      <div className="text-lg font-semibold">
                        {summary.playedCount}/{totalGames}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-background/70 px-3 py-2 shadow-sm">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Target className="h-3.5 w-3.5" />
                        Accuracy
                      </div>
                      <div className="text-lg font-semibold">{summary.accuracy}%</div>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-background/70 px-3 py-2 shadow-sm">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Trophy className="h-3.5 w-3.5" />
                        Solves
                      </div>
                      <div className="text-lg font-semibold">{summary.solves}</div>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-background/70 px-3 py-2 shadow-sm">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Zap className="h-3.5 w-3.5" />
                        Best streak
                      </div>
                      <div className="text-lg font-semibold">
                        {summary.bestStreak} day{summary.bestStreak === 1 ? "" : "s"}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="bg-border/60" />

                <div className="space-y-3">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Search by game or skill..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Select
                      value={filterSection ?? ALL}
                      onValueChange={val => setFilterSection(val === ALL ? null : val)}
                    >
                      <SelectTrigger className="w-full md:hidden">
                        <SelectValue placeholder="All Sections" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL}>All Sections</SelectItem>
                        <SelectItem value="dilr">DILR</SelectItem>
                        <SelectItem value="qa">QA</SelectItem>
                        <SelectItem value="varc">VARC</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                    {showReset ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSearchTerm("");
                          setFilterSection(null);
                        }}
                      >
                        Clear filters
                      </Button>
                    ) : null}
                  </div>

                  <div className="hidden flex-wrap gap-2 md:flex">
                    {sectionChips.map(chip => {
                      const isActive = chip.id === ALL ? !filterSection : filterSection === chip.id;
                      return (
                        <Button
                          key={chip.id}
                          type="button"
                          size="sm"
                          variant={isActive ? "default" : "outline"}
                          onClick={() => setFilterSection(chip.id === ALL ? null : chip.id)}
                        >
                          {chip.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                Showing {filteredGames.length} of {totalGames} games
              </span>
              {filterSection ? <span>Filter: {filterSection.toUpperCase()}</span> : null}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredGames.map(game => {
                const stats = statsMap[game.id] || {
                  attempts: 0,
                  solves: 0,
                  bestTimeSeconds: null,
                  streakDays: 0,
                  lastPlayedAt: null,
                };
                const lastPlayed = stats.lastPlayedAt
                  ? new Date(stats.lastPlayedAt).toLocaleDateString()
                  : "Not started";
                const accuracy = stats.attempts ? Math.round((stats.solves / stats.attempts) * 100) : 0;
                const tags = game.skillTags.slice(0, 3);
                const extraTags = Math.max(0, game.skillTags.length - tags.length);

                return (
                  <Card
                    key={game.id}
                    className="game-panel group flex h-full flex-col overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <CardHeader className="space-y-3 pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <CardTitle className="text-base leading-tight sm:text-lg">{game.title}</CardTitle>
                          <CardDescription className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>Last played: {lastPlayed}</span>
                          </CardDescription>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge
                            variant={sectionConfig[game.section as keyof typeof sectionConfig]?.variant || "default"}
                          >
                            {game.section.toUpperCase()}
                          </Badge>
                          {stats.attempts === 0 ? (
                            <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                              New
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                      <CardDescription className="line-clamp-2 text-xs text-muted-foreground">
                        {game.description}
                      </CardDescription>
                      <div className="flex flex-wrap gap-1.5">
                        {tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {extraTags > 0 ? (
                          <Badge variant="outline" className="text-xs">
                            +{extraTags}
                          </Badge>
                        ) : null}
                      </div>
                    </CardHeader>

                    <CardContent className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{stats.attempts} attempts</span>
                        <span className="h-1 w-1 rounded-full bg-muted-foreground/60" />
                        <span>{stats.solves} solves</span>
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                        <div className="rounded-xl border border-border/60 bg-muted/30 px-2 py-2">
                          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Best</div>
                          <div className="text-sm font-semibold">
                            {stats.bestTimeSeconds != null ? formatTime(stats.bestTimeSeconds) : "--:--"}
                          </div>
                        </div>
                        <div className="rounded-xl border border-border/60 bg-muted/30 px-2 py-2">
                          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Accuracy</div>
                          <div className="text-sm font-semibold">{accuracy}%</div>
                        </div>
                        <div className="rounded-xl border border-border/60 bg-muted/30 px-2 py-2">
                          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Streak</div>
                          <div className="text-sm font-semibold">{stats.streakDays}d</div>
                        </div>
                      </div>
                    </CardContent>

                    <Separator />

                    <CardFooter className="pt-4">
                      <Link href={`/games/${game.id}`} className="w-full">
                        <Button className="w-full" size="sm">
                          Play now
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </AppContent>
    </div>
  );
}
