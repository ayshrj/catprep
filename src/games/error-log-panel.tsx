"use client";
import React from "react";

import { ScrollArea } from "@/components/ui/scroll-area";

interface ErrorEntry {
  type: string;
  message: string;
}

const ErrorLogPanel: React.FC<{ errors: ErrorEntry[] }> = ({ errors }) => {
  if (!errors || errors.length === 0) {
    return <p className="game-helper">No errors.</p>;
  }
  return (
    <ScrollArea className="h-full pr-4">
      <ul className="list-disc list-inside text-sm text-destructive">
        {errors.map((err, idx) => (
          <li key={idx}>{err.message}</li>
        ))}
      </ul>
    </ScrollArea>
  );
};

export default ErrorLogPanel;
