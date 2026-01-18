"use client";

import styles from "@/components/mono/mono-ui.module.css";
import { PrimaryButton } from "@/components/mono/primary-button";
import { cn } from "@/lib/utils";

type LessonFinishedScreenProps = {
  title?: string;
  message?: string;
  ctaLabel?: string;
  className?: string;
};

export function LessonFinishedScreen({
  title = "Lesson complete",
  message = "You cleared another concept block.",
  ctaLabel = "Review summary",
  className,
}: LessonFinishedScreenProps) {
  return (
    <section className={cn(styles.screenFrame, styles.finishedScreen, className)}>
      <div className={styles.finishedIcon} aria-hidden="true">
        <svg className={styles.iconLarge} viewBox="0 0 24 24" fill="none">
          <path
            d="M5 12l4 4 10-10"
            stroke="currentColor"
            strokeWidth="var(--icon-stroke)"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className={styles.finishedText}>{title}</div>
      <div className={styles.mutedText}>{message}</div>
      <div className={styles.lessonFooter}>
        <PrimaryButton fullWidth>{ctaLabel}</PrimaryButton>
      </div>
    </section>
  );
}
