"use client";

import { BottomTabBar } from "@/components/mono/bottom-tab-bar";
import styles from "@/components/mono/mono-ui.module.css";
import { PrimaryButton } from "@/components/mono/primary-button";
import { cn } from "@/lib/utils";

type QuoteHeroScreenProps = {
  quote?: string;
  author?: string;
  ctaLabel?: string;
  className?: string;
};

export function QuoteHeroScreen({
  quote = "Focus is a decision you make again every morning.",
  author = "CAT99 Coach",
  ctaLabel = "Save quote",
  className,
}: QuoteHeroScreenProps) {
  return (
    <section className={cn(styles.screenFrame, styles.screenFrameTabs, styles.quoteScreen, className)}>
      <blockquote className={styles.quoteText}>“{quote}”</blockquote>
      <cite className={styles.quoteAuthor}>— {author}</cite>
      <PrimaryButton variant="outline">{ctaLabel}</PrimaryButton>
      <BottomTabBar activeId="home" />
    </section>
  );
}
