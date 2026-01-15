"use client";

import { Laptop, Moon, MoreVertical, Sun } from "lucide-react";
import { useTheme } from "next-themes";
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

function ThemeToggleButton() {
  const { theme, setTheme } = useTheme();

  const current = theme ?? "system";
  const next = current === "system" ? "light" : current === "light" ? "dark" : "system";

  const Icon = current === "dark" ? Moon : current === "light" ? Sun : Laptop;

  return (
    <Button type="button" variant="outline" size="icon" aria-label={`Theme: ${current}`} onClick={() => setTheme(next)}>
      <Icon className="h-4 w-4" />
    </Button>
  );
}

type AppNavbarActionsProps = {
  value: NavValue;
  onChange: (value: NavValue) => void;
  inlineExtras?: ReactNode;
  menuExtras?: ReactNode;
  className?: string;
  onLogout?: () => void;
  onThemeToggle?: () => void;
};

export function AppNavbarActions({
  value,
  onChange,
  inlineExtras,
  menuExtras,
  className,
  onLogout,
  onThemeToggle,
}: AppNavbarActionsProps) {
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
      <DropdownMenuSeparator />
      {onThemeToggle || onLogout ? (
        <>
          <DropdownMenuLabel>Preferences</DropdownMenuLabel>
          <DropdownMenuSeparator />
        </>
      ) : null}
      {onThemeToggle ? (
        <DropdownMenuItem onSelect={onThemeToggle}>
          <div className="flex w-full items-center justify-between">
            <span>Theme</span>
            <ThemeToggleButton />
          </div>
        </DropdownMenuItem>
      ) : null}
      {onLogout ? <DropdownMenuItem onClick={onLogout}>Logout</DropdownMenuItem> : null}
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
