import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import type { Run, RunningEvent, RunCost } from "@/lib/types";
import { STANDARD_DISTANCES } from "@/lib/constants";
import { useFinanceStore } from "./financeStore";
import { useCurrencyStore } from "./currencyStore";

interface PersonalBest {
  label: string;
  distanceKm: number;
  run: Run;
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

  getPersonalBests: () => PersonalBest[];
  getRunningStreak: () => number;
  getTotalDistance: (monthKey?: string) => number;
  getTotalRuns: (monthKey?: string) => number;
  getAveragePace: () => number;
  getTotalSpent: () => number;
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

      getPersonalBests: () => {
        const { runs } = get();
        const bests: PersonalBest[] = [];
        for (const dist of STANDARD_DISTANCES) {
          const matching = runs.filter(
            (r) => Math.abs(r.distanceKm - dist.km) <= dist.tolerance && r.durationSeconds > 0
          );
          if (matching.length === 0) continue;
          const fastest = matching.reduce((best, r) =>
            r.durationSeconds < best.durationSeconds ? r : best
          );
          bests.push({
            label: dist.label,
            distanceKm: dist.km,
            run: fastest,
            pace: fastest.durationSeconds / fastest.distanceKm,
          });
        }
        return bests;
      },

      getRunningStreak: () => {
        const { runs } = get();
        const runDates = new Set(runs.map((r) => r.date));
        let streak = 0;
        const d = new Date();
        for (let i = 0; i < 365; i++) {
          const dateStr = getDateStr(d);
          if (runDates.has(dateStr)) {
            streak++;
          } else {
            break;
          }
          d.setDate(d.getDate() - 1);
        }
        return streak;
      },

      getTotalDistance: (monthKey) => {
        const { runs } = get();
        const filtered = monthKey ? runs.filter((r) => r.date.startsWith(monthKey)) : runs;
        return filtered.reduce((sum, r) => sum + r.distanceKm, 0);
      },

      getTotalRuns: (monthKey) => {
        const { runs } = get();
        return monthKey ? runs.filter((r) => r.date.startsWith(monthKey)).length : runs.length;
      },

      getAveragePace: () => {
        const { runs } = get();
        const valid = runs.filter((r) => r.durationSeconds > 0 && r.distanceKm > 0);
        if (valid.length === 0) return 0;
        const totalSeconds = valid.reduce((s, r) => s + r.durationSeconds, 0);
        const totalKm = valid.reduce((s, r) => s + r.distanceKm, 0);
        return totalSeconds / totalKm;
      },

      getTotalSpent: () => {
        const convert = useCurrencyStore.getState().convert;
        return get().costs.reduce((sum, c) => sum + convert(c.amount, c.currency), 0);
      },
    }),
    {
      name: "questline-running",
      version: 1,
    }
  )
);
