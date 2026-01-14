"use client";

import { SelectValue } from "@radix-ui/react-select";
import { MoreVertical } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";

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
import gameRegistry from "@/games/core/registry";
import { getGameStats } from "@/games/core/storage";
import { formatTime } from "@/games/core/timer";

const ALL = "__all__";

export default function DashboardPage() {
  const allGames = Object.values(gameRegistry);
  const [filterSection, setFilterSection] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [statsMap, setStatsMap] = useState<{ [gameId: string]: any }>({});

  useEffect(() => {
    // Load stats for each game from localStorage

    const stats: { [id: string]: any } = {};
    allGames.forEach(game => {
      stats[game.id] = getGameStats(game.id);
    });
    setStatsMap(stats);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            <Input
              type="text"
              placeholder="Search games..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
            <Select
              value={filterSection ?? ""}
              onValueChange={val => setFilterSection((val === "__all__" ? "" : val) || null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Sections" />
              </SelectTrigger>
              <SelectContent>
                {[
                  { value: ALL, label: "All Sections" },
                  { value: "dilr", label: "DILR" },
                  { value: "qa", label: "QA" },
                  { value: "varc", label: "VARC" },
                  { value: "hybrid", label: "Hybrid" },
                ].map((val, idx) => (
                  <SelectItem key={idx} value={val.value}>
                    {val.label}
                  </SelectItem>
                ))}
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
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const accuracy = stats.attempts ? Math.round((stats.solves / stats.attempts) * 100) : 0;
              const lastPlayed = stats.lastPlayedAt ? new Date(stats.lastPlayedAt).toLocaleDateString() : "Never";
              return (
                <Card key={game.id} className="game-panel">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center justify-between">
                      {game.title}
                      <Badge className="ml-2">{game.section.toUpperCase()}</Badge>
                    </CardTitle>
                    <CardDescription className="text-sm">Last played: {lastPlayed}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {game.skillTags.map(tag => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </CardContent>
                  <CardFooter className="flex items-center justify-between text-sm">
                    <div className="text-muted-foreground">
                      Best: {stats.bestTimeSeconds != null ? formatTime(stats.bestTimeSeconds) : "--:--"} | Streak:{" "}
                      {stats.streakDays} day
                      {stats.streakDays === 1 ? "" : "s"}
                    </div>
                    <Link href={`/games/${game.id}`}>
                      <Button size="sm" variant="secondary">
                        Play
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
