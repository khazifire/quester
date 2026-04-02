import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useFinanceStore } from "@/stores/financeStore";
import { useCurrencyStore } from "@/stores/currencyStore";

export function IncomeExpenseChart() {
  const invoices = useFinanceStore((s) => s.invoices);
  const expenses = useFinanceStore((s) => s.expenses);
  const convert = useCurrencyStore((s) => s.convert);

  const now = new Date();
  const data: { month: string; income: number; expenses: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const monthName = d.toLocaleDateString("en-US", { month: "short" });
    const monthIncome = invoices
      .filter((inv) => inv.status === "paid" && inv.paidDate?.startsWith(key))
      .reduce((sum, inv) => sum + convert(inv.amount, inv.currency), 0);
    const monthExpenses = expenses
      .filter((e) => e.date.startsWith(key))
      .reduce((sum, e) => sum + convert(e.amount, e.currency), 0);
    data.push({ month: monthName, income: monthIncome, expenses: monthExpenses });
  }

  return (
    <div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-[0.06em] mb-3">
        Income vs Expenses
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data} barGap={1}>
          <XAxis
            dataKey="month"
            tick={{ fontSize: 9, fill: "#5a5a5a" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              backgroundColor: "#161616",
              border: "1px solid #222",
              borderRadius: 4,
              fontSize: 11,
              color: "#e0e0e0",
            }}
            formatter={(value) => `$${Number(value).toLocaleString()}`}
          />
          <Bar
            dataKey="income"
            fill="rgba(255,255,255,0.5)"
            radius={[1, 1, 0, 0]}
            name="Income"
          />
          <Bar
            dataKey="expenses"
            fill="rgba(255,255,255,0.15)"
            radius={[1, 1, 0, 0]}
            name="Expenses"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
