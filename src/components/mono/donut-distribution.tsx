"use client";

import styles from "@/components/mono/mono-ui.module.css";
import { cn } from "@/lib/utils";

type DonutSegment = {
  label: string;
  value: number;
};

type DonutDistributionProps = {
  title?: string;
  segments: DonutSegment[];
  className?: string;
};

const segmentClasses = [styles.donutSegmentA, styles.donutSegmentB, styles.donutSegmentC];
const swatchClasses = [styles.legendSwatch, styles.legendSwatchB, styles.legendSwatchC];

export function DonutDistribution({ title = "Study mix", segments, className }: DonutDistributionProps) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;

  let offset = 0;

  return (
    <div className={cn(styles.card, className)}>
      <div className={styles.sectionTitle}>{title}</div>
      <div className={styles.donutWrap}>
        <svg className={styles.donutSvg} viewBox="0 0 100 100" aria-hidden="true">
          <circle className={styles.donutTrack} cx="50" cy="50" r={radius} />
          {segments.map((segment, index) => {
            const length = (segment.value / total) * circumference;
            const dashArray = `${length} ${circumference - length}`;
            const dashOffset = -offset;
            offset += length;

            return (
              <circle
                key={segment.label}
                className={cn(styles.donutSegment, segmentClasses[index % segmentClasses.length])}
                cx="50"
                cy="50"
                r={radius}
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
              />
            );
          })}
        </svg>
        <div className={styles.legend}>
          {segments.map((segment, index) => (
            <div key={segment.label} className={styles.legendItem}>
              <span className={swatchClasses[index % swatchClasses.length]} aria-hidden="true" />
              <span>
                {segment.label} · {Math.round((segment.value / total) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
