"use client";

import type { CSSProperties } from "react";

import styles from "@/components/mono/mono-ui.module.css";
import { cn } from "@/lib/utils";

type TooltipBubbleProps = {
  title: string;
  value: string;
  meta?: string;
  style?: CSSProperties;
  className?: string;
};

export function TooltipBubble({ title, value, meta, style, className }: TooltipBubbleProps) {
  return (
    <div className={cn(styles.tooltip, className)} style={style} role="status" aria-live="polite">
      <span>{title}</span>
      <strong>{value}</strong>
      {meta ? <span>{meta}</span> : null}
    </div>
  );
}
