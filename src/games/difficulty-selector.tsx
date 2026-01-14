"use client";
import React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DifficultyOption {
  id: number;
  label: string;
}

const DifficultySelector: React.FC<{
  options: DifficultyOption[];
  current: number;
  onSelect: (difficultyId: number) => void;
}> = ({ options, current, onSelect }) => {
  const currentOption = options.find(opt => opt.id === current);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs">
          Difficulty: {currentOption ? currentOption.label : "?"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Select Difficulty</DropdownMenuLabel>
        {options.map(opt => (
          <DropdownMenuItem key={opt.id} onClick={() => onSelect(opt.id)}>
            {opt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DifficultySelector;
