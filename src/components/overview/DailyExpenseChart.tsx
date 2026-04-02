import { useMemo } from "react";
import { useFinanceStore } from "@/stores/financeStore";
import { useCurrencyStore } from "@/stores/currencyStore";
import { MaskedAmount } from "@/components/shared/MaskedAmount";
import { getMonthKey } from "@/lib/utils";

export function DailyExpenseChart() {
  const allExpenses = useFinanceStore((s) => s.expenses);
  const categories = useFinanceStore((s) => s.categories);
  const getAvgMonthlyExpenses = useFinanceStore((s) => s.getAvgMonthlyExpenses);
  const getMonthlyIncome = useFinanceStore((s) => s.getMonthlyIncome);
  const convert = useCurrencyStore((s) => s.convert);
  const monthKey = getMonthKey();
  const expenses = useMemo(
    () => allExpenses.filter((e) => e.date.startsWith(monthKey)),
    [allExpenses, monthKey]
  );

  const now = new Date();
  const currentDay = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dailyTotals: { day: number; total: number; future: boolean }[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dayTotal = expenses
      .filter((e) => e.date === dateStr)
      .reduce((sum, e) => sum + convert(e.amount, e.currency), 0);
    dailyTotals.push({ day: d, total: dayTotal, future: d > currentDay });
  }

  const maxAmt = Math.max(...dailyTotals.map((d) => d.total), 1);
  const totalSoFar = expenses.reduce((sum, e) => sum + convert(e.amount, e.currency), 0);
  const monthName = now.toLocaleDateString("en-US", { month: "short" });
  const avgMonthly = getAvgMonthlyExpenses();
  const monthlyIncome = getMonthlyIncome(monthKey);
  const incomePct = monthlyIncome > 0 ? Math.round((totalSoFar / monthlyIncome) * 100) : null;

  // Top categories
  const catTotals = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach((e) => {
      map.set(e.categoryId, (map.get(e.categoryId) || 0) + convert(e.amount, e.currency));
    });
    return [...map.entries()]
      .map(([catId, total]) => ({
        category: categories.find((c) => c.id === catId),
        total,
      }))
      .filter((c) => c.category)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [expenses, categories, convert]);

  return (
    <div>
      <div className="text-[12px] uppercase tracking-[0.06em] text-muted-foreground mb-3">
        Expenses
      </div>

      <div className="flex gap-6 mb-4">
        <div>
          <div className="text-[22px] font-medium tabular-nums">
            <MaskedAmount value={Math.round(avgMonthly)} />
          </div>
          <div className="text-[12px] text-muted-foreground">Avg/mo</div>
        </div>
        <div>
          <div className="text-[22px] font-medium tabular-nums">
            <MaskedAmount value={Math.round(totalSoFar)} />
          </div>
          <div className="text-[12px] text-muted-foreground">This month</div>
        </div>
        {incomePct !== null && (
          <div>
            <div className="text-[22px] font-medium tabular-nums">{incomePct}%</div>
            <div className="text-[12px] text-muted-foreground">Of income</div>
          </div>
        )}
      </div>

      {/* Custom bar chart */}
      <div className="flex items-end gap-[2px] h-20 mb-1">
        {dailyTotals.map((d) => {
          const heightPct = d.total > 0 ? Math.max((d.total / maxAmt) * 100, 4) : 0;
          return (
            <div
              key={d.day}
              className="flex-1 flex flex-col justify-end h-full"
            >
              <div
                className="w-full transition-all duration-300"
                style={{
                  height: d.total > 0 ? `${heightPct}%` : "2px",
                  backgroundColor: d.future
                    ? "rgba(255,255,255,0.04)"
                    : d.total > 0
                      ? "rgba(255,255,255,0.55)"
                      : "rgba(255,255,255,0.08)",
                  minHeight: 2,
                }}
              />
            </div>
          );
        })}
      </div>

      <div className="flex justify-between mb-3">
        <span className="text-[11px] text-muted-foreground font-mono">
          {monthName} 1
        </span>
        <span className="text-[11px] text-muted-foreground font-mono">
          {monthName} {daysInMonth}
        </span>
      </div>

      {catTotals.length > 0 && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-3">
          {catTotals.map((c) => (
            <div key={c.category!.id} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: c.category!.color }}
                />
                <span className="text-[11px] text-muted-foreground truncate">
                  {c.category!.name}
                </span>
              </div>
              <span className="text-[11px] font-mono tabular-nums text-muted-foreground">
                <MaskedAmount value={Math.round(c.total)} />
              </span>
            </div>
          ))}
        </div>
      )}

      <a
        href="/finances/expenses"
        className="text-[11px] text-muted-foreground hover:text-foreground"
      >
        View all &rarr;
      </a>
    </div>
  );
}
