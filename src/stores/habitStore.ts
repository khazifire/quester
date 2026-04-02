import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import type { Habit, HabitLog } from "@/lib/types";

interface HabitStatus {
  habit: Habit;
  completed: boolean;
  streak: number;
}

interface HabitState {
  habits: Habit[];
  logs: HabitLog[];

  addHabit: (habit: Omit<Habit, "id" | "createdAt">) => string;
  updateHabit: (id: string, partial: Partial<Habit>) => void;
  deactivateHabit: (id: string) => void;
  toggleToday: (habitId: string) => void;

  getTodayStatus: () => HabitStatus[];
  getStreak: (habitId: string) => number;
  getCompletionRate: (habitId: string, days?: number) => number;
}

function getDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

export const useHabitStore = create<HabitState>()(
  persist(
    (set, get) => ({
      habits: [],
      logs: [],

      addHabit: (habit) => {
        const id = nanoid();
        set((s) => ({
          habits: [...s.habits, { ...habit, id, createdAt: Date.now() }],
        }));
        return id;
      },
      updateHabit: (id, partial) =>
        set((s) => ({
          habits: s.habits.map((h) => (h.id === id ? { ...h, ...partial } : h)),
        })),
      deactivateHabit: (id) =>
        set((s) => ({
          habits: s.habits.map((h) => (h.id === id ? { ...h, active: false } : h)),
        })),
      toggleToday: (habitId) => {
        const today = getDateStr(new Date());
        const existing = get().logs.find(
          (l) => l.habitId === habitId && l.date === today
        );
        if (existing) {
          set((s) => ({
            logs: s.logs.map((l) =>
              l.id === existing.id ? { ...l, completed: !l.completed } : l
            ),
          }));
        } else {
          set((s) => ({
            logs: [
              ...s.logs,
              { id: nanoid(), habitId, date: today, completed: true },
            ],
          }));
        }
      },

      getTodayStatus: () => {
        const today = getDateStr(new Date());
        const { habits, logs } = get();
        return habits
          .filter((h) => h.active)
          .map((habit) => {
            const log = logs.find(
              (l) => l.habitId === habit.id && l.date === today
            );
            return {
              habit,
              completed: log?.completed ?? false,
              streak: get().getStreak(habit.id),
            };
          });
      },
      getStreak: (habitId) => {
        const { logs } = get();
        const habitLogs = logs
          .filter((l) => l.habitId === habitId)
          .sort((a, b) => b.date.localeCompare(a.date));

        let streak = 0;
        const d = new Date();
        for (let i = 0; i < 365; i++) {
          const dateStr = getDateStr(d);
          const log = habitLogs.find((l) => l.date === dateStr);
          if (log && log.completed) {
            streak++;
          } else {
            break;
          }
          d.setDate(d.getDate() - 1);
        }
        return streak;
      },
      getCompletionRate: (habitId, days = 30) => {
        const { logs } = get();
        const d = new Date();
        let completed = 0;
        for (let i = 0; i < days; i++) {
          const dateStr = getDateStr(d);
          const log = logs.find(
            (l) => l.habitId === habitId && l.date === dateStr
          );
          if (log?.completed) completed++;
          d.setDate(d.getDate() - 1);
        }
        return days > 0 ? completed / days : 0;
      },
    }),
    {
      name: "questline-habits",
      version: 1,
    }
  )
);
