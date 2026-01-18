"use client";

import { BookOpen, MessageCircle, NotebookPen, Sparkles, Trophy } from "lucide-react";
import Link from "next/link";

import { APP_CONTENT_HEIGHT, AppContent } from "@/components/app-content";
import { AppNavbar } from "@/components/app-navbar";
import { AppNavbarActions } from "@/components/app-navbar-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthAndTheme } from "@/hooks/use-auth-and-theme";

export default function Page() {
  const { handleLogout, handleThemeToggle } = useAuthAndTheme();
  const destinations = [
    {
      title: "Chat",
      description: "Ask, analyze, and work with your CAT prep copilot.",
      href: "/chat",
      icon: MessageCircle,
      tone: "bg-muted text-foreground",
    },
    {
      title: "Games",
      description: "Practice drills, track streaks, and sharpen speed.",
      href: "/games",
      icon: Trophy,
      tone: "bg-muted text-foreground",
    },
    {
      title: "Notes",
      description: "Capture structured learnings and revision summaries.",
      href: "/notes",
      icon: NotebookPen,
      tone: "bg-muted text-foreground",
    },
    {
      title: "Papers",
      description: "Browse CAT & XAT past papers with solutions.",
      href: "/papers",
      icon: BookOpen,
      tone: "bg-muted text-foreground",
    },
    {
      title: "Rough notes",
      description: "Dump quick thoughts, drafts, and scratch ideas.",
      href: "/rough-notes",
      icon: Sparkles,
      tone: "bg-muted text-foreground",
    },
  ];

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <AppNavbar
        title="Cat99"
        subtitle="Quick navigation"
        trailing={
          <AppNavbarActions
            value="chat"
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
              }
            }}
            onLogout={handleLogout}
            onThemeToggle={handleThemeToggle}
          />
        }
      />

      <AppContent className={APP_CONTENT_HEIGHT}>
        <div className="h-full min-h-0 overflow-y-auto py-4 sm:py-6">
          <div className="space-y-6 pb-6">
            <section className="game-panel relative overflow-hidden">
              <div className="relative game-panel-padded space-y-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="game-chip">Welcome</span>
                    <span>Pick your next workspace</span>
                  </div>
                  <h1 className="text-xl font-semibold tracking-tight">Where do you want to go?</h1>
                  <p className="max-w-2xl text-sm text-muted-foreground">
                    Jump straight into chat, practice games, structured notes, or your rough scratchpad.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {destinations.map(destination => {
                    const Icon = destination.icon;
                    return (
                      <Card key={destination.title} className="bg-card">
                        <CardHeader className="space-y-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-4xl ${destination.tone}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="space-y-1">
                            <CardTitle className="text-base">{destination.title}</CardTitle>
                            <CardDescription>{destination.description}</CardDescription>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <Button asChild variant="secondary" className="w-full">
                            <Link href={destination.href}>Open</Link>
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>
        </div>
      </AppContent>
    </div>
  );
}
