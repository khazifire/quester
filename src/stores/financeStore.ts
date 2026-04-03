import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import type {
  Expense,
  Subscription,
  Invoice,
  SavingGoal,
  ExpenseCategory,
  Income,
} from "@/lib/types";
import { DEFAULT_CATEGORIES } from "@/lib/constants";
import { useProjectStore } from "./projectStore";
import { useCurrencyStore } from "./currencyStore";

interface FinanceState {
  expenses: Expense[];
  subscriptions: Subscription[];
  invoices: Invoice[];
  savingGoals: SavingGoal[];
  categories: ExpenseCategory[];
  incomes: Income[];

  addExpense: (expense: Omit<Expense, "id" | "createdAt">) => string;
  updateExpense: (id: string, partial: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  quickAddExpense: (amount: number, name: string, categoryId: string, currency?: string) => string;

  addSubscription: (sub: Omit<Subscription, "id">) => string;
  updateSubscription: (id: string, partial: Partial<Subscription>) => void;
  deleteSubscription: (id: string) => void;
  advanceSubscription: (subId: string) => void;

  addInvoice: (invoice: Omit<Invoice, "id" | "createdAt" | "projectId">) => string;
  updateInvoice: (id: string, partial: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  markInvoicePaid: (invoiceId: string) => void;

  addSavingGoal: (goal: Omit<SavingGoal, "id">) => string;
  updateSavingGoal: (id: string, partial: Partial<SavingGoal>) => void;
  deleteSavingGoal: (id: string) => void;
  addToSavingGoal: (goalId: string, amount: number) => void;

  addCategory: (cat: Omit<ExpenseCategory, "id">) => string;
  updateCategory: (id: string, partial: Partial<ExpenseCategory>) => void;
  deleteCategory: (id: string) => void;

  materializedMonths: string[];
  addIncome: (income: Omit<Income, "id" | "createdAt">) => string;
  updateIncome: (id: string, partial: Partial<Income>) => void;
  deleteIncome: (id: string) => void;
  materializeMonth: (
    monthKey: string,
    retainerItems: { id: string; name: string; amount: number; currency?: string }[]
  ) => void;
  getMonthlyIncomeBreakdown: (monthKey: string) => { invoices: number; recurring: number; oneTime: number };

  getExpensesByMonth: (monthKey: string) => Expense[];
  getCategoryBreakdown: (monthKey: string) => { category: ExpenseCategory; total: number }[];
  getAvgMonthlyExpenses: (months?: number) => number;
  getSubTotal: () => number;
  getCashFlowForecast: (months: number) => { month: string; projected: number }[];
  getEmergencyMonths: () => number;
  getMonthlyIncome: (monthKey: string) => number;
  getCategoryById: (id: string) => ExpenseCategory | undefined;
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      expenses: [],
      subscriptions: [],
      invoices: [],
      savingGoals: [],
      categories: DEFAULT_CATEGORIES,
      incomes: [],
      materializedMonths: [],

      addExpense: (expense) => {
        const id = nanoid();
        set((s) => ({
          expenses: [...s.expenses, { ...expense, id, createdAt: Date.now() }],
        }));
        return id;
      },
      updateExpense: (id, partial) =>
        set((s) => ({
          expenses: s.expenses.map((e) => (e.id === id ? { ...e, ...partial } : e)),
        })),
      deleteExpense: (id) =>
        set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) })),
      quickAddExpense: (amount, name, categoryId, currency) => {
        const id = nanoid();
        const today = new Date().toISOString().split("T")[0];
        set((s) => ({
          expenses: [
            ...s.expenses,
            { id, amount, name, categoryId, currency, date: today, subscriptionId: null, createdAt: Date.now() },
          ],
        }));
        return id;
      },

      addSubscription: (sub) => {
        const id = nanoid();
        set((s) => ({ subscriptions: [...s.subscriptions, { ...sub, id }] }));
        return id;
      },
      updateSubscription: (id, partial) =>
        set((s) => ({
          subscriptions: s.subscriptions.map((sub) =>
            sub.id === id ? { ...sub, ...partial } : sub
          ),
        })),
      deleteSubscription: (id) =>
        set((s) => ({ subscriptions: s.subscriptions.filter((sub) => sub.id !== id) })),
      advanceSubscription: (subId) => {
        const sub = get().subscriptions.find((s) => s.id === subId);
        if (!sub || !sub.active) return;
        const expenseId = nanoid();
        const nextDate = new Date(sub.nextDate);
        if (sub.cycle === "monthly") {
          nextDate.setMonth(nextDate.getMonth() + 1);
        } else {
          nextDate.setFullYear(nextDate.getFullYear() + 1);
        }
        set((s) => ({
          expenses: [
            ...s.expenses,
            {
              id: expenseId,
              amount: sub.amount,
              name: sub.name,
              categoryId: sub.categoryId,
              currency: sub.currency,
              date: sub.nextDate,
              subscriptionId: sub.id,
              createdAt: Date.now(),
            },
          ],
          subscriptions: s.subscriptions.map((x) =>
            x.id === subId ? { ...x, nextDate: nextDate.toISOString().split("T")[0] } : x
          ),
        }));
      },

      addInvoice: (invoice) => {
        const id = nanoid();
        set((s) => ({
          invoices: [...s.invoices, { ...invoice, id, createdAt: Date.now() }],
        }));
        return id;
      },
      updateInvoice: (id, partial) =>
        set((s) => ({
          invoices: s.invoices.map((inv) => (inv.id === id ? { ...inv, ...partial } : inv)),
        })),
      deleteInvoice: (id) =>
        set((s) => ({ invoices: s.invoices.filter((inv) => inv.id !== id) })),
      markInvoicePaid: (invoiceId) =>
        set((s) => ({
          invoices: s.invoices.map((inv) =>
            inv.id === invoiceId
              ? { ...inv, status: "paid" as const, paidDate: new Date().toISOString().split("T")[0] }
              : inv
          ),
        })),

      addSavingGoal: (goal) => {
        const id = nanoid();
        set((s) => ({ savingGoals: [...s.savingGoals, { ...goal, id }] }));
        return id;
      },
      updateSavingGoal: (id, partial) =>
        set((s) => ({
          savingGoals: s.savingGoals.map((g) => (g.id === id ? { ...g, ...partial } : g)),
        })),
      deleteSavingGoal: (id) =>
        set((s) => ({ savingGoals: s.savingGoals.filter((g) => g.id !== id) })),
      addToSavingGoal: (goalId, amount) =>
        set((s) => ({
          savingGoals: s.savingGoals.map((g) =>
            g.id === goalId ? { ...g, savedAmount: g.savedAmount + amount } : g
          ),
        })),

      addCategory: (cat) => {
        const id = nanoid();
        set((s) => ({ categories: [...s.categories, { ...cat, id }] }));
        return id;
      },
      updateCategory: (id, partial) =>
        set((s) => ({
          categories: s.categories.map((c) => (c.id === id ? { ...c, ...partial } : c)),
        })),
      deleteCategory: (id) =>
        set((s) => ({
          categories: s.categories.filter((c) => c.id !== id),
        })),

      getExpensesByMonth: (monthKey) =>
        get().expenses.filter((e) => e.date.startsWith(monthKey)),
      getCategoryBreakdown: (monthKey) => {
        const convert = useCurrencyStore.getState().convert;
        const expenses = get().getExpensesByMonth(monthKey);
        const cats = get().categories;
        const map = new Map<string, number>();
        expenses.forEach((e) => {
          map.set(e.categoryId, (map.get(e.categoryId) || 0) + convert(e.amount, e.currency));
        });
        return cats
          .filter((c) => map.has(c.id))
          .map((c) => ({ category: c, total: map.get(c.id)! }))
          .sort((a, b) => b.total - a.total);
      },
      getAvgMonthlyExpenses: (months = 6) => {
        const convert = useCurrencyStore.getState().convert;
        const now = new Date();
        let total = 0;
        let count = 0;
        for (let i = 0; i < months; i++) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          const monthExpenses = get().getExpensesByMonth(key);
          if (monthExpenses.length > 0) {
            total += monthExpenses.reduce((s, e) => s + convert(e.amount, e.currency), 0);
            count++;
          }
        }
        return count > 0 ? Math.round(total / count) : 0;
      },
      getSubTotal: () => {
        const convert = useCurrencyStore.getState().convert;
        return get()
          .subscriptions.filter((s) => s.active)
          .reduce((sum, s) => sum + convert(s.amount, s.currency), 0);
      },
      getCashFlowForecast: (months) => {
        const convert = useCurrencyStore.getState().convert;
        const mrr = useProjectStore.getState().getMRR();
        // Add recurring salary/passive income to the forecast income side
        const recurringIncome = get().incomes
          .filter((i) => i.recurring && !i.isSnapshot && !i.endDate)
          .reduce((sum, i) => sum + convert(i.amount, i.currency), 0);
        const totalMonthlyIncome = mrr + recurringIncome;
        const avgExp = get().getAvgMonthlyExpenses();
        const now = new Date();
        const result: { month: string; projected: number }[] = [];
        for (let i = 1; i <= months; i++) {
          const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
          const monthName = d.toLocaleDateString("en-US", { month: "short" });
          result.push({ month: monthName, projected: totalMonthlyIncome - avgExp });
        }
        return result;
      },
      getEmergencyMonths: () => {
        const emGoal = get().savingGoals.find((g) => g.isEmergency);
        if (!emGoal) return 0;
        const avg = get().getAvgMonthlyExpenses();
        if (avg === 0) return 0;
        return emGoal.savedAmount / avg;
      },
      getMonthlyIncome: (monthKey) => {
        const breakdown = get().getMonthlyIncomeBreakdown(monthKey);
        return breakdown.invoices + breakdown.recurring + breakdown.oneTime;
      },
      getCategoryById: (id) => get().categories.find((c) => c.id === id),

      addIncome: (income) => {
        const id = nanoid();
        set((s) => ({ incomes: [...s.incomes, { ...income, id, createdAt: Date.now() }] }));
        return id;
      },
      updateIncome: (id, partial) =>
        set((s) => ({ incomes: s.incomes.map((inc) => (inc.id === id ? { ...inc, ...partial } : inc)) })),
      deleteIncome: (id) =>
        set((s) => ({ incomes: s.incomes.filter((inc) => inc.id !== id) })),

      materializeMonth: (monthKey, retainerItems) => {
        const { materializedMonths, incomes } = get();
        if (materializedMonths.includes(monthKey)) return;

        const convert = useCurrencyStore.getState().convert;
        const snapshots: Omit<typeof incomes[0], "id" | "createdAt">[] = [];

        // Snapshot active recurring income entries
        incomes
          .filter(
            (inc) =>
              inc.recurring &&
              !inc.isSnapshot &&
              inc.date.substring(0, 7) <= monthKey &&
              (!inc.endDate || inc.endDate >= monthKey)
          )
          .forEach((inc) => {
            snapshots.push({
              name: inc.name,
              amount: inc.amount,
              currency: inc.currency,
              category: inc.category,
              recurring: false,
              date: `${monthKey}-01`,
              isSnapshot: true,
              snapshotMonth: monthKey,
              sourceId: inc.id,
            });
          });

        // Snapshot active retainer projects
        retainerItems.forEach((p) => {
          snapshots.push({
            name: p.name,
            amount: convert(p.amount, p.currency),
            currency: useCurrencyStore.getState().mainCurrency,
            category: "freelance",
            recurring: false,
            date: `${monthKey}-01`,
            isSnapshot: true,
            snapshotMonth: monthKey,
            sourceId: p.id,
          });
        });

        const newIncomes = snapshots.map((s) => ({
          ...s,
          id: nanoid(),
          createdAt: Date.now(),
        }));

        set((state) => ({
          incomes: [...state.incomes, ...newIncomes],
          materializedMonths: [...state.materializedMonths, monthKey],
        }));
      },

      getMonthlyIncomeBreakdown: (monthKey) => {
        const convert = useCurrencyStore.getState().convert;
        const { invoices, incomes, materializedMonths } = get();

        const invoiceTotal = invoices
          .filter((inv) => inv.status === "paid" && inv.paidDate?.startsWith(monthKey))
          .reduce((sum, inv) => sum + convert(inv.amount, inv.currency), 0);

        const isMaterialized = materializedMonths.includes(monthKey);

        if (isMaterialized) {
          // Use snapshot records for this month
          const snapshotTotal = incomes
            .filter((inc) => inc.isSnapshot && inc.snapshotMonth === monthKey)
            .reduce((sum, inc) => sum + convert(inc.amount, inc.currency), 0);
          const oneTimeTotal = incomes
            .filter((inc) => !inc.isSnapshot && !inc.recurring && inc.date.startsWith(monthKey))
            .reduce((sum, inc) => sum + convert(inc.amount, inc.currency), 0);
          return { invoices: invoiceTotal, recurring: snapshotTotal, oneTime: oneTimeTotal };
        }

        // Dynamic computation for non-materialized months (future or current)
        const recurringTotal = incomes
          .filter(
            (inc) =>
              inc.recurring &&
              !inc.isSnapshot &&
              inc.date.substring(0, 7) <= monthKey &&
              (!inc.endDate || inc.endDate >= monthKey)
          )
          .reduce((sum, inc) => sum + convert(inc.amount, inc.currency), 0);
        const oneTimeTotal = incomes
          .filter((inc) => !inc.isSnapshot && !inc.recurring && inc.date.startsWith(monthKey))
          .reduce((sum, inc) => sum + convert(inc.amount, inc.currency), 0);
        return { invoices: invoiceTotal, recurring: recurringTotal, oneTime: oneTimeTotal };
      },
    }),
    {
      name: "questline-finance",
      version: 1,
    }
  )
);
