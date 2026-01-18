import {
  BottomTabBar,
  CalendarHeatmap,
  ChipPillsRow,
  DonutDistribution,
  HabitsInsightsList,
  HeaderRow,
  HeroIllustrationCard,
  KPIStatTiles,
  LessonFinishedScreen,
  LessonPlayerScreen,
  LineChartCard,
  MoodDial,
  OnboardingScreen,
  QuoteHeroScreen,
  SegmentedControl,
} from "@/components/mono";
import styles from "@/components/mono/mono-ui.module.css";
import { cn } from "@/lib/utils";

const chipItems = [
  { id: "focus", label: "Focus", selected: true },
  { id: "quant", label: "Quant" },
  { id: "varc", label: "VARC" },
  { id: "dilr", label: "DILR" },
];

const heatmapDays = Array.from({ length: 28 }, (_, index) => {
  const intensity = index % 5;
  const missing = index % 11 === 0;
  return {
    id: `day-${index}`,
    label: `Day ${index + 1}`,
    intensity: missing ? 0 : (intensity as 0 | 1 | 2 | 3 | 4),
    missing,
    selected: index === 13,
  };
});

const kpiStats = [
  { id: "sessions", label: "Sessions", value: "18", delta: "+4", direction: "up" as const },
  { id: "accuracy", label: "Accuracy", value: "86%", delta: "+2%", direction: "up" as const },
  { id: "streak", label: "Streak", value: "9 days", delta: "+1", direction: "up" as const },
  { id: "breaks", label: "Breaks", value: "3", delta: "-2", direction: "down" as const },
];

const lineSeries = [62, 70, 68, 75, 72, 82, 78];
const lineLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const donutSegments = [
  { label: "Quant", value: 45 },
  { label: "VARC", value: 30 },
  { label: "DILR", value: 25 },
];

const habitInsights = [
  { id: "morning", label: "Morning drills", percent: 12 },
  { id: "review", label: "Review notes", percent: 6 },
  { id: "late", label: "Late sessions", percent: -8 },
];

const segments = [
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
];

export default function Page() {
  return (
    <main className={styles.demoPage}>
      <header className={styles.demoHeader}>
        <div className={styles.demoEyebrow}>Monochrome UI</div>
        <h1 className={styles.demoTitle}>CAT99 refreshed screens</h1>
      </header>

      <section className={styles.demoGrid} aria-label="Dashboard and analytics">
        <div className={cn(styles.screenFrame, styles.screenFrameTabs)}>
          <HeaderRow title="Dashboard" subtitle="Today" showAction actionLabel="Add" />
          <HeroIllustrationCard />
          <ChipPillsRow items={chipItems} />
          <div className={styles.card}>
            <div className={styles.sectionTitle}>Activity heatmap</div>
            <CalendarHeatmap days={heatmapDays} />
          </div>
          <KPIStatTiles items={kpiStats} />
          <BottomTabBar activeId="dashboard" />
        </div>

        <div className={cn(styles.screenFrame, styles.screenFrameTabs)}>
          <HeaderRow title="Analytics" subtitle="Last 7 days" showBack backLabel="Back" />
          <SegmentedControl options={segments} value="weekly" />
          <LineChartCard series={lineSeries} labels={lineLabels} activeIndex={5} />
          <DonutDistribution segments={donutSegments} />
          <HabitsInsightsList items={habitInsights} />
          <BottomTabBar activeId="dashboard" />
        </div>
      </section>

      <section className={styles.demoGrid} aria-label="Mood and lessons">
        <div className="theme-scope" data-theme="dark">
          <MoodDial />
        </div>
        <div className="theme-scope" data-theme="dark">
          <LessonPlayerScreen />
        </div>
        <div className="theme-scope" data-theme="dark">
          <LessonFinishedScreen />
        </div>
      </section>

      <section className={styles.demoGrid} aria-label="Standalone screens">
        <div className="theme-scope" data-theme="dark">
          <QuoteHeroScreen />
        </div>
        <div className="theme-scope" data-theme="light">
          <OnboardingScreen caption="Day 01" title="Start with calm, focused blocks." />
        </div>
        <div className="theme-scope" data-theme="dark">
          <OnboardingScreen caption="Night mode" title="Unwind with a short recap ritual." />
        </div>
      </section>
    </main>
  );
}
