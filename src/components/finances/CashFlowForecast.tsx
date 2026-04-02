import { useMemo } from "react";
import { MaskedAmount } from "@/components/shared/MaskedAmount";
import { useFinanceStore } from "@/stores/financeStore";
import { useProjectStore } from "@/stores/projectStore";
import { useCurrencyStore } from "@/stores/currencyStore";

export function CashFlowForecast() {
  const projects = useProjectStore((s) => s.projects);
  const expenses = useFinanceStore((s) => s.expenses);
  const convert = useCurrencyStore((s) => s.convert);

  const mrr = useMemo(
    () =>
      projects
        .filter((p) => p.billingType === "retainer" && p.status === "active")
        .reduce((sum, p) => sum + convert(p.amount, p.currency), 0),
    [projects, convert]
  );

  const avgExp = useMemo(() => {
    const now = new Date();
    let total = 0;
    let count = 0;
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const monthExpenses = expenses.filter((e) => e.date.startsWith(key));
      if (monthExpenses.length > 0) {
        total += monthExpenses.reduce((s, e) => s + convert(e.amount, e.currency), 0);
        count++;
      }
    }
    return count > 0 ? Math.round(total / count) : 0;
  }, [expenses, convert]);

  const forecast = useMemo(() => {
    const now = new Date();
    const result: { month: string; projected: number }[] = [];
    for (let i = 1; i <= 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthName = d.toLocaleDateString("en-US", { month: "short" });
      result.push({ month: monthName, projected: mrr - avgExp });
    }
    return result;
  }, [mrr, avgExp]);

  return (
    <div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-[0.06em] mb-3">
        Forecast
      </div>
      {forecast.map((f) => {
        const isPositive = f.projected > 0;
        return (
          <div key={f.month} className="flex items-center gap-3 py-1.5 border-b border-border last:border-0">
            <span className="text-[11px] text-foreground w-8">{f.month}</span>
            <div className="flex-1 h-1 bg-white/[0.06]">
              <div
                className="h-full bg-foreground/30 transition-all"
                style={{ width: `${Math.min((Math.abs(f.projected) / 15000) * 100, 100)}%` }}
              />
            </div>
            <span className={`text-[11px] font-mono tabular-nums w-16 text-right ${isPositive ? "text-foreground" : "text-destructive"}`}>
              {isPositive ? "+" : ""}
              <MaskedAmount value={f.projected} />
            </span>
          </div>
        );
      })}
      <div className="mt-2 text-[9px] text-muted-foreground">
        MRR <MaskedAmount value={mrr} /> &minus; Avg exp <MaskedAmount value={avgExp} />
      </div>
    </div>
  );
}
