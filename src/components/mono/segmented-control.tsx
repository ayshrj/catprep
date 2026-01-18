"use client";

import type { MouseEventHandler } from "react";

import styles from "@/components/mono/mono-ui.module.css";
import { cn } from "@/lib/utils";

type SegmentOption = {
  id: string;
  label: string;
};

type SegmentedControlProps = {
  options: SegmentOption[];
  value: string;
  onChange?: (id: string) => void;
  className?: string;
};

export function SegmentedControl({ options, value, onChange, className }: SegmentedControlProps) {
  const handleClick: MouseEventHandler<HTMLButtonElement> = event => {
    const id = event.currentTarget.dataset.id;
    if (id) {
      onChange?.(id);
    }
  };

  return (
    <div className={cn(styles.segmented, className)} role="tablist" aria-label="Time range">
      {options.map(option => (
        <button
          key={option.id}
          type="button"
          className={styles.segmentButton}
          role="tab"
          data-id={option.id}
          data-selected={option.id === value}
          aria-selected={option.id === value}
          onClick={handleClick}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
