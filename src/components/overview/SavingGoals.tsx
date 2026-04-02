import { useFinanceStore } from "@/stores/financeStore";
import { SavingGoalCard } from "@/components/finances/SavingGoalCard";
import Link from "next/link";

export function SavingGoals() {
  const goals = useFinanceStore((s) => s.savingGoals);

  return (
    <div>
      <div className="text-[12px] uppercase tracking-[0.06em] text-muted-foreground mb-3">
        Savings
      </div>
      {goals.map((g) => (
        <div key={g.id} className="py-2 border-b border-border last:border-0">
          <SavingGoalCard goal={g} />
        </div>
      ))}
      {goals.length === 0 && (
        <p className="text-[12px] text-muted-foreground py-4">No saving goals</p>
      )}
      {goals.length > 0 && (
        <Link
          href="/finances/savings"
          className="text-[11px] text-muted-foreground hover:text-foreground mt-2 block"
        >
          Manage &rarr;
        </Link>
      )}
    </div>
  );
}
