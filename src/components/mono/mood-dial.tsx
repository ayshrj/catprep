"use client";

import styles from "@/components/mono/mono-ui.module.css";
import { PrimaryButton } from "@/components/mono/primary-button";
import { cn } from "@/lib/utils";

type MoodDialProps = {
  value?: number;
  emoji?: string;
  label?: string;
  className?: string;
};

function polarToCartesian(center: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
  return {
    x: center + radius * Math.cos(angleInRadians),
    y: center + radius * Math.sin(angleInRadians),
  };
}

function describeArc(center: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(center, radius, endAngle);
  const end = polarToCartesian(center, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

export function MoodDial({ value = 72, emoji = "🙂", label = "Confirm mood", className }: MoodDialProps) {
  const clampedValue = Math.min(Math.max(value, 0), 100);
  const center = 100;
  const radius = 70;
  const startAngle = -140;
  const endAngle = 140;
  const sweep = endAngle - startAngle;
  const activeAngle = startAngle + (clampedValue / 100) * sweep;

  const trackPath = describeArc(center, radius, startAngle, endAngle);
  const activePath = describeArc(center, radius, startAngle, activeAngle);
  const knob = polarToCartesian(center, radius, activeAngle);

  return (
    <section className={cn(styles.screenFrame, styles.moodScreen, className)}>
      <div className={styles.sectionTitle}>Mood check-in</div>
      <div className={styles.moodDial}>
        <svg className={styles.moodSvg} viewBox="0 0 200 200" aria-hidden="true">
          <path className={styles.moodTrack} d={trackPath} />
          <path className={styles.moodActive} d={activePath} />
          <circle className={styles.moodKnob} cx={knob.x} cy={knob.y} r="var(--dial-knob)" />
        </svg>
        <div className={styles.moodCenter}>
          <div className={styles.moodEmoji}>{emoji}</div>
          <div className={styles.moodValue}>{clampedValue}</div>
          <div className={styles.faintText}>/ 100</div>
        </div>
      </div>
      <PrimaryButton>{label}</PrimaryButton>
    </section>
  );
}
