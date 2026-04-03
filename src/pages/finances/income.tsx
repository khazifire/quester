import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { FinanceNav } from "@/components/layout/FinanceNav";
import { MetricCard } from "@/components/shared/MetricCard";
import { MaskedAmount } from "@/components/shared/MaskedAmount";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppDialog } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFinanceStore } from "@/stores/financeStore";
import { useMaterializeIncome } from "@/hooks/useMaterializeIncome";
import { useCurrencyStore } from "@/stores/currencyStore";
import { useProjectStore } from "@/stores/projectStore";
import { formatDate, getMonthKey } from "@/lib/utils";
import { toast } from "sonner";
import type { Income } from "@/lib/types";

const CATEGORY_LABELS: Record<Income["category"], string> = {
  salary: "Salary",
  freelance: "Freelance",
  passive: "Passive",
  other: "Other",
};

function nextMonthKey(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function nextMonthFirst(): string {
  return `${nextMonthKey()}-01`;
}

const EMPTY_FORM = {
  name: "",
  amount: "",
  currency: "",
  category: "salary" as Income["category"],
  recurring: true,
  date: new Date().toISOString().split("T")[0],
};

export default function IncomePage() {
  const incomes = useFinanceStore((s) => s.incomes);
  const addIncome = useFinanceStore((s) => s.addIncome);
  const updateIncome = useFinanceStore((s) => s.updateIncome);
  const deleteIncome = useFinanceStore((s) => s.deleteIncome);
  const getMonthlyIncomeBreakdown = useFinanceStore((s) => s.getMonthlyIncomeBreakdown);
  const wallets = useCurrencyStore((s) => s.wallets);
  const mainCurrency = useCurrencyStore((s) => s.mainCurrency);
  const convert = useCurrencyStore((s) => s.convert);
  const projects = useProjectStore((s) => s.projects);
  const clients = useProjectStore((s) => s.clients);

  useMaterializeIncome();

  const monthKey = getMonthKey();
  const now = new Date();

  const retainerProjects = projects.filter(
    (p) => p.billingType === "retainer" && p.status === "active"
  );
  const retainerMonthly = retainerProjects.reduce(
    (sum, p) => sum + convert(p.amount, p.currency),
    0
  );

  const breakdown = getMonthlyIncomeBreakdown(monthKey);
  const recurringFromIncomes = incomes
    .filter((i) => i.recurring && (!i.endDate || i.endDate >= monthKey))
    .reduce((sum, i) => sum + convert(i.amount, i.currency), 0);
  const totalRecurring = retainerMonthly + recurringFromIncomes;
  const totalThisMonth = breakdown.invoices + breakdown.recurring + breakdown.oneTime + retainerMonthly;

  const ytd = Array.from({ length: now.getMonth() + 1 }, (_, i) => {
    const d = new Date(now.getFullYear(), i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const b = getMonthlyIncomeBreakdown(key);
    const ret = retainerProjects.reduce((sum, p) => sum + convert(p.amount, p.currency), 0);
    return b.invoices + b.recurring + b.oneTime + ret;
  }).reduce((s, v) => s + v, 0);

  // Add dialog
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  // Edit dialog (for updating amount — creates a new entry from effective date)
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Income | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editEffectiveFrom, setEditEffectiveFrom] = useState(nextMonthFirst());

  // Stop dialog
  const [stopOpen, setStopOpen] = useState(false);
  const [stopTarget, setStopTarget] = useState<Income | null>(null);
  const [stopFrom, setStopFrom] = useState(nextMonthKey());

  // Delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  function openAdd() {
    setForm({ ...EMPTY_FORM, currency: mainCurrency });
    setAddOpen(true);
  }

  function handleAdd() {
    const amount = parseFloat(form.amount);
    if (!form.name.trim() || isNaN(amount) || amount <= 0) {
      toast.error("Name and amount are required");
      return;
    }
    addIncome({
      name: form.name.trim(),
      amount,
      currency: form.currency || mainCurrency,
      category: form.category,
      recurring: form.category === "salary" ? true : form.recurring,
      date: form.date,
    });
    toast.success("Income added");
    setAddOpen(false);
  }

  function openEdit(inc: Income) {
    setEditTarget(inc);
    setEditAmount(String(inc.amount));
    setEditEffectiveFrom(nextMonthFirst());
    setEditOpen(true);
  }

  function handleEdit() {
    if (!editTarget) return;
    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    const effectiveMonthKey = editEffectiveFrom.substring(0, 7);
    const prevMonth = new Date(editEffectiveFrom);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    const prevMonthKey = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, "0")}`;
    updateIncome(editTarget.id, { endDate: prevMonthKey });
    addIncome({
      name: editTarget.name,
      amount,
      currency: editTarget.currency ?? mainCurrency,
      category: editTarget.category,
      recurring: true,
      date: editEffectiveFrom,
    });
    toast.success(`Updated — new amount effective ${effectiveMonthKey}`);
    setEditOpen(false);
  }

  function openStop(inc: Income) {
    setStopTarget(inc);
    setStopFrom(nextMonthKey());
    setStopOpen(true);
  }

  function handleStop() {
    if (!stopTarget) return;
    // endDate is the last month this income counts
    const prevMonth = new Date(stopFrom + "-01");
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    const lastMonthKey = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, "0")}`;
    updateIncome(stopTarget.id, { endDate: lastMonthKey });
    toast.success(`Stopped after ${lastMonthKey}`);
    setStopOpen(false);
  }

  function confirmDelete(id: string) {
    setDeleteConfirmId(id);
    setDeleteConfirmOpen(true);
  }

  function handleDelete() {
    if (!deleteConfirmId) return;
    deleteIncome(deleteConfirmId);
    toast.success("Removed");
    setDeleteConfirmOpen(false);
    setDeleteConfirmId(null);
  }

  function handleCategoryChange(cat: Income["category"]) {
    setForm((f) => ({
      ...f,
      category: cat,
      recurring: cat === "salary" ? true : f.recurring,
    }));
  }

  const activeRecurring = incomes
    .filter((i) => i.recurring && (!i.endDate || i.endDate >= monthKey))
    .sort((a, b) => a.name.localeCompare(b.name));

  const stoppedRecurring = incomes
    .filter((i) => i.recurring && i.endDate && i.endDate < monthKey)
    .sort((a, b) => b.endDate!.localeCompare(a.endDate!));

  const oneTimeIncomes = incomes
    .filter((i) => !i.recurring && i.date.startsWith(monthKey))
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <AppShell
      title="Finances"
      actions={
        <Button variant="outline" className="text-[12px] h-7 px-3 cursor-pointer" onClick={openAdd}>
          Add income
        </Button>
      }
    >
      <FinanceNav />

      <div className="space-y-8">
        <div className="grid grid-cols-4 gap-6 pb-5 border-b border-border">
          <MetricCard label="This month" value={<MaskedAmount value={Math.round(totalThisMonth)} />} subtitle="total income" />
          <MetricCard label="Recurring / mo" value={<MaskedAmount value={Math.round(totalRecurring)} />} subtitle="salary, retainers & passive" />
          <MetricCard label="Invoiced" value={<MaskedAmount value={Math.round(breakdown.invoices)} />} subtitle="paid invoices" />
          <MetricCard label="Year to date" value={<MaskedAmount value={Math.round(ytd)} />} subtitle={`Jan – ${now.toLocaleDateString("en-US", { month: "short" })}`} />
        </div>

        {/* Active recurring */}
        <div>
          <span className="text-[12px] text-muted-foreground uppercase tracking-[0.06em] mb-3 block">Recurring income</span>
          {retainerProjects.length === 0 && activeRecurring.length === 0 ? (
            <p className="text-[12px] text-muted-foreground py-4">No recurring income — add a salary or set up retainer projects</p>
          ) : (
            <>
              <div className="grid grid-cols-[1fr_70px_90px_90px_90px] gap-3 py-2 text-[11px] uppercase tracking-[0.06em] text-muted-foreground border-b border-border">
                <span>Name</span><span>Category</span><span className="text-right">Amount / mo</span><span>Since</span><span></span>
              </div>
              {retainerProjects.map((p) => {
                const client = clients.find((c) => c.id === p.clientId);
                return (
                  <div key={p.id} className="grid grid-cols-[1fr_70px_90px_90px_90px] gap-3 py-2.5 text-[13px] border-b border-border last:border-0 group">
                    <div className="flex items-baseline gap-2 min-w-0">
                      <span className="truncate">{p.name}</span>
                      {client && <span className="text-[11px] text-muted-foreground/50 shrink-0">{client.name}</span>}
                    </div>
                    <span className="text-[11px] text-muted-foreground">Retainer</span>
                    <span className="text-right font-mono tabular-nums text-[12px]"><MaskedAmount value={p.amount} currency={p.currency} /></span>
                    <span className="text-[11px] text-muted-foreground">—</span>
                    <span className="hidden group-hover:flex justify-end">
                      <Link href="/sidequests" className="text-[11px] text-muted-foreground hover:text-foreground">manage →</Link>
                    </span>
                  </div>
                );
              })}
              {activeRecurring.map((inc) => (
                <div key={inc.id} className="grid grid-cols-[1fr_70px_90px_90px_90px] gap-3 py-2.5 text-[13px] border-b border-border last:border-0 group">
                  <span className="truncate">{inc.name}</span>
                  <span className="text-[11px] text-muted-foreground">{CATEGORY_LABELS[inc.category]}</span>
                  <span className="text-right font-mono tabular-nums text-[12px]"><MaskedAmount value={inc.amount} currency={inc.currency} /></span>
                  <span className="text-[11px] text-muted-foreground font-mono">{formatDate(inc.date)}</span>
                  <span className="hidden group-hover:flex gap-3 text-[11px] text-muted-foreground justify-end items-center">
                    <button className="hover:text-foreground cursor-pointer" onClick={() => openEdit(inc)}>edit</button>
                    <button className="hover:text-amber-400 cursor-pointer" onClick={() => openStop(inc)}>stop</button>
                    <button className="hover:text-destructive cursor-pointer" onClick={() => confirmDelete(inc.id)}>del</button>
                  </span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* One-time this month */}
        <div>
          <span className="text-[12px] text-muted-foreground uppercase tracking-[0.06em] mb-3 block">
            One-time — {now.toLocaleDateString("en-US", { month: "long" })}
          </span>
          {oneTimeIncomes.length === 0 ? (
            <p className="text-[12px] text-muted-foreground py-4">No one-time income this month</p>
          ) : (
            <>
              <div className="grid grid-cols-[1fr_70px_90px_90px_90px] gap-3 py-2 text-[11px] uppercase tracking-[0.06em] text-muted-foreground border-b border-border">
                <span>Name</span><span>Category</span><span className="text-right">Amount</span><span>Date</span><span></span>
              </div>
              {oneTimeIncomes.map((inc) => (
                <div key={inc.id} className="grid grid-cols-[1fr_70px_90px_90px_90px] gap-3 py-2.5 text-[13px] border-b border-border last:border-0 group">
                  <span className="truncate">{inc.name}</span>
                  <span className="text-[11px] text-muted-foreground">{CATEGORY_LABELS[inc.category]}</span>
                  <span className="text-right font-mono tabular-nums text-[12px]"><MaskedAmount value={inc.amount} currency={inc.currency} /></span>
                  <span className="text-[11px] text-muted-foreground font-mono">{formatDate(inc.date)}</span>
                  <span className="hidden group-hover:flex gap-3 text-[11px] text-muted-foreground justify-end">
                    <button className="hover:text-destructive cursor-pointer" onClick={() => confirmDelete(inc.id)}>del</button>
                  </span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Stopped recurring (collapsed history) */}
        {stoppedRecurring.length > 0 && (
          <div>
            <span className="text-[12px] text-muted-foreground uppercase tracking-[0.06em] mb-3 block">Past recurring</span>
            {stoppedRecurring.map((inc) => (
              <div key={inc.id} className="grid grid-cols-[1fr_70px_90px_90px_90px] gap-3 py-2.5 text-[13px] border-b border-border last:border-0 opacity-40 group">
                <span className="truncate">{inc.name}</span>
                <span className="text-[11px] text-muted-foreground">{CATEGORY_LABELS[inc.category]}</span>
                <span className="text-right font-mono tabular-nums text-[12px]"><MaskedAmount value={inc.amount} currency={inc.currency} /></span>
                <span className="text-[11px] text-muted-foreground font-mono">until {inc.endDate}</span>
                <span className="hidden group-hover:flex gap-3 text-[11px] text-muted-foreground justify-end">
                  <button className="hover:text-destructive cursor-pointer" onClick={() => confirmDelete(inc.id)}>del</button>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <AppDialog title="Add income" open={addOpen} onOpenChange={setAddOpen} className="max-w-sm"
        footer={<><Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button><Button onClick={handleAdd}>Add</Button></>}
      >
        <Input placeholder="Name — salary, rental income…" value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} autoFocus />
        <Select value={form.category} onValueChange={(v) => handleCategoryChange(v as Income["category"])}>
          <SelectTrigger><SelectValue>{CATEGORY_LABELS[form.category]}</SelectValue></SelectTrigger>
          <SelectContent>
            {(Object.entries(CATEGORY_LABELS) as [Income["category"], string][]).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Input className="flex-1" type="number" step="0.01" min="0" placeholder="Amount"
            value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
          <Select value={form.currency} onValueChange={(v) => setForm((f) => ({ ...f, currency: v ?? "" }))}>
            <SelectTrigger className="w-24"><SelectValue>{form.currency || mainCurrency}</SelectValue></SelectTrigger>
            <SelectContent>
              {wallets.map((w) => (<SelectItem key={w.currency} value={w.currency}>{w.currency}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
        {form.category !== "salary" && (
          <div className="flex items-center gap-2.5 cursor-pointer select-none"
            onClick={() => setForm((f) => ({ ...f, recurring: !f.recurring }))}>
            <div className="flex items-center justify-center w-4 h-4 rounded border border-border transition-all shrink-0"
              style={{ backgroundColor: form.recurring ? "rgba(255,255,255,0.15)" : "transparent" }}>
              {form.recurring && (
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path d="M1.5 4l1.8 2L6.5 2" stroke="rgba(255,255,255,0.9)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span className="text-[12px] text-muted-foreground">Recurring monthly</span>
          </div>
        )}
        {form.category === "salary" && (
          <p className="text-[11px] text-muted-foreground/50">Salary is always recurring — counted every month from the start date</p>
        )}
      </AppDialog>

      <AppDialog title="Update income" open={editOpen} onOpenChange={setEditOpen} className="max-w-sm"
        footer={<><Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button><Button onClick={handleEdit}>Update</Button></>}
      >
        {editTarget && (
          <>
            <div className="px-3 py-2 rounded-md bg-white/4 text-[13px]">
              <span className="text-muted-foreground">Updating: </span>
              <span className="font-medium">{editTarget.name}</span>
              <span className="text-muted-foreground ml-2">
                (<MaskedAmount value={editTarget.amount} currency={editTarget.currency} /> / mo)
              </span>
            </div>
            <div className="flex gap-2">
              <Input className="flex-1" type="number" step="0.01" min="0"
                placeholder="New amount" value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)} autoFocus />
              <div className="flex items-center px-3 rounded-md border border-input bg-transparent text-[13px] text-muted-foreground shrink-0">
                {editTarget.currency ?? mainCurrency}
              </div>
            </div>
            <Input type="date" value={editEffectiveFrom} onChange={(e) => setEditEffectiveFrom(e.target.value)} />
            <p className="text-[11px] text-muted-foreground/50">Old amount is preserved in history up to the previous month</p>
          </>
        )}
      </AppDialog>

      <AppDialog title="Remove income?" open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen} className="max-w-xs"
        footer={<><Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button><Button className="bg-destructive! text-destructive-foreground! border-destructive!" onClick={handleDelete}>Remove</Button></>}
      >
        <p className="text-[13px] text-muted-foreground">This will permanently remove this income entry.</p>
      </AppDialog>

      <AppDialog title="Stop recurring income" open={stopOpen} onOpenChange={setStopOpen} className="max-w-sm"
        footer={<><Button variant="outline" onClick={() => setStopOpen(false)}>Cancel</Button><Button className="bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20" onClick={handleStop}>Stop income</Button></>}
      >
        {stopTarget && (
          <>
            <div className="px-3 py-2 rounded-md bg-white/4 text-[13px]">
              <span className="font-medium">{stopTarget.name}</span>
              <span className="text-muted-foreground ml-2">
                <MaskedAmount value={stopTarget.amount} currency={stopTarget.currency} /> / mo
              </span>
            </div>
            <Input type="month" value={stopFrom} onChange={(e) => setStopFrom(e.target.value)} />
            <p className="text-[11px] text-muted-foreground/50">This income will not be counted from {stopFrom} onwards</p>
          </>
        )}
      </AppDialog>
    </AppShell>
  );
}
