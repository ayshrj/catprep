"use client";

import styles from "@/components/mono/mono-ui.module.css";
import { TooltipBubble } from "@/components/mono/tooltip-bubble";
import { cn } from "@/lib/utils";

type LineChartCardProps = {
  title?: string;
  value?: string;
  series: number[];
  labels?: string[];
  activeIndex?: number;
  className?: string;
};

export function LineChartCard({
  title = "Focus trend",
  value = "82%",
  series,
  labels,
  activeIndex,
  className,
}: LineChartCardProps) {
  const width = 100;
  const height = 40;
  const safeSeries = series.length > 0 ? series : [0];
  const max = Math.max(...safeSeries);
  const min = Math.min(...safeSeries);
  const range = max - min || 1;

  const points = safeSeries.map((point, index) => {
    const x = (index / Math.max(safeSeries.length - 1, 1)) * width;
    const y = height - ((point - min) / range) * height;
    return { x, y };
  });

  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");

  const fallbackIndex = labels ? labels.length - 1 : safeSeries.length - 1;
  const resolvedIndex = typeof activeIndex === "number" ? activeIndex : fallbackIndex;
  const activePoint = points[resolvedIndex] ?? points.at(-1);
  const activeLabel = labels?.[resolvedIndex] ?? "Today";
  const activeValue = safeSeries[resolvedIndex] ?? safeSeries[0];
  const leftPercent = activePoint ? (activePoint.x / width) * 100 : 0;
  const topPercent = activePoint ? (activePoint.y / height) * 100 : 0;

  return (
    <div className={cn(styles.card, styles.chartCard, className)}>
      <div className={styles.chartHeader}>
        <div className={styles.chartTitle}>{title}</div>
        <div className={styles.chartValue}>{value}</div>
      </div>
      <div className={styles.chartArea}>
        <svg className={styles.chartSvg} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
          <line className={styles.chartGridLine} x1="0" y1="0" x2={width} y2="0" />
          <line className={styles.chartGridLine} x1="0" y1={height / 2} x2={width} y2={height / 2} />
          <line className={styles.chartGridLine} x1="0" y1={height} x2={width} y2={height} />
          <path className={styles.chartLine} d={path} />
          {points.map(point => (
            <circle
              key={`${point.x}-${point.y}`}
              className={styles.chartPoint}
              cx={point.x}
              cy={point.y}
              r="var(--chart-point)"
            />
          ))}
        </svg>
        {activePoint ? <div className={styles.chartRule} style={{ left: `${leftPercent}%` }} /> : null}
        {activePoint ? (
          <TooltipBubble
            title={activeLabel}
            value={`${activeValue}%`}
            meta="Focus score"
            style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
          />
        ) : null}
      </div>
      {labels ? (
        <div className={styles.chartLabels}>
          {labels.map(label => (
            <span key={label}>{label}</span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
