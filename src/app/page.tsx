"use client";

import {
  BookOpen,
  Check,
  MessageCircle,
  MoreHorizontal,
  NotebookPen,
  Pencil,
  Sparkles,
  Trash2,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { APP_CONTENT_HEIGHT, AppContent } from "@/components/app-content";
import { AppNavbar } from "@/components/app-navbar";
import { AppNavbarActions } from "@/components/app-navbar-actions";
import { CalendarHeatmap, HabitsInsightsList, KPIStatTiles, LineChartCard, SegmentedControl } from "@/components/mono";
import styles from "@/components/mono/mono-ui.module.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuthAndTheme } from "@/hooks/use-auth-and-theme";
import { cn } from "@/lib/utils";

type HabitRecord = {
  id: string;
  label: string;
  completions?: string[];
  doneOn?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

const padDate = (value: number) => String(value).padStart(2, "0");

const getDateKey = (date: Date) => `${date.getFullYear()}-${padDate(date.getMonth() + 1)}-${padDate(date.getDate())}`;

const getTodayKey = () => getDateKey(new Date());

const DATE_LOCALE = "en-GB";
const WEEKDAY_FORMATTER = new Intl.DateTimeFormat(DATE_LOCALE, { weekday: "short" });
const HEATMAP_LABEL_FORMATTER = new Intl.DateTimeFormat(DATE_LOCALE, {
  weekday: "short",
  month: "short",
  day: "numeric",
});

type DaySummary = {
  key: string;
  label: string;
  date: Date;
  completions: number;
  rate: number;
};

const buildRecentDays = (count: number, completionMap: Map<string, number>, totalHabits: number) => {
  const days: DaySummary[] = [];
  const now = new Date();

  for (let i = count - 1; i >= 0; i -= 1) {
    const day = new Date(now);
    day.setDate(now.getDate() - i);
    const key = getDateKey(day);
    const completions = completionMap.get(key) ?? 0;
    const rate = totalHabits ? Math.round((completions / totalHabits) * 100) : 0;
    const label = WEEKDAY_FORMATTER.format(day);
    days.push({ key, label, date: day, completions, rate });
  }

  return days;
};

const rangeOptions = [
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
];

export default function Page() {
  const { handleLogout, handleThemeToggle } = useAuthAndTheme();
  const [habitDraft, setHabitDraft] = useState("");
  const [habits, setHabits] = useState<HabitRecord[]>([]);
  const [habitsLoading, setHabitsLoading] = useState(true);
  const [habitsError, setHabitsError] = useState<string | null>(null);
  const [habitsSaving, setHabitsSaving] = useState(false);
  const [habitActionId, setHabitActionId] = useState<string | null>(null);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [range, setRange] = useState("weekly");
  const destinations = [
    {
      title: "Chat",
      description: "Ask, analyze, and work with your CAT prep copilot.",
      href: "/chat",
      icon: MessageCircle,
      tone: "bg-muted text-foreground",
    },
    {
      title: "Games",
      description: "Practice drills, track streaks, and sharpen speed.",
      href: "/games",
      icon: Trophy,
      tone: "bg-muted text-foreground",
    },
    {
      title: "Notes",
      description: "Capture structured learnings and revision summaries.",
      href: "/notes",
      icon: NotebookPen,
      tone: "bg-muted text-foreground",
    },
    {
      title: "Papers",
      description: "Browse CAT & XAT past papers with solutions.",
      href: "/papers",
      icon: BookOpen,
      tone: "bg-muted text-foreground",
    },
    {
      title: "Rough notes",
      description: "Dump quick thoughts, drafts, and scratch ideas.",
      href: "/rough-notes",
      icon: Sparkles,
      tone: "bg-muted text-foreground",
    },
  ];
  const todayKey = getTodayKey();
  const totalHabits = habits.length;

  const completionMap = useMemo(() => {
    const map = new Map<string, number>();
    habits.forEach(habit => {
      const completions = Array.isArray(habit.completions) ? habit.completions : habit.doneOn ? [habit.doneOn] : [];
      completions.forEach(dateKey => {
        if (typeof dateKey !== "string") return;
        map.set(dateKey, (map.get(dateKey) ?? 0) + 1);
      });
    });
    return map;
  }, [habits]);

  const firstHabitKey = useMemo(() => {
    let earliest: number | null = null;
    habits.forEach(habit => {
      if (!habit.createdAt) return;
      const time = new Date(habit.createdAt).getTime();
      if (Number.isNaN(time)) return;
      if (earliest === null || time < earliest) {
        earliest = time;
      }
    });
    return earliest ? getDateKey(new Date(earliest)) : null;
  }, [habits]);

  const weeklyDays = useMemo(() => buildRecentDays(7, completionMap, totalHabits), [completionMap, totalHabits]);
  const twoWeekDays = useMemo(() => buildRecentDays(14, completionMap, totalHabits), [completionMap, totalHabits]);
  const monthlyDays = useMemo(() => buildRecentDays(28, completionMap, totalHabits), [completionMap, totalHabits]);

  const weeklySeries = useMemo(() => weeklyDays.map(day => day.rate), [weeklyDays]);
  const weeklyLabels = useMemo(() => weeklyDays.map(day => day.label), [weeklyDays]);

  const monthlySeries = useMemo(() => {
    const series: number[] = [];
    const labels: string[] = [];
    const chunkSize = 7;

    for (let i = 0; i < monthlyDays.length; i += chunkSize) {
      const slice = monthlyDays.slice(i, i + chunkSize);
      if (!slice.length) continue;
      const average = Math.round(slice.reduce((sum, day) => sum + day.rate, 0) / slice.length);
      series.push(average);
      labels.push(`W${series.length}`);
    }

    return { series, labels };
  }, [monthlyDays]);

  const activeSeries = range === "monthly" ? monthlySeries.series : weeklySeries;
  const activeLabels = range === "monthly" ? monthlySeries.labels : weeklyLabels;
  const averageScore = activeSeries.length
    ? Math.round(activeSeries.reduce((sum, value) => sum + value, 0) / activeSeries.length)
    : 0;

  const todayCompletions = completionMap.get(todayKey) ?? 0;
  const todayRate = totalHabits ? Math.round((todayCompletions / totalHabits) * 100) : 0;
  const weeklyAverage = weeklyDays.length
    ? Math.round(weeklyDays.reduce((sum, day) => sum + day.rate, 0) / weeklyDays.length)
    : 0;
  const bestDayLabel = weeklyDays.length
    ? weeklyDays.reduce((best, day) => (day.rate > best.rate ? day : best)).label
    : "—";

  const trend = useMemo(() => {
    if (weeklyDays.length < 6) return 0;
    const last = weeklyDays.slice(-3);
    const prev = weeklyDays.slice(-6, -3);
    const lastAvg = last.reduce((sum, day) => sum + day.rate, 0) / last.length;
    const prevAvg = prev.reduce((sum, day) => sum + day.rate, 0) / prev.length;
    if (!prevAvg) return 0;
    return Math.round(((lastAvg - prevAvg) / prevAvg) * 100);
  }, [weeklyDays]);

  const streak = useMemo(() => {
    let count = 0;
    for (let i = monthlyDays.length - 1; i >= 0; i -= 1) {
      if (monthlyDays[i].completions > 0) {
        count += 1;
      } else {
        break;
      }
    }
    return count;
  }, [monthlyDays]);

  const kpiStats = useMemo(() => {
    const trendLabel = trend ? `${trend > 0 ? "+" : ""}${trend}%` : undefined;
    return [
      { id: "habits", label: "Habits", value: `${totalHabits}` },
      {
        id: "today",
        label: "Done today",
        value: totalHabits ? `${todayCompletions}/${totalHabits}` : "0",
        delta: totalHabits ? `${todayRate}%` : undefined,
        direction: "up" as const,
      },
      {
        id: "average",
        label: "7d avg",
        value: `${weeklyAverage}%`,
        delta: trendLabel,
        direction: trend >= 0 ? ("up" as const) : ("down" as const),
      },
      { id: "streak", label: "Streak", value: `${streak} days` },
    ];
  }, [streak, todayCompletions, todayRate, totalHabits, trend, weeklyAverage]);

  const habitInsights = useMemo(() => {
    if (!habits.length) return [];
    const prevWeekKeys = new Set(twoWeekDays.slice(0, 7).map(day => day.key));
    const currentWeekKeys = new Set(twoWeekDays.slice(-7).map(day => day.key));

    return habits
      .map(habit => {
        const completions = Array.isArray(habit.completions) ? habit.completions : habit.doneOn ? [habit.doneOn] : [];
        const currentCount = completions.filter(dateKey => currentWeekKeys.has(dateKey)).length;
        const prevCount = completions.filter(dateKey => prevWeekKeys.has(dateKey)).length;
        const currentRate = currentWeekKeys.size ? Math.round((currentCount / currentWeekKeys.size) * 100) : 0;
        const prevRate = prevWeekKeys.size ? Math.round((prevCount / prevWeekKeys.size) * 100) : 0;
        const delta = currentRate - prevRate;

        return {
          id: habit.id,
          label: habit.label,
          percent: delta,
          currentRate,
        };
      })
      .sort((a, b) => b.currentRate - a.currentRate)
      .slice(0, 4)
      .map(({ id, label, percent }) => ({ id, label, percent }));
  }, [habits, twoWeekDays]);

  const heatmapDays = useMemo(
    () =>
      monthlyDays.map(day => {
        const missing = totalHabits === 0 || (firstHabitKey ? day.key < firstHabitKey : false);
        const intensity = totalHabits ? Math.min(4, Math.round((day.completions / totalHabits) * 4)) : 0;
        return {
          id: day.key,
          label: HEATMAP_LABEL_FORMATTER.format(day.date),
          intensity: intensity as 0 | 1 | 2 | 3 | 4,
          missing,
          selected: day.key === todayKey,
        };
      }),
    [firstHabitKey, monthlyDays, todayKey, totalHabits]
  );

  const fetchHabits = useCallback(async () => {
    setHabitsLoading(true);
    setHabitsError(null);
    try {
      const response = await fetch("/api/habits", {
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Sign in to track habits.");
        }
        throw new Error("Unable to load habits.");
      }

      const data = await response.json().catch(() => ({}));
      const rawHabits = Array.isArray(data?.habits) ? data.habits : [];
      const normalizedHabits = rawHabits.map((habit: HabitRecord) => {
        const rawCompletions = Array.isArray(habit?.completions)
          ? habit.completions.filter((value): value is string => typeof value === "string")
          : [];
        const doneOn = typeof habit?.doneOn === "string" ? habit.doneOn : null;
        const completions = Array.from(new Set([...rawCompletions, ...(doneOn ? [doneOn] : [])]));

        return {
          ...habit,
          completions,
          doneOn,
        };
      });
      setHabits(normalizedHabits);
    } catch (err) {
      setHabitsError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setHabitsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchHabits();
  }, [fetchHabits]);

  const handleAddHabit = useCallback(async () => {
    const label = habitDraft.trim();
    if (!label || habitsSaving) return;

    setHabitsSaving(true);
    setHabitsError(null);
    try {
      const response = await fetch("/api/habits", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ label }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Sign in to add habits.");
        }
        throw new Error("Unable to add habit.");
      }

      const data = await response.json().catch(() => ({}));
      const habitId = typeof data?.habitId === "string" ? data.habitId : `habit-${Date.now()}`;
      const now = new Date().toISOString();
      setHabits(prev => [
        { id: habitId, label, completions: [], doneOn: null, createdAt: now, updatedAt: now },
        ...prev,
      ]);
      setHabitDraft("");
    } catch (err) {
      setHabitsError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setHabitsSaving(false);
    }
  }, [habitDraft, habitsSaving]);

  const handleToggleHabit = useCallback(async (habit: HabitRecord) => {
    const todayKey = getTodayKey();
    const previousCompletions = Array.isArray(habit.completions)
      ? habit.completions
      : habit.doneOn
        ? [habit.doneOn]
        : [];
    const wasDone = previousCompletions.includes(todayKey);
    const nextCompleted = !wasDone;
    const updatedCompletions = nextCompleted
      ? Array.from(new Set([...previousCompletions, todayKey]))
      : previousCompletions.filter(dateKey => dateKey !== todayKey);

    setHabitsError(null);
    setHabits(prev =>
      prev.map(item =>
        item.id === habit.id
          ? { ...item, completions: updatedCompletions, doneOn: nextCompleted ? todayKey : null }
          : item
      )
    );

    try {
      const response = await fetch(`/api/habits/${encodeURIComponent(habit.id)}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ dateKey: todayKey, completed: nextCompleted }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Sign in to update habits.");
        }
        throw new Error("Unable to update habit.");
      }
    } catch (err) {
      setHabits(prev =>
        prev.map(item =>
          item.id === habit.id
            ? {
                ...item,
                completions: previousCompletions,
                doneOn: habit.doneOn ?? null,
              }
            : item
        )
      );
      setHabitsError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }, []);

  const handleStartEdit = useCallback((habit: HabitRecord) => {
    setEditingHabitId(habit.id);
    setEditingDraft(habit.label);
    setMenuOpenId(null);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingHabitId(null);
    setEditingDraft("");
  }, []);

  const handleSaveEdit = useCallback(
    async (habit: HabitRecord) => {
      const nextLabel = editingDraft.trim();
      if (!nextLabel) {
        setHabitsError("Habit name cannot be empty.");
        return;
      }
      if (habitActionId === habit.id) return;
      if (nextLabel === habit.label) {
        handleCancelEdit();
        return;
      }

      const previousLabel = habit.label;
      setHabitsError(null);
      setHabitActionId(habit.id);
      setHabits(prev => prev.map(item => (item.id === habit.id ? { ...item, label: nextLabel } : item)));

      try {
        const response = await fetch(`/api/habits/${encodeURIComponent(habit.id)}`, {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ label: nextLabel }),
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Sign in to update habits.");
          }
          throw new Error("Unable to update habit.");
        }

        handleCancelEdit();
      } catch (err) {
        setHabits(prev => prev.map(item => (item.id === habit.id ? { ...item, label: previousLabel } : item)));
        setHabitsError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setHabitActionId(null);
      }
    },
    [editingDraft, habitActionId, handleCancelEdit]
  );

  const handleDeleteHabit = useCallback(
    async (habit: HabitRecord) => {
      if (habitActionId === habit.id) return;
      const confirmed = window.confirm(`Delete "${habit.label}"? This cannot be undone.`);
      if (!confirmed) return;

      if (editingHabitId === habit.id) {
        handleCancelEdit();
      }

      const previousHabits = habits;
      setMenuOpenId(null);
      setHabitsError(null);
      setHabitActionId(habit.id);
      setHabits(prev => prev.filter(item => item.id !== habit.id));

      try {
        const response = await fetch(`/api/habits/${encodeURIComponent(habit.id)}`, {
          method: "DELETE",
          credentials: "include",
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Sign in to delete habits.");
          }
          throw new Error("Unable to delete habit.");
        }
      } catch (err) {
        setHabits(previousHabits);
        setHabitsError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setHabitActionId(null);
      }
    },
    [editingHabitId, habitActionId, habits, handleCancelEdit]
  );

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <AppNavbar
        title="Cat99"
        subtitle="Quick navigation"
        trailing={
          <AppNavbarActions
            value="chat"
            onChange={next => {
              if (next === "chat") {
                window.location.href = "/chat";
              } else if (next === "notes") {
                window.location.href = "/notes";
              } else if (next === "saved") {
                window.location.href = "/rough-notes";
              } else if (next === "games") {
                window.location.href = "/games";
              } else if (next === "papers") {
                window.location.href = "/papers";
              }
            }}
            onLogout={handleLogout}
            onThemeToggle={handleThemeToggle}
          />
        }
      />

      <AppContent className={APP_CONTENT_HEIGHT}>
        <div className="h-full min-h-0 overflow-y-auto py-4 sm:py-6">
          <div className="space-y-6 pb-6">
            <section className="game-panel relative overflow-hidden">
              <div className="relative game-panel-padded space-y-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="game-chip">Dashboard</span>
                      <span>Habit momentum</span>
                    </div>
                    <h1 className="text-xl font-semibold tracking-tight">Daily rhythm</h1>
                    <p className="max-w-2xl text-sm text-muted-foreground">
                      A quick scan of your habit cadence, streaks, and weekly momentum.
                    </p>
                  </div>
                  <SegmentedControl options={rangeOptions} value={range} onChange={setRange} />
                </div>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                  <LineChartCard
                    title={range === "monthly" ? "Monthly completion" : "Weekly completion"}
                    value={`${averageScore}%`}
                    series={activeSeries.length ? activeSeries : [0]}
                    labels={activeLabels}
                    activeIndex={Math.max(activeSeries.length - 1, 0)}
                  />
                  <div className="space-y-4">
                    <KPIStatTiles items={kpiStats} />
                    <div className={styles.card}>
                      <div className={styles.sectionTitle}>Activity heatmap</div>
                      <CalendarHeatmap days={heatmapDays} />
                      <div className={cn(styles.faintText, "mt-2 text-xs")}>Last 4 weeks</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="game-panel relative overflow-hidden">
              <div className="relative game-panel-padded space-y-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="game-chip">Habits</span>
                    <span>Tap to mark done today</span>
                  </div>
                  <h2 className="text-lg font-semibold tracking-tight">Daily check-in</h2>
                  <p className="max-w-2xl text-sm text-muted-foreground">
                    Add habits and click them to toggle completion. Your rhythm updates instantly.
                  </p>
                </div>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                  <Card className="bg-card">
                    <CardHeader className="space-y-2">
                      <CardTitle className="text-base">Today</CardTitle>
                      <CardDescription>Tap a habit to toggle its status.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Input
                          value={habitDraft}
                          onChange={event => setHabitDraft(event.target.value)}
                          onKeyDown={event => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              handleAddHabit();
                            }
                          }}
                          placeholder="Add a habit"
                          className="min-w-0 flex-1"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={handleAddHabit}
                          disabled={!habitDraft.trim() || habitsSaving}
                        >
                          Add habit
                        </Button>
                      </div>

                      {habitsError ? <p className="text-xs text-muted-foreground">{habitsError}</p> : null}

                      <div className="space-y-2">
                        {habitsLoading ? (
                          <div className="rounded-3xl border border-dashed border-border/60 bg-muted/30 px-3 py-3 text-xs text-muted-foreground">
                            Loading habits...
                          </div>
                        ) : habits.length ? (
                          habits.map(habit => {
                            const completions = Array.isArray(habit.completions)
                              ? habit.completions
                              : habit.doneOn
                                ? [habit.doneOn]
                                : [];
                            const isDone = completions.includes(todayKey);
                            const isEditing = editingHabitId === habit.id;
                            const isBusy = habitActionId === habit.id;
                            const rowClassName = cn(
                              "flex items-center gap-2 rounded-3xl border px-3 py-2 text-sm transition",
                              isDone
                                ? "border-foreground/60 bg-foreground/5 text-foreground"
                                : "border-border/60 bg-background hover:border-foreground/30 hover:bg-muted/40"
                            );

                            return (
                              <div key={habit.id} className={rowClassName}>
                                {isEditing ? (
                                  <div className="flex flex-1 flex-wrap items-center gap-2">
                                    <Input
                                      value={editingDraft}
                                      onChange={event => setEditingDraft(event.target.value)}
                                      onKeyDown={event => {
                                        if (event.key === "Enter") {
                                          event.preventDefault();
                                          void handleSaveEdit(habit);
                                        }
                                        if (event.key === "Escape") {
                                          event.preventDefault();
                                          handleCancelEdit();
                                        }
                                      }}
                                      placeholder="Habit name"
                                      className="h-[var(--chip-h)] min-w-[12rem] flex-1"
                                      autoFocus
                                      disabled={isBusy}
                                    />
                                    <div className="flex items-center gap-2">
                                      <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => void handleSaveEdit(habit)}
                                        disabled={isBusy || !editingDraft.trim()}
                                      >
                                        Save
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleCancelEdit}
                                        disabled={isBusy}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleHabit(habit)}
                                    aria-pressed={isDone}
                                    disabled={isBusy}
                                    className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left"
                                  >
                                    <span className="font-medium">{habit.label}</span>
                                    <span
                                      className={`inline-flex items-center gap-1 rounded-4xl border px-2 py-0.5 text-xs font-semibold ${
                                        isDone
                                          ? "border-foreground/40 bg-foreground/5 text-foreground"
                                          : "border-border-strong bg-muted text-muted-foreground"
                                      }`}
                                    >
                                      {isDone ? <Check className="h-3 w-3" /> : null}
                                      {isDone ? "Done" : "Not done"}
                                    </span>
                                  </button>
                                )}

                                <Popover
                                  open={menuOpenId === habit.id}
                                  onOpenChange={open => setMenuOpenId(open ? habit.id : null)}
                                >
                                  <PopoverTrigger asChild>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon-sm"
                                      aria-label={`Habit options for ${habit.label}`}
                                      disabled={isBusy}
                                      className="shrink-0"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-40 p-2" align="end">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="w-full justify-start gap-2"
                                      onClick={() => handleStartEdit(habit)}
                                      disabled={isBusy}
                                    >
                                      <Pencil className="h-4 w-4" />
                                      Edit
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="w-full justify-start gap-2"
                                      onClick={() => void handleDeleteHabit(habit)}
                                      disabled={isBusy}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      Delete
                                    </Button>
                                  </PopoverContent>
                                </Popover>
                              </div>
                            );
                          })
                        ) : (
                          <div className="rounded-3xl border border-dashed border-border/60 bg-muted/30 px-3 py-3 text-xs text-muted-foreground">
                            No habits yet. Add one above to start tracking.
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-4">
                    {habitInsights.length ? (
                      <HabitsInsightsList title="Consistency shift" items={habitInsights} />
                    ) : (
                      <div className={styles.card}>
                        <div className={styles.sectionTitle}>Consistency shift</div>
                        <p className={cn(styles.mutedText, "mt-2 text-sm")}>
                          Add a few habits to unlock weekly change insights.
                        </p>
                      </div>
                    )}
                    <div className={styles.card}>
                      <div className={styles.sectionTitle}>Weekly wrap</div>
                      <div className="mt-3 grid gap-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className={styles.mutedText}>Average score</span>
                          <span>{weeklyAverage}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={styles.mutedText}>Best day</span>
                          <span>{bestDayLabel}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={styles.mutedText}>Current streak</span>
                          <span>{streak} days</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="game-panel relative overflow-hidden">
              <div className="relative game-panel-padded space-y-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="game-chip">Workspaces</span>
                    <span>Jump back in</span>
                  </div>
                  <h2 className="text-lg font-semibold tracking-tight">Where do you want to go?</h2>
                  <p className="max-w-2xl text-sm text-muted-foreground">
                    Jump straight into chat, practice games, structured notes, or your rough scratchpad.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {destinations.map(destination => {
                    const Icon = destination.icon;
                    return (
                      <Card key={destination.title} className="bg-card">
                        <CardHeader className="space-y-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-4xl ${destination.tone}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="space-y-1">
                            <CardTitle className="text-base">{destination.title}</CardTitle>
                            <CardDescription>{destination.description}</CardDescription>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <Button asChild variant="secondary" className="w-full">
                            <Link href={destination.href}>Open</Link>
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>
        </div>
      </AppContent>
    </div>
  );
}
