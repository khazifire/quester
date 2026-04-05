import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { FinanceNav } from "@/components/layout/FinanceNav";
import { MaskedAmount } from "@/components/shared/MaskedAmount";
import { Button } from "@/components/ui/button";
import { AppDialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFinanceStore } from "@/stores/financeStore";
import { useCurrencyStore } from "@/stores/currencyStore";
import { useAdvanceSubscriptions } from "@/hooks/useAdvanceSubscriptions";
import { DatePicker } from "@/components/ui/date-picker";
import { formatDate, getToday } from "@/lib/utils";
import { toast } from "sonner";

export default function SubscriptionsPage() {
  const subscriptions = useFinanceStore((s) => s.subscriptions);
  const categories = useFinanceStore((s) => s.categories);
  const addSubscription = useFinanceStore((s) => s.addSubscription);
  const updateSubscription = useFinanceStore((s) => s.updateSubscription);
  const deleteSubscription = useFinanceStore((s) => s.deleteSubscription);
  useAdvanceSubscriptions();

  const getCategoryById = (id: string) => categories.find((c) => c.id === id);
  const convert = useCurrencyStore((s) => s.convert);
  const activeSubscriptions = subscriptions.filter((s) => s.active);
  const subTotal = activeSubscriptions.reduce((sum, s) => sum + convert(s.amount, s.currency), 0);
  const wallets = useCurrencyStore((s) => s.wallets);
  const mainCurrency = useCurrencyStore((s) => s.mainCurrency);

  
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    amount: "",
    categoryId: "",
    cycle: "monthly" as "monthly" | "yearly",
    currency: mainCurrency,
    nextDate: getToday(),
  });

  function handleCreate() {
    if (!form.name.trim() || !form.amount || !form.categoryId) return;
    addSubscription({
      name: form.name.trim(),
      amount: Number(form.amount),
      categoryId: form.categoryId,
      cycle: form.cycle,
      nextDate: form.nextDate || getToday(),
      active: true,
      currency: form.currency,
    });
    toast.success("Subscription added");
    setForm({ name: "", amount: "", categoryId: "", cycle: "monthly", currency: mainCurrency, nextDate: getToday() });
    setOpen(false);
  }

  
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    amount: "",
    categoryId: "",
    cycle: "monthly" as "monthly" | "yearly",
    currency: mainCurrency,
    active: true,
    nextDate: getToday(),
  });

  function openEdit(id: string) {
    const s = subscriptions.find((x) => x.id === id);
    if (!s) return;
    setEditId(id);
    setEditForm({
      name: s.name,
      amount: String(s.amount),
      categoryId: s.categoryId,
      cycle: s.cycle,
      currency: s.currency || mainCurrency,
      active: s.active,
      nextDate: s.nextDate,
    });
    setEditOpen(true);
  }

  function handleEdit() {
    if (!editId || !editForm.name.trim() || !editForm.amount) return;
    updateSubscription(editId, {
      name: editForm.name.trim(),
      amount: Number(editForm.amount),
      categoryId: editForm.categoryId,
      cycle: editForm.cycle,
      currency: editForm.currency,
      active: editForm.active,
      nextDate: editForm.nextDate,
    });
    toast.success("Subscription updated");
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
    deleteSubscription(deleteId);
    toast.success("Subscription deleted");
    setDeleteOpen(false);
  }

  return (
    <AppShell title="Finances" actions={<Button size="sm" onClick={() => setOpen(true)}>+ Add</Button>}>
      <FinanceNav />

      <div className="grid grid-cols-3 gap-6 pb-4 mb-4 border-b border-border">
        <div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-[0.06em] mb-1">Annual cost</div>
          <div className="text-[18px] font-medium tabular-nums"><MaskedAmount value={Math.round(subTotal * 12)} />/yr</div>
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-[0.06em] mb-1">Monthly cost</div>
          <div className="text-[18px] font-medium tabular-nums"><MaskedAmount value={Math.round(subTotal)} />/mo</div>
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-[0.06em] mb-1">Subscriptions</div>
          <div className="text-[18px] font-medium tabular-nums">{subscriptions.length}</div>
          <div className="text-[9px] text-muted-foreground mt-0.5">{activeSubscriptions.length} active</div>
        </div>
      </div>

      <div className="mb-3">
        <span className="text-[12px] text-muted-foreground uppercase tracking-[0.06em]">Subscriptions</span>
      </div>

      <div className="grid grid-cols-[1fr_100px_80px_50px_80px_70px] gap-3 py-2.5 text-[11px] uppercase tracking-[0.06em] text-muted-foreground border-b border-border">
        <span>Name</span>
        <span>Category</span>
        <span>Next</span>
        <span>Cur</span>
        <span className="text-right">Amount</span>
        <span className="text-right">Actions</span>
      </div>

      {subscriptions.map((s) => {
        const cat = getCategoryById(s.categoryId);
        return (
          <div
            key={s.id}
            className={`grid grid-cols-[1fr_100px_80px_50px_80px_70px] gap-3 py-2.5 text-[13px] border-b border-border last:border-0 hover:bg-white/[0.02] transition-colors ${!s.active ? "opacity-40" : ""}`}
          >
            <span className="text-foreground">{s.name}</span>
            <span className="text-[12px] text-muted-foreground">{cat?.name}</span>
            <span className="text-[11px] text-muted-foreground font-mono tabular-nums">
              {formatDate(s.nextDate)}
            </span>
            <span className="text-[11px] text-muted-foreground font-mono">
              {s.currency || "—"}
            </span>
            <span className="text-[13px] font-mono tabular-nums text-right">
              <MaskedAmount value={s.amount} currency={s.currency} />
            </span>
            <span className="flex items-center justify-end gap-2">
              <button
                className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                onClick={() => openEdit(s.id)}
              >
                [edit]
              </button>
              <button
                className="text-[11px] text-muted-foreground hover:text-destructive cursor-pointer"
                onClick={() => confirmDelete(s.id)}
              >
                [del]
              </button>
            </span>
          </div>
        );
      })}

      <AppDialog title="Add subscription" open={open} onOpenChange={setOpen}
        footer={<Button onClick={handleCreate}>Add</Button>}
      >
        <Input placeholder="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        <div className="flex gap-2">
          <Input placeholder="Amount" type="number" value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} className="flex-1" />
          <Select value={form.currency} onValueChange={(v) => setForm((f) => ({ ...f, currency: v ?? mainCurrency }))}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>
              {wallets.map((w) => (<SelectItem key={w.currency} value={w.currency}>{w.currency}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <Select value={form.categoryId} onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v ?? "" }))}>
          <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            {categories.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={form.cycle} onValueChange={(v) => setForm((f) => ({ ...f, cycle: (v ?? "monthly") as "monthly" | "yearly" }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
        <DatePicker value={form.nextDate} onChange={(v) => setForm((f) => ({ ...f, nextDate: v }))} />
      </AppDialog>

      <AppDialog title="Edit subscription" open={editOpen} onOpenChange={setEditOpen}
        footer={<Button onClick={handleEdit}>Save</Button>}
      >
        <Input placeholder="Name" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
        <div className="flex gap-2">
          <Input placeholder="Amount" type="number" value={editForm.amount}
            onChange={(e) => setEditForm((f) => ({ ...f, amount: e.target.value }))} className="flex-1" />
          <Select value={editForm.currency} onValueChange={(v) => setEditForm((f) => ({ ...f, currency: v ?? mainCurrency }))}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>
              {wallets.map((w) => (<SelectItem key={w.currency} value={w.currency}>{w.currency}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <Select value={editForm.categoryId} onValueChange={(v) => setEditForm((f) => ({ ...f, categoryId: v ?? "" }))}>
          <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            {categories.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={editForm.cycle} onValueChange={(v) => setEditForm((f) => ({ ...f, cycle: (v ?? "monthly") as "monthly" | "yearly" }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
        <DatePicker value={editForm.nextDate} onChange={(v) => setEditForm((f) => ({ ...f, nextDate: v }))} />
        <label className="flex items-center gap-2 text-[13px] text-foreground">
          <input type="checkbox" checked={editForm.active}
            onChange={(e) => setEditForm((f) => ({ ...f, active: e.target.checked }))} />
          Active
        </label>
      </AppDialog>

      <AppDialog title="Delete subscription?" open={deleteOpen} onOpenChange={setDeleteOpen}
        footer={<><Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button><Button onClick={handleDelete} className="bg-destructive! text-destructive-foreground! border-destructive!">Delete</Button></>}
      >
        <p className="text-[13px] text-muted-foreground">This action cannot be undone.</p>
      </AppDialog>
    </AppShell>
  );
}
