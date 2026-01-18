"use client";

import type { CSSProperties } from "react";

import styles from "@/components/mono/mono-ui.module.css";
import { cn } from "@/lib/utils";

type HabitInsight = {
  id: string;
  label: string;
  percent: number;
};

type HabitsInsightsListProps = {
  title?: string;
  items: HabitInsight[];
  className?: string;
};

export function HabitsInsightsList({ title = "Habit impact", items, className }: HabitsInsightsListProps) {
  return (
    <div className={cn(styles.card, className)}>
      <div className={styles.sectionTitle}>{title}</div>
      <div className={styles.habitsList}>
        {items.map(item => {
          const direction = item.percent >= 0 ? "up" : "down";
          const magnitude = Math.min(Math.abs(item.percent), 100);
          const style = { "--value": `${magnitude}%` } as CSSProperties;

          return (
            <div key={item.id} className={styles.habitRow}>
              <div className={styles.habitHeader}>
                <span>{item.label}</span>
                <span className={styles.mutedText}>
                  {item.percent >= 0 ? "+" : "-"}
                  {Math.abs(item.percent)}%
                </span>
              </div>
              <div className={styles.habitBarTrack}>
                <div className={styles.habitBarFill} data-direction={direction} style={style} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
