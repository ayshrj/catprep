"use client";

import type { MouseEventHandler } from "react";

import styles from "@/components/mono/mono-ui.module.css";
import { cn } from "@/lib/utils";

type HeaderRowProps = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  backLabel?: string;
  onBack?: MouseEventHandler<HTMLButtonElement>;
  showAction?: boolean;
  actionLabel?: string;
  onAction?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
};

export function HeaderRow({
  title,
  subtitle,
  showBack,
  backLabel = "Go back",
  onBack,
  showAction,
  actionLabel = "Add",
  onAction,
  className,
}: HeaderRowProps) {
  return (
    <div className={cn(styles.headerRow, className)}>
      <div className={styles.headerLeft}>
        {showBack ? (
          <button type="button" className={styles.iconButton} aria-label={backLabel} onClick={onBack}>
            <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true" fill="none">
              <path
                d="M15.5 5.5L8.5 12l7 6.5"
                stroke="currentColor"
                strokeWidth="var(--icon-stroke)"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ) : null}
        <div>
          <div className={styles.headerTitle}>{title}</div>
          {subtitle ? <div className={styles.headerSubtitle}>{subtitle}</div> : null}
        </div>
      </div>
      {showAction ? (
        <button type="button" className={styles.iconButton} aria-label={actionLabel} onClick={onAction}>
          <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="var(--icon-stroke)" strokeLinecap="round" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
