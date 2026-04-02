import { useMemo } from "react";
import { MaskedAmount } from "@/components/shared/MaskedAmount";
import { useFinanceStore } from "@/stores/financeStore";
import { useCurrencyStore } from "@/stores/currencyStore";
import { getMonthKey } from "@/lib/utils";

export function CategoryBreakdown() {
  const allExpenses = useFinanceStore((s) => s.expenses);
  const categories = useFinanceStore((s) => s.categories);
  const convert = useCurrencyStore((s) => s.convert);
  const monthKey = getMonthKey();

  const breakdown = useMemo(() => {
    const monthExpenses = allExpenses.filter((e) => e.date.startsWith(monthKey));
    const map = new Map<string, number>();
    monthExpenses.forEach((e) => {
      map.set(e.categoryId, (map.get(e.categoryId) || 0) + convert(e.amount, e.currency));
    });
    return categories
      .filter((c) => map.has(c.id))
      .map((c) => ({ category: c, total: map.get(c.id)! }))
      .sort((a, b) => b.total - a.total);
  }, [allExpenses, categories, monthKey, convert]);

  const maxVal = Math.max(...breakdown.map((b) => b.total), 1);

  return (
    <div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-[0.06em] mb-3">
        By Category
      </div>
      {breakdown.map((b) => (
        <div key={b.category.id} className="flex items-center gap-3 py-1.5">
          <span className="text-[11px] text-foreground flex-1">{b.category.name}</span>
          <div className="w-20 h-1 bg-white/[0.06] shrink-0">
            <div
              className="h-full bg-foreground/40 transition-all"
              style={{ width: `${(b.total / maxVal) * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground font-mono tabular-nums w-14 text-right">
            <MaskedAmount value={Math.round(b.total)} />
          </span>
        </div>
      ))}
      {breakdown.length === 0 && (
        <p className="text-[10px] text-muted-foreground py-3">
          No expenses this month
        </p>
      )}
    </div>
  );
}
