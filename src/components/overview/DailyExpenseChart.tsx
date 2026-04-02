import { useMemo } from "react";
import { useFinanceStore } from "@/stores/financeStore";
import { useCurrencyStore } from "@/stores/currencyStore";
import { MaskedAmount } from "@/components/shared/MaskedAmount";
import { getMonthKey } from "@/lib/utils";

export function DailyExpenseChart() {
  const allExpenses = useFinanceStore((s) => s.expenses);
  const convert = useCurrencyStore((s) => s.convert);
  const monthKey = getMonthKey();
  const expenses = useMemo(
    () => allExpenses.filter((e) => e.date.startsWith(monthKey)),
    [allExpenses, monthKey]
  );

  const now = new Date();
  const currentDay = now.getDate();
  const dailyTotals: { day: number; total: number }[] = [];
  for (let d = 1; d <= currentDay; d++) {
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dayTotal = expenses
      .filter((e) => e.date === dateStr)
      .reduce((sum, e) => sum + convert(e.amount, e.currency), 0);
    dailyTotals.push({ day: d, total: dayTotal });
  }

  const maxAmt = Math.max(...dailyTotals.map((d) => d.total), 1);
  const totalSoFar = expenses.reduce((sum, e) => sum + convert(e.amount, e.currency), 0);
  const monthName = now.toLocaleDateString("en-US", { month: "short" });

  return (
    <div>
      <div className="flex justify-between items-baseline mb-3">
        <span className="text-[12px] uppercase tracking-[0.06em] text-muted-foreground">
          Expenses
        </span>
        <span className="text-[14px] tabular-nums font-mono">
          <MaskedAmount value={Math.round(totalSoFar)} />
        </span>
      </div>

      {/* Custom bar chart */}
      <div className="flex items-end gap-[3px] h-24 mb-1">
        {dailyTotals.map((d) => {
          const heightPct = d.total > 0 ? Math.max((d.total / maxAmt) * 100, 4) : 0;
          return (
            <div
              key={d.day}
              className="flex-1 flex flex-col justify-end h-full"
            >
              <div
                className="w-full transition-all duration-300 group relative"
                style={{
                  height: d.total > 0 ? `${heightPct}%` : "2px",
                  backgroundColor: d.total > 0 ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.08)",
                  minHeight: d.total > 0 ? 4 : 2,
                }}
              />
            </div>
          );
        })}
      </div>

      <div className="flex justify-between">
        <span className="text-[11px] text-muted-foreground font-mono">
          {monthName} 1
        </span>
        <span className="text-[11px] text-muted-foreground font-mono">
          {monthName} {currentDay}
        </span>
      </div>
    </div>
  );
}
