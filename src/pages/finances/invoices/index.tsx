import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { FinanceNav } from "@/components/layout/FinanceNav";
import { MaskedAmount } from "@/components/shared/MaskedAmount";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFinanceStore } from "@/stores/financeStore";
import { useProjectStore } from "@/stores/projectStore";
import { useCurrencyStore } from "@/stores/currencyStore";
import { formatDate, getToday, addDays } from "@/lib/utils";
import { toast } from "sonner";

export default function InvoicesPage() {
  const invoices = useFinanceStore((s) => s.invoices);
  const addInvoice = useFinanceStore((s) => s.addInvoice);
  const updateInvoice = useFinanceStore((s) => s.updateInvoice);
  const deleteInvoice = useFinanceStore((s) => s.deleteInvoice);
  const markInvoicePaid = useFinanceStore((s) => s.markInvoicePaid);
  const projects = useProjectStore((s) => s.projects);
  const clients = useProjectStore((s) => s.clients);
  const convert = useCurrencyStore((s) => s.convert);
  const wallets = useCurrencyStore((s) => s.wallets);
  const mainCurrency = useCurrencyStore((s) => s.mainCurrency);

  const activeProjects = projects.filter(
    (p) => p.status === "active" || p.status === "delivered" || p.status === "invoiced"
  );

  const retainerProjects = useMemo(
    () => activeProjects.filter((p) => p.billingType === "retainer"),
    [activeProjects]
  );

  useEffect(() => {
    if (retainerProjects.length === 0) return;
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const daysLeft = daysInMonth - today.getDate();
    if (daysLeft > 5) return;

    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const nextMonthKey = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}`;

    const existingDraft = invoices.find(
      (inv) =>
        inv.status === "draft" &&
        inv.issuedDate.startsWith(nextMonthKey)
    );
    if (existingDraft) return;

    const existingInvoice = invoices.find(
      (inv) => inv.issuedDate.startsWith(nextMonthKey)
    );
    if (existingInvoice) return;

    const issuedDate = `${nextMonthKey}-01`;
    const dueDate = addDays(issuedDate, 7);
    const items = retainerProjects.map((p) => ({
      description: p.name,
      amount: p.amount,
      currency: p.currency,
    }));
    const total = retainerProjects.reduce(
      (sum, p) => sum + convert(p.amount, p.currency),
      0
    );

    addInvoice({
      projectIds: retainerProjects.map((p) => p.id),
      amount: total,
      estimatedFees: 0,
      currency: mainCurrency,
      status: "draft",
      issuedDate,
      dueDate,
      paidDate: null,
      items,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [open, setOpen] = useState(false);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [estimatedFees, setEstimatedFees] = useState("");
  const [invoiceCurrency, setInvoiceCurrency] = useState(mainCurrency);
  const [issuedDate, setIssuedDate] = useState(getToday());

  function openCreateDialog() {
    setSelectedProjectIds(activeProjects.map((p) => p.id));
    setEstimatedFees("");
    setInvoiceCurrency(mainCurrency);
    setIssuedDate(getToday());
    setOpen(true);
  }

  function toggleProject(id: string) {
    setSelectedProjectIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function convertTo(amount: number, fromCurrency: string | undefined, toCurrency: string) {
    const inMain = convert(amount, fromCurrency);
    if (toCurrency === mainCurrency) return inMain;
    const rates = useCurrencyStore.getState().exchangeRates;
    if (!rates || rates.base !== mainCurrency) return inMain;
    const rate = rates.rates[toCurrency];
    if (!rate || rate === 0) return inMain;
    return inMain * rate;
  }

  const selectedTotalInMain = activeProjects
    .filter((p) => selectedProjectIds.includes(p.id))
    .reduce((sum, p) => sum + convert(p.amount, p.currency), 0);
  const selectedTotalInInvoiceCur = activeProjects
    .filter((p) => selectedProjectIds.includes(p.id))
    .reduce((sum, p) => sum + convertTo(p.amount, p.currency, invoiceCurrency), 0);
  const fees = Number(estimatedFees) || 0;
  const dueDate = addDays(issuedDate, 7);

  function handleCreate() {
    if (selectedProjectIds.length === 0) return;
    const items = activeProjects
      .filter((p) => selectedProjectIds.includes(p.id))
      .map((p) => ({
        description: p.name,
        amount: p.amount,
        currency: p.currency,
      }));
    addInvoice({
      projectIds: selectedProjectIds,
      amount: Math.round(selectedTotalInInvoiceCur),
      estimatedFees: fees,
      feesCurrency: invoiceCurrency,
      currency: invoiceCurrency,
      status: "sent",
      issuedDate,
      dueDate,
      paidDate: null,
      items,
    });
    toast.success("Invoice created");
    setOpen(false);
  }

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editFees, setEditFees] = useState("");
  const [editStatus, setEditStatus] = useState<string>("sent");
  const [editProjectIds, setEditProjectIds] = useState<string[]>([]);
  const [editCurrency, setEditCurrency] = useState(mainCurrency);

  function openEdit(invId: string) {
    const inv = invoices.find((i) => i.id === invId);
    if (!inv) return;
    setEditId(invId);
    setEditFees(String(inv.estimatedFees || 0));
    setEditStatus(inv.status);
    setEditCurrency(inv.currency || mainCurrency);
    const pIds = inv.projectIds?.length ? inv.projectIds : inv.projectId ? [inv.projectId] : [];
    setEditProjectIds(pIds);
    setEditOpen(true);
  }

  function toggleEditProject(id: string) {
    setEditProjectIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  const editTotalInCur = activeProjects
    .filter((p) => editProjectIds.includes(p.id))
    .reduce((sum, p) => sum + convertTo(p.amount, p.currency, editCurrency), 0);

  function handleEdit() {
    if (!editId) return;
    const items = activeProjects
      .filter((p) => editProjectIds.includes(p.id))
      .map((p) => ({
        description: p.name,
        amount: p.amount,
        currency: p.currency,
      }));
    updateInvoice(editId, {
      projectIds: editProjectIds,
      amount: Math.round(editTotalInCur),
      estimatedFees: Number(editFees) || 0,
      feesCurrency: editCurrency,
      currency: editCurrency,
      status: editStatus as "draft" | "sent" | "paid" | "overdue",
      items,
    });
    toast.success("Invoice updated");
    setEditOpen(false);
  }

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function confirmDelete(id: string) {
    setDeleteId(id);
    setDeleteOpen(true);
  }

  function handleDelete() {
    if (!deleteId) return;
    deleteInvoice(deleteId);
    toast.success("Invoice deleted");
    setDeleteOpen(false);
  }

  const [payOpen, setPayOpen] = useState(false);
  const [payId, setPayId] = useState<string | null>(null);

  function confirmPay(id: string) {
    setPayId(id);
    setPayOpen(true);
  }

  function handlePay() {
    if (!payId) return;
    markInvoicePaid(payId);
    toast.success("Marked paid");
    setPayOpen(false);
  }

  function getInvoiceProjectIds(inv: typeof invoices[0]) {
    if (inv.projectIds && inv.projectIds.length > 0) return inv.projectIds;
    if (inv.projectId) return [inv.projectId];
    return [];
  }

  const drafts = useMemo(
    () => [...invoices].filter((inv) => inv.status === "draft").sort((a, b) => b.createdAt - a.createdAt),
    [invoices]
  );
  const nonDrafts = useMemo(
    () => [...invoices].filter((inv) => inv.status !== "draft").sort((a, b) => b.createdAt - a.createdAt),
    [invoices]
  );

  function renderRow(inv: typeof invoices[0]) {
    const pIds = getInvoiceProjectIds(inv);
    const invProjects = pIds.map((pid) => projects.find((p) => p.id === pid)).filter(Boolean);
    const clientNames = [...new Set(invProjects.map((p) => {
      const c = clients.find((cl) => cl.id === p!.clientId);
      return c?.name || "—";
    }))];
    const projectNames = invProjects.map((p) => p!.name).join(", ");

    return (
      <div
        key={inv.id}
        className="grid grid-cols-[1fr_100px_80px_80px_60px_100px] gap-3 py-2.5 text-[13px] border-b border-border last:border-0 hover:bg-white/[0.02] transition-colors"
      >
        <Link
          href={`/finances/invoices/${inv.id}`}
          className="text-foreground truncate hover:underline underline-offset-2"
        >
          {projectNames || "—"}
        </Link>
        <span className="text-[12px] text-muted-foreground truncate">
          {clientNames.join(", ")}
        </span>
        <span className="text-[11px] text-muted-foreground font-mono tabular-nums">
          {formatDate(inv.issuedDate)}
        </span>
        <span className="text-[13px] font-mono tabular-nums text-right">
          <MaskedAmount value={inv.amount - convertTo(inv.estimatedFees || 0, inv.feesCurrency || inv.currency, inv.currency || mainCurrency)} currency={inv.currency} />
        </span>
        <span
          className={`text-[11px] ${
            inv.status === "paid"
              ? "text-foreground/50"
              : inv.status === "overdue"
                ? "text-destructive"
                : inv.status === "draft"
                  ? "text-muted-foreground italic"
                  : "text-muted-foreground"
          }`}
        >
          {inv.status}
        </span>
        <span className="flex items-center justify-end gap-2">
          {inv.status !== "paid" && (
            <button
              className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
              onClick={() => confirmPay(inv.id)}
            >
              [pay]
            </button>
          )}
          <button
            className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
            onClick={() => openEdit(inv.id)}
          >
            [edit]
          </button>
          <button
            className="text-[11px] text-muted-foreground hover:text-destructive cursor-pointer"
            onClick={() => confirmDelete(inv.id)}
          >
            [del]
          </button>
        </span>
      </div>
    );
  }

  return (
    <AppShell
      title="Finances"
      actions={
        <Button size="sm" onClick={openCreateDialog}>+ Invoice</Button>
      }
    >
      <FinanceNav />

      {drafts.length > 0 && (
        <div className="mb-6">
          <div className="text-[11px] text-muted-foreground uppercase tracking-[0.06em] mb-2">
            Pending drafts
          </div>
          <div className="grid grid-cols-[1fr_100px_80px_80px_60px_100px] gap-3 py-2.5 text-[11px] uppercase tracking-[0.06em] text-muted-foreground border-b border-border">
            <span>Projects</span>
            <span>Client</span>
            <span>Issued</span>
            <span className="text-right">Amount</span>
            <span>Status</span>
            <span className="text-right">Actions</span>
          </div>
          {drafts.map(renderRow)}
        </div>
      )}

      <div className="grid grid-cols-[1fr_100px_80px_80px_60px_100px] gap-3 py-2.5 text-[11px] uppercase tracking-[0.06em] text-muted-foreground border-b border-border">
        <span>Projects</span>
        <span>Client</span>
        <span>Issued</span>
        <span className="text-right">Amount</span>
        <span>Status</span>
        <span className="text-right">Actions</span>
      </div>

      {nonDrafts.map(renderRow)}

      {invoices.length === 0 && (
        <p className="text-[12px] text-muted-foreground text-center py-10">
          No invoices yet
        </p>
      )}

      <Dialog open={open} onOpenChange={setOpen} >
        <DialogContent  className={"lg:max-w-2xl"}>
          <DialogHeader>
            <DialogTitle>Create invoice</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-4 ">
            <div className="flex gap-3 items-center">
              <div className="flex-1">
                <div className="text-[11px] text-muted-foreground uppercase tracking-[0.06em] mb-1.5">
                  Issue date
                </div>
                <DatePicker value={issuedDate} onChange={setIssuedDate} />
              </div>
              <div className="flex-1">
                <div className="text-[11px] text-muted-foreground uppercase tracking-[0.06em] mb-1.5">
                  Due date
                </div>
                <div className="text-[13px] font-mono tabular-nums h-9 flex items-center text-muted-foreground">
                  {formatDate(dueDate)} <span className="text-[10px] ml-1.5">(+7d)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] text-muted-foreground uppercase tracking-[0.06em]">Invoice currency</span>
              <Select value={invoiceCurrency} onValueChange={(v) => setInvoiceCurrency(v ?? mainCurrency)}>
                <SelectTrigger className="w-24 h-7"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {wallets.map((w) => (
                    <SelectItem key={w.currency} value={w.currency}>{w.currency}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <table className="w-full border-collapse mt-1">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground border-b border-border">
                  <th className="py-2 text-left font-normal">Project</th>
                  <th className="py-2 text-right font-normal">Amount</th>
                  {invoiceCurrency !== mainCurrency && (
                    <th className="py-2 text-right font-normal pl-3">{invoiceCurrency}</th>
                  )}
                  <th className="py-2 text-right font-normal pl-3">{mainCurrency}</th>
                </tr>
              </thead>
              <tbody>
                {activeProjects.length === 0 && (
                  <tr><td colSpan={4} className="text-[12px] text-muted-foreground py-3">No active projects</td></tr>
                )}
                {activeProjects.map((p) => {
                  const client = clients.find((c) => c.id === p.clientId);
                  const checked = selectedProjectIds.includes(p.id);
                  const pCur = p.currency || mainCurrency;
                  const inInvoiceCur = convertTo(p.amount, p.currency, invoiceCurrency);
                  const inMainCur = convert(p.amount, p.currency);
                  return (
                    <tr key={p.id} className="text-[13px] border-b border-border last:border-0">
                      <td className="py-2">
                        <label className="flex items-center gap-2.5 cursor-pointer whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleProject(p.id)}
                            className="accent-foreground"
                          />
                          <span className="text-foreground">{p.name}</span>
                          <span className="text-[11px] text-muted-foreground">({client?.name})</span>
                        </label>
                      </td>
                      <td className="py-2 text-right font-mono tabular-nums text-[12px] text-muted-foreground whitespace-nowrap">
                        <MaskedAmount value={p.amount} currency={p.currency} showOriginal />
                      </td>
                      {invoiceCurrency !== mainCurrency && (
                        <td className="py-2 text-right font-mono tabular-nums text-[12px] text-muted-foreground whitespace-nowrap pl-3">
                          {pCur !== invoiceCurrency ? <MaskedAmount value={Math.round(inInvoiceCur)} currency={invoiceCurrency} showOriginal /> : ""}
                        </td>
                      )}
                      <td className="py-2 text-right font-mono tabular-nums text-[12px] text-muted-foreground whitespace-nowrap pl-3">
                        {pCur !== mainCurrency ? <MaskedAmount value={Math.round(inMainCur)} currency={mainCurrency} showOriginal /> : ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="border-t border-border pt-3 mt-1">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] text-muted-foreground">Subtotal</span>
                <span className="text-[14px] font-mono tabular-nums">
                  <MaskedAmount value={Math.round(selectedTotalInInvoiceCur)} currency={invoiceCurrency} showOriginal />
                  {invoiceCurrency !== mainCurrency && (
                    <span className="text-[11px] text-muted-foreground ml-2">
                      (<MaskedAmount value={Math.round(selectedTotalInMain)} currency={mainCurrency} showOriginal />)
                    </span>
                  )}
                </span>
              </div>
              <div className="flex gap-2 items-center">
                <span className="text-[12px] text-muted-foreground whitespace-nowrap">Est. fees ({invoiceCurrency})</span>
                <Input
                  placeholder="0"
                  type="number"
                  value={estimatedFees}
                  onChange={(e) => setEstimatedFees(e.target.value)}
                  className="flex-1"
                />
              </div>
              {fees > 0 && (
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <span className="text-[12px] text-foreground">Total</span>
                  <span className="text-[16px] font-mono tabular-nums font-medium">
                    <MaskedAmount value={Math.round(selectedTotalInInvoiceCur - fees)} currency={invoiceCurrency} showOriginal />
                  </span>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreate} disabled={selectedProjectIds.length === 0}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent >
          <DialogHeader>
            <DialogTitle>Edit invoice</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <span className="text-[11px] text-muted-foreground uppercase tracking-[0.06em]">Invoice currency</span>
                <Select value={editCurrency} onValueChange={(v) => setEditCurrency(v ?? mainCurrency)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {wallets.map((w) => (
                      <SelectItem key={w.currency} value={w.currency}>{w.currency}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <span className="text-[11px] text-muted-foreground uppercase tracking-[0.06em]">Status</span>
                <Select value={editStatus} onValueChange={(v) => setEditStatus(v ?? "sent")}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <table className="w-full border-collapse">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground border-b border-border">
                  <th className="py-2 text-left font-normal">Project</th>
                  <th className="py-2 text-right font-normal">Amount</th>
                  {editCurrency !== mainCurrency && (
                    <th className="py-2 text-right font-normal pl-3">{editCurrency}</th>
                  )}
                  <th className="py-2 text-right font-normal pl-3">{mainCurrency}</th>
                </tr>
              </thead>
              <tbody>
                {activeProjects.map((p) => {
                  const client = clients.find((c) => c.id === p.clientId);
                  const checked = editProjectIds.includes(p.id);
                  const pCur = p.currency || mainCurrency;
                  const inEditCur = convertTo(p.amount, p.currency, editCurrency);
                  const inMainCur = convert(p.amount, p.currency);
                  return (
                    <tr key={p.id} className="text-[13px] border-b border-border last:border-0">
                      <td className="py-2">
                        <label className="flex items-center gap-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleEditProject(p.id)}
                            className="accent-foreground"
                          />
                          <span className="text-foreground">{p.name}</span>
                          <span className="text-[11px] text-muted-foreground">({client?.name})</span>
                        </label>
                      </td>
                      <td className="py-2 text-right font-mono tabular-nums text-[12px] text-muted-foreground whitespace-nowrap">
                        <MaskedAmount value={p.amount} currency={p.currency} showOriginal />
                      </td>
                      {editCurrency !== mainCurrency && (
                        <td className="py-2 text-right font-mono tabular-nums text-[12px] text-muted-foreground whitespace-nowrap pl-3">
                          {pCur !== editCurrency ? <MaskedAmount value={Math.round(inEditCur)} currency={editCurrency} showOriginal /> : ""}
                        </td>
                      )}
                      <td className="py-2 text-right font-mono tabular-nums text-[12px] text-muted-foreground whitespace-nowrap pl-3">
                        {pCur !== mainCurrency ? <MaskedAmount value={Math.round(inMainCur)} currency={mainCurrency} showOriginal /> : ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="border-t border-border pt-3 mt-1">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] text-muted-foreground">Subtotal</span>
                <span className="text-[14px] font-mono tabular-nums">
                  <MaskedAmount value={Math.round(editTotalInCur)} currency={editCurrency} showOriginal />
                </span>
              </div>

              <div>
                <span className="text-[11px] text-muted-foreground uppercase tracking-[0.06em]">
                  Estimated fees ({editCurrency})
                </span>
                <Input
                  type="number"
                  value={editFees}
                  onChange={(e) => setEditFees(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete invoice?</DialogTitle>
          </DialogHeader>
          <p className="text-[13px] text-muted-foreground py-4 px-6">
            This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button onClick={handleDelete} className="!bg-destructive !text-destructive-foreground !border-destructive">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as paid?</DialogTitle>
          </DialogHeader>
          <p className="text-[13px] text-muted-foreground py-4 px-6">
            This will mark the invoice as paid with today&apos;s date.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(false)}>Cancel</Button>
            <Button onClick={handlePay}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
