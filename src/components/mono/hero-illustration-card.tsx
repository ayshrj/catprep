"use client";

import styles from "@/components/mono/mono-ui.module.css";
import { cn } from "@/lib/utils";

type HeroIllustrationCardProps = {
  title?: string;
  subtitle?: string;
  chipTitle?: string;
  chipSubtitle?: string;
  className?: string;
};

export function HeroIllustrationCard({
  title = "Your study path",
  subtitle = "Three focused sessions this week",
  chipTitle = "Next up",
  chipSubtitle = "Quant drill",
  className,
}: HeroIllustrationCardProps) {
  return (
    <div className={cn(styles.heroCard, className)}>
      <div className={styles.heroIllustration} aria-hidden="true">
        <div className={styles.heroIllustrationGrid}>
          <div className={styles.heroIllustrationBlock} />
          <div className={styles.heroIllustrationBlock} />
          <div className={styles.heroIllustrationBlock} />
        </div>
      </div>
      <div>
        <div className={styles.heroTitle}>{title}</div>
        <div className={styles.heroSubtitle}>{subtitle}</div>
      </div>
      <div className={styles.heroChip}>
        <div className={styles.heroChipTitle}>{chipTitle}</div>
        <div className={styles.heroChipSubtitle}>{chipSubtitle}</div>
      </div>
    </div>
  );
}
