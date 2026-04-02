import { MaskedAmount } from "@/components/shared/MaskedAmount";
import { useFinanceStore } from "@/stores/financeStore";
import { useCurrencyStore } from "@/stores/currencyStore";
import type { SavingGoal } from "@/lib/types";

interface SavingGoalCardProps {
  goal: SavingGoal;
  variant?: "compact" | "full";
}

export function SavingGoalCard({ goal, variant = "compact" }: SavingGoalCardProps) {
  const expenses = useFinanceStore((s) => s.expenses);
  const savingGoals = useFinanceStore((s) => s.savingGoals);
  const convert = useCurrencyStore((s) => s.convert);
  const emGoal = savingGoals.find((g) => g.isEmergency);
  const avgExp = (() => {
    const now = new Date();
    let total = 0, count = 0;
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const me = expenses.filter((e) => e.date.startsWith(key));
      if (me.length > 0) { total += me.reduce((s, e) => s + convert(e.amount, e.currency), 0); count++; }
    }
    return count > 0 ? Math.round(total / count) : 0;
  })();
  const emMonths = emGoal && avgExp > 0 ? convert(emGoal.savedAmount, emGoal.currency) / avgExp : 0;
  const pct = Math.round((goal.savedAmount / goal.targetAmount) * 100);
  const monthsLeft = goal.monthlyContribution > 0
    ? Math.ceil((goal.targetAmount - goal.savedAmount) / goal.monthlyContribution)
    : Infinity;

  const cur = goal.currency;

  return (
    <div className={variant === "full" ? "bg-card p-4" : ""}>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-[14px] text-foreground">{goal.name}</span>
        <span className="text-[18px] font-medium tabular-nums">{pct}%</span>
      </div>
      {goal.isEmergency && (
        <div className="text-[11px] text-muted-foreground mb-2">
          {emMonths.toFixed(1)} months covered
        </div>
      )}
      {cur && (
        <div className="text-[11px] text-muted-foreground mb-2 font-mono">{cur}</div>
      )}
      <div className="w-full h-1 bg-white/[0.06] mb-2">
        <div
          className="h-full bg-foreground/40 transition-all"
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-[11px] text-muted-foreground">
        <span className="font-mono tabular-nums"><MaskedAmount value={goal.savedAmount} currency={cur} showOriginal /></span>
        <span className="font-mono tabular-nums"><MaskedAmount value={goal.targetAmount} currency={cur} showOriginal /></span>
      </div>
      {variant === "full" && goal.monthlyContribution > 0 && monthsLeft !== Infinity && (
        <div className="mt-2.5 text-[11px] text-muted-foreground">
          <MaskedAmount value={goal.monthlyContribution} currency={cur} showOriginal />/mo &rarr; {monthsLeft} months
        </div>
      )}
    </div>
  );
}
