"use client";

import { SelectValue } from "@radix-ui/react-select";
import { Calendar, MoreVertical, Search, Trophy, Zap } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

import { APP_CONTENT_HEIGHT, AppContent } from "@/components/app-content";
import { AppNavbar } from "@/components/app-navbar";
import { AppNavigationSelect } from "@/components/app-navigation-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import gameRegistry from "@/games/core/registry";
import { fetchCloudGameData, getGameStats } from "@/games/core/storage";
import { formatTime } from "@/games/core/timer";

const ALL = "__all__";

const sectionConfig = {
  dilr: { label: "DILR", variant: "default" as const },
  qa: { label: "QA", variant: "secondary" as const },
  varc: { label: "VARC", variant: "outline" as const },
  hybrid: { label: "Hybrid", variant: "destructive" as const },
};

export default function DashboardPage() {
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

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-gradient-to-b from-background via-background to-muted/30">
      <AppNavbar
        title="Cat99"
        subtitle="Games"
        trailing={
          <div className="flex items-center gap-2">
            <AppNavigationSelect
              value="games"
              onChange={next => {
                if (next === "chat") {
                  window.location.href = "/";
                } else if (next === "notes") {
                  window.location.href = "/notes";
                } else if (next === "saved") {
                  window.location.href = "/rough-notes";
                }
              }}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="icon" aria-label="Menu">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Pages</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => (window.location.href = "/")}>Chat</DropdownMenuItem>
                <DropdownMenuItem onClick={() => (window.location.href = "/notes")}>Notes</DropdownMenuItem>
                <DropdownMenuItem onClick={() => (window.location.href = "/rough-notes")}>Rough notes</DropdownMenuItem>
                <DropdownMenuItem onClick={() => (window.location.href = "/games")}>Games</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      <AppContent className={APP_CONTENT_HEIGHT}>
        <div className="h-full min-h-0 overflow-y-auto py-3 sm:py-4">
          <div className="game-panel game-panel-padded mb-6 flex flex-wrap items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search games..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterSection ?? ALL} onValueChange={val => setFilterSection(val === ALL ? null : val)}>
              <SelectTrigger className="w-full sm:w-[180px]">
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
              const lastPlayed = stats.lastPlayedAt ? new Date(stats.lastPlayedAt).toLocaleDateString() : "Never";

              return (
                <Card key={game.id} className="flex flex-col transition-shadow hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg leading-tight">{game.title}</CardTitle>
                      <Badge variant={sectionConfig[game.section as keyof typeof sectionConfig]?.variant || "default"}>
                        {game.section.toUpperCase()}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-1.5 text-xs">
                      <Calendar className="h-3 w-3" />
                      Last played: {lastPlayed}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1 pb-3">
                    <div className="flex flex-wrap gap-1.5">
                      {game.skillTags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>

                  <Separator />

                  <CardFooter className="flex-col items-stretch gap-3 pt-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Trophy className="h-4 w-4" />
                        <span className="font-medium">
                          {stats.bestTimeSeconds != null ? formatTime(stats.bestTimeSeconds) : "--:--"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Zap className="h-4 w-4" />
                        <span className="font-medium">
                          {stats.streakDays} day{stats.streakDays === 1 ? "" : "s"}
                        </span>
                      </div>
                    </div>

                    <Link href={`/games/${game.id}`} className="w-full">
                      <Button className="w-full" size="sm">
                        Play Now
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      </AppContent>
    </div>
  );
}
