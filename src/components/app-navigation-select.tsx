"use client";

import { useCallback } from "react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type NavValue = "chat" | "notes" | "saved" | "games" | "papers";

export function AppNavigationSelect({
  value,
  onChange,
  size = "sm",
  className,
}: {
  value: NavValue;
  onChange: (value: NavValue) => void;
  size?: "sm" | "default";
  className?: string;
}) {
  const handleChange = useCallback(
    (next: string) => {
      if (next === "chat" || next === "notes" || next === "saved" || next === "games" || next === "papers") {
        onChange(next);
      }
    },
    [onChange]
  );

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger
        size={size}
        className={className}
        aria-label="Navigate between Chat, Notes, Rough notes, Games, and Papers"
      >
        <SelectValue placeholder="Pages" />
      </SelectTrigger>
      <SelectContent align="end">
        <SelectItem value="chat">Chat</SelectItem>
        <SelectItem value="notes">Notes</SelectItem>
        <SelectItem value="saved">Rough notes</SelectItem>
        <SelectItem value="games">Games</SelectItem>
        <SelectItem value="papers">Papers</SelectItem>
      </SelectContent>
    </Select>
  );
}
