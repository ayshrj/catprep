"use client";

import { MoreVertical } from "lucide-react";
import type { ReactNode } from "react";

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
import { cn } from "@/lib/utils";

type NavValue = "chat" | "notes" | "saved" | "games";

type AppNavbarActionsProps = {
  value: NavValue;
  onChange: (value: NavValue) => void;
  inlineExtras?: ReactNode;
  menuExtras?: ReactNode;
  className?: string;
};

export function AppNavbarActions({ value, onChange, inlineExtras, menuExtras, className }: AppNavbarActionsProps) {
  const menuContent = (
    <DropdownMenuContent align="end" className="w-56">
      <DropdownMenuLabel>Pages</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => onChange("chat")}>Chat</DropdownMenuItem>
      <DropdownMenuItem onClick={() => onChange("notes")}>Notes</DropdownMenuItem>
      <DropdownMenuItem onClick={() => onChange("saved")}>Rough notes</DropdownMenuItem>
      <DropdownMenuItem onClick={() => onChange("games")}>Games</DropdownMenuItem>
      {menuExtras ? (
        <>
          <DropdownMenuSeparator />
          {menuExtras}
        </>
      ) : null}
    </DropdownMenuContent>
  );

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="hidden items-center gap-2 md:flex">
        {inlineExtras}
        <AppNavigationSelect value={value} onChange={onChange} className="min-w-[140px]" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" size="icon" aria-label="Menu">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          {menuContent}
        </DropdownMenu>
      </div>
      <div className="md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" size="icon" aria-label="Menu">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          {menuContent}
        </DropdownMenu>
      </div>
    </div>
  );
}
