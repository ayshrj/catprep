"use client";

import styles from "@/components/mono/mono-ui.module.css";
import { cn } from "@/lib/utils";

type HeatmapDay = {
  id: string;
  label: string;
  intensity?: 0 | 1 | 2 | 3 | 4;
  missing?: boolean;
  selected?: boolean;
};

type CalendarHeatmapProps = {
  days: HeatmapDay[];
  className?: string;
};

export function CalendarHeatmap({ days, className }: CalendarHeatmapProps) {
  return (
    <div className={cn(styles.heatmap, className)} role="grid" aria-label="Study activity">
      {days.map(day => (
        <button
          key={day.id}
          type="button"
          className={styles.heatCell}
          data-intensity={day.intensity ?? 0}
          data-missing={day.missing}
          data-selected={day.selected}
          aria-label={day.label}
          aria-pressed={day.selected}
          disabled={day.missing}
        >
          {day.missing ? "X" : null}
        </button>
      ))}
    </div>
  );
}
