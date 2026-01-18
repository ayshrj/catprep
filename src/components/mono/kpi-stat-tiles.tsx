"use client";

import styles from "@/components/mono/mono-ui.module.css";
import { cn } from "@/lib/utils";

type KPIStat = {
  id: string;
  label: string;
  value: string;
  delta?: string;
  direction?: "up" | "down";
};

type KPIStatTilesProps = {
  items: KPIStat[];
  className?: string;
};

export function KPIStatTiles({ items, className }: KPIStatTilesProps) {
  return (
    <div className={cn(styles.kpiGrid, className)}>
      {items.map(item => (
        <div key={item.id} className={cn(styles.card, styles.kpiTile)}>
          <div className={styles.kpiLabel}>{item.label}</div>
          <div className={styles.kpiValue}>{item.value}</div>
          {item.delta ? (
            <div className={styles.kpiDelta} data-direction={item.direction}>
              {item.delta}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
