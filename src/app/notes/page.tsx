"use client";

import { MoreVertical } from "lucide-react";

import { APP_CONTENT_HEIGHT, AppContent } from "@/components/app-content";
import { AppNavbar } from "@/components/app-navbar";
import { AppNavigationSelect } from "@/components/app-navigation-select";
import { Notes } from "@/components/notes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function NotesPage() {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-gradient-to-b from-background via-background to-muted/30">
      <AppNavbar
        title="Cat99"
        subtitle="Notes"
        trailing={
          <div className="flex items-center gap-2">
            <AppNavigationSelect
              value="notes"
              onChange={next => {
                if (next === "chat") {
                  window.location.href = "/";
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
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      <AppContent className={APP_CONTENT_HEIGHT}>
        <div className="h-full min-h-0 py-3 sm:py-4">
          <Notes />
        </div>
      </AppContent>
    </div>
  );
}
