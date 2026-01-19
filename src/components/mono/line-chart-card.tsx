"use client";

import { useId, useMemo } from "react";
import type { TooltipProps } from "recharts";
import {
  Area,
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";

import styles from "@/components/mono/mono-ui.module.css";
import { cn } from "@/lib/utils";

type ChartPoint = {
  label: string;
  value: number;
  tooltip: {
    title: string;
    value: string;
    meta?: string;
  };
};

type LineChartCardProps = {
  title?: string;
  value?: string;
  series: number[];
  labels?: string[];
  activeIndex?: number;
  className?: string;
};

const buildChartData = (series: number[], labels?: string[]): ChartPoint[] => {
  const safeSeries = series.length ? series : [0];
  return safeSeries.map((point, index) => {
    const label = labels?.[index] ?? `Day ${index + 1}`;
    return {
      label,
      value: point,
      tooltip: {
        title: label,
        value: `${Math.round(point)}%`,
        meta: "Completion score",
      },
    };
  });
};

const CustomTooltip = (props: TooltipProps<ValueType, NameType>) => {
  const { active, payload } = props as TooltipProps<ValueType, NameType> & {
    payload?: Array<{ payload?: ChartPoint }>;
  };
  const dataPoint = payload?.[0]?.payload;
  const tooltip = dataPoint?.tooltip;

  if (!active || !tooltip) return null;

  return (
    <div className={cn(styles.tooltip, styles.tooltipRecharts)} role="status" aria-live="polite">
      <span>{tooltip.title}</span>
      <strong>{tooltip.value}</strong>
      {tooltip.meta ? <span>{tooltip.meta}</span> : null}
    </div>
  );
};

type DotProps = {
  cx?: number;
  cy?: number;
  index?: number;
};

const CustomDot = ({ cx, cy, index, activeIndex }: DotProps & { activeIndex: number }) => {
  if (index !== activeIndex || typeof cx !== "number" || typeof cy !== "number") return null;

  return <circle cx={cx} cy={cy} r={6} fill="var(--text)" stroke="var(--surface)" strokeWidth={2} />;
};

export function LineChartCard({
  title = "Focus trend",
  value = "82%",
  series,
  labels,
  activeIndex,
  className,
}: LineChartCardProps) {
  const chartId = useId().replace(/:/g, "");
  const gradientId = `line-fill-${chartId}`;
  const data = useMemo(() => buildChartData(series, labels), [labels, series]);
  const resolvedLabels = labels && labels.length === data.length ? labels : data.map(point => point.label);
  const fallbackIndex = Math.max(resolvedLabels.length - 1, 0);
  const resolvedIndex =
    typeof activeIndex === "number"
      ? Math.min(Math.max(activeIndex, 0), Math.max(resolvedLabels.length - 1, 0))
      : fallbackIndex;
  const activeLabel = resolvedLabels[resolvedIndex];
  const maxValue = Math.max(...series, 0);
  const yMax = Math.max(100, maxValue);

  return (
    <div className={cn(styles.card, styles.chartCard, className)}>
      <div className={styles.chartHeader}>
        <div className={styles.chartTitle}>{title}</div>
        <div className={styles.chartValue}>{value}</div>
      </div>
      <div className={styles.chartArea} role="img" aria-label={title}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsLineChart data={data} margin={{ top: 16, right: 12, left: 0, bottom: 8 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--text)" stopOpacity={0.18} />
                <stop offset="100%" stopColor="var(--text)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--divider)" strokeDasharray="4 6" vertical={true} horizontal={false} />
            <XAxis dataKey="label" hide />
            <YAxis hide domain={[0, yMax]} />
            {activeLabel ? <ReferenceLine x={activeLabel} stroke="var(--border-strong)" strokeWidth={1} /> : null}
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: "var(--border-strong)", strokeWidth: 1 }}
              reverseDirection={{ x: false, y: true }}
            />
            <Area type="linear" dataKey="value" stroke="none" fill={`url(#${gradientId})`} />
            <Line
              type="linear"
              dataKey="value"
              stroke="var(--text)"
              strokeWidth={2.5}
              dot={props => <CustomDot {...props} activeIndex={resolvedIndex} />}
              activeDot={{ r: 6, fill: "var(--text)", stroke: "var(--surface)", strokeWidth: 2 }}
            />
          </RechartsLineChart>
        </ResponsiveContainer>
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
