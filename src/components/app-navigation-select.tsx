"use client";

import { useCallback } from "react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type NavValue = "chat" | "notes" | "saved" | "games";

export function AppNavigationSelect({ value, onChange }: { value: NavValue; onChange: (value: NavValue) => void }) {
  const handleChange = useCallback(
    (next: string) => {
      if (next === "chat" || next === "notes" || next === "saved" || next === "games") {
        onChange(next);
      }
    },
    [onChange]
  );

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger aria-label="Navigate between Chat, Notes, Rough notes, and Games">
        <SelectValue placeholder="Navigate" />
      </SelectTrigger>
      <SelectContent align="end">
        <SelectItem value="chat">Chat</SelectItem>
        <SelectItem value="notes">Notes</SelectItem>
        <SelectItem value="saved">Rough notes</SelectItem>
        <SelectItem value="games">Games</SelectItem>
      </SelectContent>
    </Select>
  );
}
