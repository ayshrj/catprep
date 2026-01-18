"use client";

import type { CSSProperties } from "react";

import styles from "@/components/mono/mono-ui.module.css";
import { cn } from "@/lib/utils";

type LessonPlayerScreenProps = {
  label?: string;
  title?: string;
  caption?: string;
  progress?: number;
  startTime?: string;
  endTime?: string;
  className?: string;
};

export function LessonPlayerScreen({
  label = "Lesson 04",
  title = "Geometry: Ratio patterns",
  caption = "Take notes on recurring traps.",
  progress = 45,
  startTime = "04:12",
  endTime = "12:08",
  className,
}: LessonPlayerScreenProps) {
  const clamped = Math.min(Math.max(progress, 0), 100);
  const style = { "--progress": `${clamped}%` } as CSSProperties;

  return (
    <section className={cn(styles.screenFrame, styles.lessonScreen, className)}>
      <div className={styles.lessonLabel}>{label}</div>
      <div className={styles.lessonTitle}>{title}</div>
      <button type="button" className={styles.playButton} aria-label="Play lesson">
        <svg className={styles.iconLarge} viewBox="0 0 24 24" aria-hidden="true" fill="none">
          <path d="M8 5l11 7-11 7V5z" stroke="currentColor" strokeWidth="var(--icon-stroke)" strokeLinejoin="round" />
        </svg>
      </button>
      <div className={styles.captionBubble}>{caption}</div>
      <div className={styles.scrubber}>
        <div className={styles.scrubberTrack}>
          <div className={styles.scrubberFill} style={style} />
        </div>
        <div className={styles.scrubberMeta}>
          <span>{startTime}</span>
          <button type="button" className={styles.iconButton} aria-label="Player settings">
            <svg className={styles.iconSmall} viewBox="0 0 24 24" aria-hidden="true" fill="none">
              <path
                d="M4 7h8M4 17h16M12 7l4 4-4 4"
                stroke="currentColor"
                strokeWidth="var(--icon-stroke)"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <span>{endTime}</span>
        </div>
      </div>
    </section>
  );
}
