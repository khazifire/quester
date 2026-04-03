import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { MetricCard } from "@/components/shared/MetricCard";
import { useHabitStore } from "@/stores/habitStore";

type CategoryFilter = "all" | "system" | "finance" | "health" | "growth" | "work";

const CATEGORY_LABELS: Record<string, string> = {
  all: "All",
  system: "System",
  finance: "Finance",
  health: "Health",
  growth: "Growth",
  work: "Work",
};

function getDotColor(completed: boolean, isToday: boolean, isFuture: boolean): string {
  if (isFuture) return "rgba(255,255,255,0.05)";
  if (completed) return "rgba(255,255,255,0.75)";
  if (isToday) return "rgba(255,255,255,0.15)";
  return "rgba(255,255,255,0.09)";
}

export default function HabitsPage() {
  const habits = useHabitStore((s) => s.habits);
  const logs = useHabitStore((s) => s.logs);
  const toggleToday = useHabitStore((s) => s.toggleToday);
  const getStreak = useHabitStore((s) => s.getStreak);
  const getCompletionRate = useHabitStore((s) => s.getCompletionRate);

  const [filter, setFilter] = useState<CategoryFilter>("all");

  const today = new Date().toISOString().split("T")[0];
  const now = new Date();

  // Last 30 days array (oldest → newest)
  const last30 = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      return d.toISOString().split("T")[0];
    }),
    []
  );

  const activeHabits = habits.filter((h) => h.active);
  const filtered = filter === "all" ? activeHabits : activeHabits.filter((h) => h.category === filter);

  // Today's completion
  const doneToday = activeHabits.filter((h) =>
    logs.some((l) => l.habitId === h.id && l.date === today && l.completed)
  ).length;

  // Best streak across all habits
  const bestStreak = useMemo(() => {
    if (activeHabits.length === 0) return { streak: 0, name: "" };
    return activeHabits.reduce(
      (best, h) => {
        const s = getStreak(h.id);
        return s > best.streak ? { streak: s, name: h.name } : best;
      },
      { streak: 0, name: "" }
    );
  }, [activeHabits, logs]);

  // 30-day avg completion across all habits
  const avgCompletion30 = useMemo(() => {
    if (activeHabits.length === 0) return 0;
    const rates = activeHabits.map((h) => getCompletionRate(h.id, 30));
    return Math.round((rates.reduce((s, r) => s + r, 0) / rates.length) * 100);
  }, [activeHabits, logs]);

  // Perfect days this month (all active habits completed)
  const perfectDaysThisMonth = useMemo(() => {
    if (activeHabits.length === 0) return 0;
    let count = 0;
    for (let d = 1; d <= now.getDate(); d++) {
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const allDone = activeHabits.every((h) =>
        logs.some((l) => l.habitId === h.id && l.date === dateStr && l.completed)
      );
      if (allDone) count++;
    }
    return count;
  }, [activeHabits, logs, now]);

  return (
    <AppShell title="Habits">
      {activeHabits.length === 0 ? (
        <p className="text-[12px] text-muted-foreground text-center py-12">
          Add habits in Settings to start tracking
        </p>
      ) : (
        <div className="space-y-8">
          {/* Metrics */}
          <div className="grid grid-cols-5 gap-6 pb-5 border-b border-border">
            <MetricCard
              label="Active habits"
              value={String(activeHabits.length)}
              subtitle="being tracked"
            />
            <MetricCard
              label="Done today"
              value={`${doneToday}/${activeHabits.length}`}
              subtitle={doneToday === activeHabits.length ? "perfect day" : "completed"}
            />
            <MetricCard
              label="Best streak"
              value={`${bestStreak.streak} day${bestStreak.streak !== 1 ? "s" : ""}`}
              subtitle={bestStreak.name || "—"}
            />
            <MetricCard
              label="30-day avg"
              value={`${avgCompletion30}%`}
              subtitle="completion rate"
            />
            <MetricCard
              label="Perfect days"
              value={String(perfectDaysThisMonth)}
              subtitle="this month"
            />
          </div>

          {/* Category filter */}
          <div className="flex gap-4 border-b border-border pb-2.5 -mt-2">
            {(Object.keys(CATEGORY_LABELS) as CategoryFilter[]).map((cat) => {
              const count = cat === "all" ? activeHabits.length : activeHabits.filter((h) => h.category === cat).length;
              if (cat !== "all" && count === 0) return null;
              return (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`text-[13px] pb-1 transition-opacity cursor-pointer ${
                    filter === cat
                      ? "text-foreground border-b border-foreground/40"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {CATEGORY_LABELS[cat]}
                  {cat !== "all" && <span className="ml-1.5 text-[11px] text-muted-foreground/60">{count}</span>}
                </button>
              );
            })}
          </div>

          {/* Habit rows */}
          <div>
            {/* Header */}
            <div className="grid grid-cols-[28px_1fr_280px_60px_50px_44px] gap-3 items-center px-0 py-2 text-[11px] uppercase tracking-[0.06em] text-muted-foreground border-b border-border">
              <span></span>
              <span>Habit</span>
              <span className="text-right pr-1">Last 30 days</span>
              <span className="text-right">Streak</span>
              <span className="text-right">30d</span>
              <span></span>
            </div>

            {filtered.map((habit) => {
              const streak = getStreak(habit.id);
              const rate = Math.round(getCompletionRate(habit.id, 30) * 100);
              const completedToday = logs.some(
                (l) => l.habitId === habit.id && l.date === today && l.completed
              );

              return (
                <div
                  key={habit.id}
                  className="grid grid-cols-[28px_1fr_280px_60px_50px_44px] gap-3 items-center py-3 border-b border-border last:border-0"
                >
                  {/* Icon */}
                  <span className="text-[18px] leading-none">{habit.icon}</span>

                  {/* Name + category */}
                  <div className="min-w-0">
                    <div className="text-[13px] truncate">{habit.name}</div>
                    <div className="text-[11px] text-muted-foreground/60 capitalize mt-0.5">{habit.category}</div>
                  </div>

                  {/* 30-day dot grid */}
                  <div className="flex gap-[3px] items-center justify-end">
                    {last30.map((dateStr) => {
                      const completed = logs.some(
                        (l) => l.habitId === habit.id && l.date === dateStr && l.completed
                      );
                      const isToday = dateStr === today;
                      const isFuture = dateStr > today;
                      return (
                        <div
                          key={dateStr}
                          title={dateStr}
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: 2,
                            flexShrink: 0,
                            backgroundColor: getDotColor(completed, isToday, isFuture),
                            outline: isToday ? "1px solid rgba(255,255,255,0.2)" : "none",
                            outlineOffset: 1,
                          }}
                        />
                      );
                    })}
                  </div>

                  {/* Streak */}
                  <div className="text-right">
                    <span className="text-[13px] font-mono tabular-nums">{streak}</span>
                    <span className="text-[10px] text-muted-foreground ml-0.5">d</span>
                  </div>

                  {/* 30-day rate */}
                  <div className="text-right">
                    <span className={`text-[12px] font-mono tabular-nums ${rate >= 70 ? "text-foreground" : rate >= 40 ? "text-muted-foreground" : "text-muted-foreground/50"}`}>
                      {rate}%
                    </span>
                  </div>

                  {/* Toggle today */}
                  <button
                    onClick={() => toggleToday(habit.id)}
                    title={completedToday ? "Mark undone" : "Mark done"}
                    className="cursor-pointer ml-auto flex items-center justify-center w-7 h-7 rounded-full transition-all"
                    style={{
                      backgroundColor: completedToday ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${completedToday ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.10)"}`,
                    }}
                  >
                    {completedToday && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2.5 2.5L8 3" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Monthly heatmap — all habits combined */}
          <div>
            <span className="text-[12px] text-muted-foreground uppercase tracking-[0.06em] mb-3 block">
              {now.toLocaleDateString("en-US", { month: "long", year: "numeric" })} — daily completion
            </span>
            <MonthHeatmap habits={activeHabits} logs={logs} now={now} today={today} />
          </div>
        </div>
      )}
    </AppShell>
  );
}

function MonthHeatmap({
  habits,
  logs,
  now,
  today,
}: {
  habits: { id: string }[];
  logs: { habitId: string; date: string; completed: boolean }[];
  now: Date;
  today: string;
}) {
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1;
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const isFuture = dateStr > today;
    if (isFuture) return { d, dateStr, rate: -1 };
    const done = habits.filter((h) =>
      logs.some((l) => l.habitId === h.id && l.date === dateStr && l.completed)
    ).length;
    const rate = habits.length > 0 ? done / habits.length : 0;
    return { d, dateStr, rate };
  });

  const monthName = now.toLocaleDateString("en-US", { month: "short" });

  return (
    <div>
      <div className="flex gap-[3px] flex-wrap">
        {days.map(({ d, dateStr, rate }) => {
          const isFuture = rate === -1;
          const isToday = dateStr === today;
          let bg: string;
          if (isFuture) bg = "rgba(255,255,255,0.04)";
          else if (rate === 0) bg = "rgba(255,255,255,0.07)";
          else if (rate < 0.5) bg = "rgba(255,255,255,0.20)";
          else if (rate < 1) bg = "rgba(255,255,255,0.45)";
          else bg = "rgba(255,255,255,0.80)";

          return (
            <div
              key={d}
              title={`${monthName} ${d}: ${isFuture ? "upcoming" : rate === -1 ? "—" : `${Math.round(rate * 100)}%`}`}
              style={{
                width: 18,
                height: 18,
                borderRadius: 3,
                backgroundColor: bg,
                outline: isToday ? "1px solid rgba(255,255,255,0.3)" : "none",
                outlineOffset: 1,
              }}
            />
          );
        })}
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-[11px] text-muted-foreground font-mono">{monthName} 1</span>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60">
          <div className="flex gap-1 items-center">
            <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.07)" }} />
            <span>0%</span>
          </div>
          <div className="flex gap-1 items-center">
            <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.20)" }} />
            <span>&lt;50%</span>
          </div>
          <div className="flex gap-1 items-center">
            <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.80)" }} />
            <span>100%</span>
          </div>
        </div>
        <span className="text-[11px] text-muted-foreground font-mono">{monthName} {daysInMonth}</span>
      </div>
    </div>
  );
}
