"use client";

import styles from "@/components/mono/mono-ui.module.css";
import { cn } from "@/lib/utils";

type OnboardingScreenProps = {
  caption?: string;
  title?: string;
  className?: string;
};

export function OnboardingScreen({
  caption = "Day 1",
  title = "Build a calm, consistent prep rhythm.",
  className,
}: OnboardingScreenProps) {
  return (
    <section className={cn(styles.screenFrame, styles.onboardingScreen, className)}>
      <div className={styles.onboardingTop}>
        <span className={styles.onboardingCaption}>{caption}</span>
        <button type="button" className={styles.circleButton} aria-label="Close onboarding">
          <svg className={styles.iconSmall} viewBox="0 0 24 24" aria-hidden="true" fill="none">
            <path
              d="M6 6l12 12M18 6l-12 12"
              stroke="currentColor"
              strokeWidth="var(--icon-stroke)"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
      <div className={styles.onboardingTitle}>{title}</div>
      <button type="button" className={styles.circleButton} aria-label="Next step">
        <svg className={styles.iconSmall} viewBox="0 0 24 24" aria-hidden="true" fill="none">
          <path
            d="M8 5l8 7-8 7"
            stroke="currentColor"
            strokeWidth="var(--icon-stroke)"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </section>
  );
}
