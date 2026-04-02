import { AppShell } from "@/components/layout/AppShell";
import { MetricCard } from "@/components/shared/MetricCard";
import { MaskedAmount } from "@/components/shared/MaskedAmount";
import { HabitGrid } from "@/components/overview/HabitGrid";
import { DailyExpenseChart } from "@/components/overview/DailyExpenseChart";
import { RecentRuns } from "@/components/overview/RecentRuns";
import { ActiveProjects } from "@/components/overview/ActiveProjects";
import { SavingGoals } from "@/components/overview/SavingGoals";
import { useProjectStore } from "@/stores/projectStore";
import { useFinanceStore } from "@/stores/financeStore";
import { useCurrencyStore } from "@/stores/currencyStore";

export default function OverviewPage() {
  const projects = useProjectStore((s) => s.projects);
  const issues = useProjectStore((s) => s.issues);
  const invoices = useFinanceStore((s) => s.invoices);
  const convert = useCurrencyStore((s) => s.convert);

  const pendingInvoices = invoices.filter((inv) => inv.status === "sent" || inv.status === "overdue");
  const pendingPayments = pendingInvoices.reduce((sum, inv) => sum + convert(inv.amount, inv.currency), 0);
  const pendingCount = pendingInvoices.length;

  const mrr = projects
    .filter((p) => p.billingType === "retainer" && p.status === "active")
    .reduce((sum, p) => sum + convert(p.amount, p.currency), 0);
  const retainerCount = projects.filter(
    (p) => p.billingType === "retainer" && p.status === "active"
  ).length;

  const openIssues = issues.filter((i) => i.status !== "done").length;
  const criticalProjects = projects.filter((p) =>
    issues.some(
      (i) => i.projectId === p.id && i.priority === "high" && i.status !== "done"
    )
  ).length;

  return (
    <AppShell title="Overview">
      <div className="grid grid-cols-4 gap-6 pb-5 mb-5 border-b border-border">
        <MetricCard
          label="Pending"
          value={<MaskedAmount value={pendingPayments} />}
          subtitle={`${pendingCount} invoice${pendingCount !== 1 ? "s" : ""}`}
        />
        <MetricCard
          label="MRR"
          value={<MaskedAmount value={mrr} />}
          subtitle={`${retainerCount} retainers`}
        />
        <MetricCard
          label="Open issues"
          value={openIssues}
          subtitle={`${criticalProjects} critical`}
        />
        <MetricCard
          label="Active"
          value={projects.filter((p) => p.status === "active").length}
          subtitle="projects"
        />
      </div>

      <div className="grid grid-cols-[1fr_300px] gap-6">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <DailyExpenseChart />
            <RecentRuns />
          </div>
          <HabitGrid />
        </div>

        <div className="border-l border-border pl-5 space-y-6">
          <ActiveProjects />
          <SavingGoals />
        </div>
      </div>
    </AppShell>
  );
}
