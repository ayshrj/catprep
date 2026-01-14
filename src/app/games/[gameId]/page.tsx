"use client";

import { MoreVertical } from "lucide-react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";

import { APP_CONTENT_HEIGHT, AppContent } from "@/components/app-content";
import { AppNavbar } from "@/components/app-navbar";
import { AppNavigationSelect } from "@/components/app-navigation-select";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const GameRunner = dynamic(() => import("@/games/game-runner"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">Loading game...</div>
  ),
});

export default function GamePage() {
  const params = useParams<{ gameId?: string | string[] }>();
  const raw = params?.gameId;
  const gameId = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : "";

  if (!gameId) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">Missing game id.</div>
    );
  }

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
          <GameRunner gameId={gameId} />
        </div>
      </AppContent>
    </div>
  );
}
