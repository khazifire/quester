import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import type { Run, RunningEvent, RunCost, RunActivity } from "@/lib/types";
import { STANDARD_DISTANCES } from "@/lib/constants";
import { useFinanceStore } from "./financeStore";
import { useCurrencyStore } from "./currencyStore";

interface PersonalBest {
  label: string;
  distanceKm: number;
  type: "road" | "spartan" | "other";
  activity: RunActivity;
  pace: number;
}

interface RunningState {
  runs: Run[];
  events: RunningEvent[];
  costs: RunCost[];

  addRun: (run: Omit<Run, "id" | "createdAt">) => string;
  updateRun: (id: string, partial: Partial<Run>) => void;
  deleteRun: (id: string) => void;

  addEvent: (event: Omit<RunningEvent, "id" | "createdAt">) => string;
  updateEvent: (id: string, partial: Partial<RunningEvent>) => void;
  deleteEvent: (id: string) => void;

  addCost: (cost: Omit<RunCost, "id" | "createdAt" | "expenseId">) => string;
  deleteCost: (id: string) => void;

  getRunCosts: (runId: string) => RunCost[];
  getEventCosts: (eventId: string) => RunCost[];

  // Unified: runs + completed events with finish time
  getAllActivities: () => RunActivity[];

  getPersonalBests: () => PersonalBest[];
  getRunningStreak: () => number;
  getTotalDistance: (monthKey?: string) => number;
  getTotalRuns: (monthKey?: string) => number;
  getAveragePace: () => number;
  getTotalSeconds: (monthKey?: string) => number;
  getYearlyKm: () => number;
  getTotalSpent: () => number;
  getWeeklyData: (weeks?: number) => { label: string; km: number }[];
  getMonthlyData: (months?: number) => { month: string; km: number; count: number }[];
  getWeekdayData: () => { day: string; km: number; count: number }[];
}

function getDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

export const useRunningStore = create<RunningState>()(
  persist(
    (set, get) => ({
      runs: [],
      events: [],
      costs: [],

      addRun: (run) => {
        const id = nanoid();
        set((s) => ({ runs: [...s.runs, { ...run, id, createdAt: Date.now() }] }));
        return id;
      },
      updateRun: (id, partial) =>
        set((s) => ({
          runs: s.runs.map((r) => (r.id === id ? { ...r, ...partial } : r)),
        })),
      deleteRun: (id) => {
        const costsToDelete = get().costs.filter((c) => c.runId === id);
        const fs = useFinanceStore.getState();
        costsToDelete.forEach((c) => fs.deleteExpense(c.expenseId));
        set((s) => ({
          runs: s.runs.filter((r) => r.id !== id),
          costs: s.costs.filter((c) => c.runId !== id),
        }));
      },

      addEvent: (event) => {
        const id = nanoid();
        set((s) => ({ events: [...s.events, { ...event, id, createdAt: Date.now() }] }));
        if (event.entryFee > 0) {
          const expenseId = useFinanceStore.getState().addExpense({
            amount: event.entryFee,
            currency: event.currency,
            name: `Entry: ${event.name}`,
            categoryId: "cat-running",
            date: event.date,
            subscriptionId: null,
          });
          set((s) => ({
            costs: [
              ...s.costs,
              {
                id: nanoid(),
                runId: null,
                eventId: id,
                type: "entry" as const,
                name: `Entry: ${event.name}`,
                amount: event.entryFee,
                currency: event.currency,
                expenseId,
                createdAt: Date.now(),
              },
            ],
          }));
        }
        return id;
      },
      updateEvent: (id, partial) =>
        set((s) => ({
          events: s.events.map((e) => (e.id === id ? { ...e, ...partial } : e)),
        })),
      deleteEvent: (id) => {
        const costsToDelete = get().costs.filter((c) => c.eventId === id);
        const fs = useFinanceStore.getState();
        costsToDelete.forEach((c) => fs.deleteExpense(c.expenseId));
        set((s) => ({
          events: s.events.filter((e) => e.id !== id),
          costs: s.costs.filter((c) => c.eventId !== id),
        }));
      },

      addCost: (cost) => {
        const id = nanoid();
        const date = (() => {
          if (cost.runId) {
            const run = get().runs.find((r) => r.id === cost.runId);
            if (run) return run.date;
          }
          if (cost.eventId) {
            const event = get().events.find((e) => e.id === cost.eventId);
            if (event) return event.date;
          }
          return getDateStr(new Date());
        })();
        const expenseId = useFinanceStore.getState().addExpense({
          amount: cost.amount,
          currency: cost.currency,
          name: cost.name,
          categoryId: "cat-running",
          date,
          subscriptionId: null,
        });
        set((s) => ({
          costs: [...s.costs, { ...cost, id, expenseId, createdAt: Date.now() }],
        }));
        return id;
      },
      deleteCost: (id) => {
        const cost = get().costs.find((c) => c.id === id);
        if (cost) {
          useFinanceStore.getState().deleteExpense(cost.expenseId);
        }
        set((s) => ({ costs: s.costs.filter((c) => c.id !== id) }));
      },

      getRunCosts: (runId) => get().costs.filter((c) => c.runId === runId),
      getEventCosts: (eventId) => get().costs.filter((c) => c.eventId === eventId),

      getAllActivities: () => {
        const { runs, events } = get();
        const activities: RunActivity[] = [];
        for (const r of runs) {
          if (r.distanceKm > 0) {
            activities.push({
              id: r.id,
              name: r.name,
              date: r.date,
              distanceKm: r.distanceKm,
              durationSeconds: r.durationSeconds,
              type: "road",
              source: "run",
            });
          }
        }
        for (const e of events) {
          if (e.status === "completed" && e.finishSeconds && e.finishSeconds > 0 && e.distanceKm > 0) {
            activities.push({
              id: e.id,
              name: e.name,
              date: e.date,
              distanceKm: e.distanceKm,
              durationSeconds: e.finishSeconds,
              type: e.type ?? "road",
              source: "event",
            });
          }
        }
        return activities;
      },

      getPersonalBests: () => {
        const activities = get().getAllActivities();
        const bests: PersonalBest[] = [];
        const types = ["road", "spartan", "other"] as const;
        for (const dist of STANDARD_DISTANCES) {
          for (const type of types) {
            const matching = activities.filter(
              (a) =>
                a.type === type &&
                Math.abs(a.distanceKm - dist.km) <= dist.tolerance &&
                a.durationSeconds > 0
            );
            if (matching.length === 0) continue;
            const fastest = matching.reduce((best, a) =>
              a.durationSeconds < best.durationSeconds ? a : best
            );
            bests.push({
              label: dist.label,
              distanceKm: dist.km,
              type,
              activity: fastest,
              pace: fastest.durationSeconds / fastest.distanceKm,
            });
          }
        }
        return bests;
      },

      getRunningStreak: () => {
        const activities = get().getAllActivities();
        const activityDates = new Set(activities.map((a) => a.date));
        let streak = 0;
        const d = new Date();
        for (let i = 0; i < 365; i++) {
          const dateStr = getDateStr(d);
          if (activityDates.has(dateStr)) {
            streak++;
          } else {
            break;
          }
          d.setDate(d.getDate() - 1);
        }
        return streak;
      },

      getTotalDistance: (monthKey) => {
        const activities = get().getAllActivities();
        const filtered = monthKey
          ? activities.filter((a) => a.date.startsWith(monthKey))
          : activities;
        return filtered.reduce((sum, a) => sum + a.distanceKm, 0);
      },

      getTotalRuns: (monthKey) => {
        const activities = get().getAllActivities();
        return monthKey
          ? activities.filter((a) => a.date.startsWith(monthKey)).length
          : activities.length;
      },

      getAveragePace: () => {
        const activities = get().getAllActivities();
        const valid = activities.filter((a) => a.durationSeconds > 0 && a.distanceKm > 0);
        if (valid.length === 0) return 0;
        const totalSeconds = valid.reduce((s, a) => s + a.durationSeconds, 0);
        const totalKm = valid.reduce((s, a) => s + a.distanceKm, 0);
        return totalSeconds / totalKm;
      },

      getTotalSeconds: (monthKey) => {
        const activities = get().getAllActivities();
        const filtered = monthKey
          ? activities.filter((a) => a.date.startsWith(monthKey))
          : activities;
        return filtered.reduce((sum, a) => sum + a.durationSeconds, 0);
      },

      getYearlyKm: () => {
        const activities = get().getAllActivities();
        const yearKey = String(new Date().getFullYear());
        return activities
          .filter((a) => a.date.startsWith(yearKey))
          .reduce((s, a) => s + a.distanceKm, 0);
      },

      getTotalSpent: () => {
        const convert = useCurrencyStore.getState().convert;
        return get().costs.reduce((sum, c) => sum + convert(c.amount, c.currency), 0);
      },

      getWeeklyData: (weeks = 12) => {
        const activities = get().getAllActivities();
        const now = new Date();
        const result: { label: string; km: number }[] = [];
        for (let i = weeks - 1; i >= 0; i--) {
          const d = new Date(now);
          const dayOfWeek = d.getDay();
          const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
          d.setDate(d.getDate() + diffToMonday - i * 7);
          d.setHours(0, 0, 0, 0);
          const weekEnd = new Date(d);
          weekEnd.setDate(d.getDate() + 6);
          const startStr = getDateStr(d);
          const endStr = getDateStr(weekEnd);
          const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          const filtered = activities.filter((a) => a.date >= startStr && a.date <= endStr);
          result.push({
            label,
            km: Math.round(filtered.reduce((s, a) => s + a.distanceKm, 0) * 10) / 10,
          });
        }
        return result;
      },

      getMonthlyData: (months = 12) => {
        const activities = get().getAllActivities();
        const now = new Date();
        const result: { month: string; km: number; count: number }[] = [];
        for (let i = months - 1; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
          const filtered = activities.filter((a) => a.date.startsWith(key));
          result.push({
            month: label,
            km: Math.round(filtered.reduce((s, a) => s + a.distanceKm, 0) * 10) / 10,
            count: filtered.length,
          });
        }
        return result;
      },

      getWeekdayData: () => {
        const activities = get().getAllActivities();
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const sums = new Array(7).fill(0);
        const counts = new Array(7).fill(0);
        for (const a of activities) {
          const d = new Date(a.date + "T12:00:00");
          const dow = (d.getDay() + 6) % 7; // 0=Mon, 6=Sun
          sums[dow] += a.distanceKm;
          counts[dow]++;
        }
        return days.map((day, i) => ({
          day,
          km: counts[i] > 0 ? Math.round((sums[i] / counts[i]) * 10) / 10 : 0,
          count: counts[i],
        }));
      },
    }),
    {
      name: "questline-running",
      version: 1,
    }
  )
);
