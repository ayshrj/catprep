"use client";

import { useCallback } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type NavValue = "chat" | "notes" | "saved";

export function AppNavigationSelect({
  value,
  onChange,
}: {
  value: NavValue;
  onChange: (value: NavValue) => void;
}) {
  const handleChange = useCallback(
    (next: string) => {
      if (next === "chat" || next === "notes" || next === "saved") {
        onChange(next);
      }
    },
    [onChange],
  );

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger aria-label="Navigate between Chat, Notes, and Saved notes">
        <SelectValue placeholder="Navigate" />
      </SelectTrigger>
      <SelectContent align="end">
        <SelectItem value="chat">Chat</SelectItem>
        <SelectItem value="notes">Notes</SelectItem>
        <SelectItem value="saved">Saved notes</SelectItem>
      </SelectContent>
    </Select>
  );
}
