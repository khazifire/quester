import { MaskedAmount } from "@/components/shared/MaskedAmount";
import { useProjectStore } from "@/stores/projectStore";
import { useFinanceStore } from "@/stores/financeStore";

export function PaymentTimeline() {
  const projects = useProjectStore((s) => s.projects);
  const clients = useProjectStore((s) => s.clients);
  const invoices = useFinanceStore((s) => s.invoices);

  const activeProjects = projects.filter((p) => p.status !== "paused");

  return (
    <div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-[0.06em] mb-3">
        Payments
      </div>
      {activeProjects.map((p) => {
        const client = clients.find((c) => c.id === p.clientId);
        const projectInvoices = invoices.filter(
          (inv) => inv.projectIds?.includes(p.id) || inv.projectId === p.id
        );
        const isPaid = projectInvoices.some((inv) => inv.status === "paid");

        return (
          <div
            key={p.id}
            className="flex items-center gap-3 py-1.5 border-b border-border last:border-0"
          >
            <div
              className={`w-1 h-1 rounded-full shrink-0 ${
                isPaid ? "bg-foreground/40" : "bg-foreground/15"
              }`}
            />
            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-foreground truncate">{p.name}</div>
              <div className="text-[9px] text-muted-foreground">{client?.name}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[11px] font-mono tabular-nums">
                <MaskedAmount value={p.amount} currency={p.currency} />
              </div>
              <div className="text-[9px] text-muted-foreground">
                {isPaid ? "Received" : p.dueDate ? `Due ${p.dueDate}` : "TBD"}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
