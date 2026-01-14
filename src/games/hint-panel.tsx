"use client";
import React from "react";

import { ScrollArea } from "@/components/ui/scroll-area";

interface Hint {
  title: string;
  body: string;
}

const HintPanel: React.FC<{ hints: Hint[] }> = ({ hints }) => {
  if (hints.length === 0) {
    return <p className="game-helper">No hints taken yet.</p>;
  }
  return (
    <ScrollArea className="h-full pr-4">
      {hints.map((hint, idx) => (
        <div key={idx} className="game-panel game-panel-muted mb-2 p-3 space-y-1">
          <div className="text-sm font-semibold">{hint.title}</div>
          <div className="text-sm text-muted-foreground">{hint.body}</div>
        </div>
      ))}
    </ScrollArea>
  );
};

export default HintPanel;
