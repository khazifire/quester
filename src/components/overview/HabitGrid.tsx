import { useMemo } from "react";
import { useHabitStore } from "@/stores/habitStore";
import { useAppStore } from "@/stores/appStore";
import { HabitTile } from "@/components/shared/HabitTile";

export function HabitGrid() {
  const toggleToday = useHabitStore((s) => s.toggleToday);
  const habits = useHabitStore((s) => s.habits);
  const logs = useHabitStore((s) => s.logs);
  const getStreak = useHabitStore((s) => s.getStreak);
  const identityStatement = useAppStore((s) => s.identityStatement);

  const todayStatus = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return habits
      .filter((h) => h.active)
      .map((habit) => {
        const log = logs.find(
          (l) => l.habitId === habit.id && l.date === today
        );
        return {
          habit,
          completed: log?.completed ?? false,
          streak: getStreak(habit.id),
        };
      });
  }, [habits, logs, getStreak]);

  const completed = todayStatus.filter((h) => h.completed).length;
  const total = todayStatus.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div>
      <div className="flex justify-between items-baseline mb-3">
        <div className="flex items-baseline gap-3">
          <span className="text-[12px] uppercase tracking-[0.06em] text-muted-foreground">
            Systems
          </span>
          <span className="text-[13px] text-foreground/50">
            {completed}/{total}
          </span>
        </div>
        <span className="text-[22px] font-medium tabular-nums">{pct}%</span>
      </div>

      <div className="grid grid-cols-3 gap-px bg-border">
        {todayStatus.map((hs) => (
          <HabitTile
            key={hs.habit.id}
            icon={hs.habit.icon}
            name={hs.habit.name}
            streak={hs.streak}
            completed={hs.completed}
            onClick={() => toggleToday(hs.habit.id)}
          />
        ))}
      </div>

      {identityStatement && (
        <div className="mt-3 text-[12px] text-muted-foreground italic">
          &ldquo;{identityStatement}&rdquo;
        </div>
      )}
    </div>
  );
}
