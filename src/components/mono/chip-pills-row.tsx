"use client";

import type { MouseEventHandler } from "react";

import styles from "@/components/mono/mono-ui.module.css";
import { cn } from "@/lib/utils";

type ChipItem = {
  id: string;
  label: string;
  selected?: boolean;
  disabled?: boolean;
};

type ChipPillsRowProps = {
  items: ChipItem[];
  onSelect?: (id: string) => void;
  className?: string;
};

export function ChipPillsRow({ items, onSelect, className }: ChipPillsRowProps) {
  const handleClick: MouseEventHandler<HTMLButtonElement> = event => {
    const id = event.currentTarget.dataset.id;
    if (id) {
      onSelect?.(id);
    }
  };

  return (
    <div className={cn(styles.chipRow, className)} role="list">
      {items.map(item => (
        <button
          key={item.id}
          type="button"
          className={styles.chip}
          data-id={item.id}
          data-selected={item.selected}
          aria-pressed={item.selected}
          disabled={item.disabled}
          onClick={handleClick}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
