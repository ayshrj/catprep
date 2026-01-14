"use client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import React from "react";

import { Badge } from "@/components/ui/badge";

interface GameHeaderProps {
  title: string;
  section: string;
  skillTags: string[];
}

const GameHeader: React.FC<GameHeaderProps> = ({ title, section, skillTags }) => {
  return (
    <div className="game-hero">
      <div className="flex items-center justify-between">
        <Link href="/games" className="game-chip flex items-center gap-1 text-xs">
          <ArrowLeft className="h-3.5 w-3.5" />
          All games
        </Link>
        <span className="text-xs text-muted-foreground uppercase tracking-wide">{section}</span>
      </div>
      <h1 className="game-title font-display flex items-center gap-2">
        {title}
        <Badge variant="secondary">{section.toUpperCase()}</Badge>
      </h1>
      <div className="game-badges">
        {skillTags.map(tag => (
          <Badge key={tag} variant="secondary">
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default GameHeader;
