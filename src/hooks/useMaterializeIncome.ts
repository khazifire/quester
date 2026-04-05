import { useEffect } from "react";
import { useFinanceStore } from "@/stores/financeStore";
import { useProjectStore } from "@/stores/projectStore";

/**
 * Run this on any finance-related page mount to ensure all past months
 * have materialized income snapshots. This guarantees historical data
 * is preserved even if retainers are later paused or salary entries changed.
 */
export function useMaterializeIncome() {
  const incomes = useFinanceStore((s) => s.incomes);
  const materializedMonths = useFinanceStore((s) => s.materializedMonths);
  const materializeMonth = useFinanceStore((s) => s.materializeMonth);
  const projects = useProjectStore((s) => s.projects);

  useEffect(() => {
    const retainerItems = projects
      .filter((p) => p.billingType === "retainer" && p.status !== "completed" && p.status !== "paused")
      .map((p) => ({ id: p.id, name: p.name, amount: p.amount, currency: p.currency }));

    const recurringIncomes = incomes.filter((i) => i.recurring && !i.isSnapshot);
    if (recurringIncomes.length === 0 && retainerItems.length === 0) return;

    const earliest = recurringIncomes.reduce(
      (min, i) => (i.date < min ? i.date : min),
      recurringIncomes[0]?.date ?? new Date().toISOString().split("T")[0]
    );

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const d = new Date(earliest.substring(0, 7) + "-01");
    const end = new Date(currentMonth + "-01");

    while (d <= end) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!materializedMonths.includes(key)) {
        materializeMonth(key, retainerItems);
      }
      d.setMonth(d.getMonth() + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
