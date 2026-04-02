import { AppShell } from "@/components/layout/AppShell";
import { FinanceNav } from "@/components/layout/FinanceNav";
import { MaskedAmount } from "@/components/shared/MaskedAmount";
import { IncomeExpenseChart } from "@/components/finances/IncomeExpenseChart";
import { CategoryBreakdown } from "@/components/finances/CategoryBreakdown";
import { PaymentTimeline } from "@/components/finances/PaymentTimeline";
import { CashFlowForecast } from "@/components/finances/CashFlowForecast";
import { SavingGoalCard } from "@/components/finances/SavingGoalCard";
import { QuickAdd } from "@/components/finances/QuickAdd";
import { useFinanceStore } from "@/stores/financeStore";
import { useProjectStore } from "@/stores/projectStore";
import { useCurrencyStore } from "@/stores/currencyStore";
import { getMonthKey } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function FinancesReportPage() {
  const monthKey = getMonthKey();
  const allInvoices = useFinanceStore((s) => s.invoices);
  const allExpenses = useFinanceStore((s) => s.expenses);
  const subscriptions = useFinanceStore((s) => s.subscriptions);
  const savingGoals = useFinanceStore((s) => s.savingGoals);
  const projects = useProjectStore((s) => s.projects);

  const convert = useCurrencyStore((s) => s.convert);

  const income = allInvoices
    .filter((inv) => inv.status === "paid" && inv.paidDate?.startsWith(monthKey))
    .reduce((sum, inv) => sum + convert(inv.amount, inv.currency), 0);
  const monthExpenses = allExpenses.filter((e) => e.date.startsWith(monthKey));
  const totalExpenses = monthExpenses.reduce((sum, e) => sum + convert(e.amount, e.currency), 0);
  const net = income - totalExpenses;
  const savingsRate = income > 0 ? Math.round((net / income) * 100) : 0;
  const mrr = projects
    .filter((p) => p.billingType === "retainer" && p.status === "active")
    .reduce((sum, p) => sum + convert(p.amount, p.currency), 0);
  const subTotal = subscriptions
    .filter((s) => s.active)
    .reduce((sum, s) => sum + convert(s.amount, s.currency), 0);
  const emGoal = savingGoals.find((g) => g.isEmergency);
  const avgExp = (() => {
    const now = new Date();
    let total = 0, count = 0;
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const me = allExpenses.filter((e) => e.date.startsWith(key));
      if (me.length > 0) { total += me.reduce((s, e) => s + convert(e.amount, e.currency), 0); count++; }
    }
    return count > 0 ? Math.round(total / count) : 0;
  })();
  const emMonths = emGoal && avgExp > 0 ? convert(emGoal.savedAmount, emGoal.currency) / avgExp : 0;

  return (
    <AppShell
      title="Finances"
      actions={
        <>
          <Button variant="outline" size="sm" disabled className="text-[11px]">
            Import
          </Button>
          <QuickAdd />
        </>
      }
    >
      <FinanceNav />

      <div className="grid grid-cols-5 gap-6 pb-5 mb-5 border-b border-border">
        <div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-[0.06em] mb-1">Income</div>
          <div className="text-[18px] font-medium tabular-nums"><MaskedAmount value={income} /></div>
          <div className="text-[9px] text-muted-foreground mt-0.5">MRR: <MaskedAmount value={mrr} /></div>
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-[0.06em] mb-1">Expenses</div>
          <div className="text-[18px] font-medium tabular-nums"><MaskedAmount value={Math.round(totalExpenses)} /></div>
          <div className="text-[9px] text-muted-foreground mt-0.5">Subs: <MaskedAmount value={Math.round(subTotal)} />/mo</div>
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-[0.06em] mb-1">Net</div>
          <div className="text-[18px] font-medium tabular-nums"><MaskedAmount value={net} /></div>
          <div className="text-[9px] text-muted-foreground mt-0.5">{savingsRate}% rate</div>
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-[0.06em] mb-1">Emergency</div>
          <div className="text-[18px] font-medium tabular-nums">{emMonths.toFixed(1)}mo</div>
          <div className="text-[9px] text-muted-foreground mt-0.5">
            {emGoal ? <><MaskedAmount value={emGoal.savedAmount} /> saved</> : "No fund"}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-[0.06em] mb-1">Avg/mo</div>
          <div className="text-[18px] font-medium tabular-nums"><MaskedAmount value={avgExp} /></div>
          <div className="text-[9px] text-muted-foreground mt-0.5">6mo average</div>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_300px] gap-6 mb-6">
        <div className="space-y-6">
          <IncomeExpenseChart />
          <div className="grid grid-cols-2 gap-6">
            <PaymentTimeline />
            <CashFlowForecast />
          </div>
        </div>
        <div className="border-l border-border pl-5 space-y-6">
          <CategoryBreakdown />
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-[0.06em] mb-3">
              Savings
            </div>
            <div className="space-y-3">
              {savingGoals.map((g) => (
                <SavingGoalCard key={g.id} goal={g} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
