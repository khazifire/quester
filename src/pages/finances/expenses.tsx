import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { FinanceNav } from "@/components/layout/FinanceNav";
import { QuickAdd } from "@/components/finances/QuickAdd";
import { MaskedAmount } from "@/components/shared/MaskedAmount";
import { Button } from "@/components/ui/button";
import { AppDialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFinanceStore } from "@/stores/financeStore";
import { useCurrencyStore } from "@/stores/currencyStore";
import { getMonthKey, formatDate, getToday } from "@/lib/utils";
import { toast } from "sonner";

const UTIL_DEFAULTS = [
  { name: "Rent", amount: "10000", currency: "THB" },
  { name: "Internet (home)", amount: "535", currency: "THB" },
  { name: "Internet (phone)", amount: "320", currency: "THB" },
  { name: "Electricity", amount: "", currency: "THB" },
  { name: "Water", amount: "", currency: "THB" },
];
type UtilItem = { name: string; amount: string; checked: boolean; currency: string };

export default function ExpensesPage() {
  const allExpenses = useFinanceStore((s) => s.expenses);
  const categories = useFinanceStore((s) => s.categories);
  const addExpense = useFinanceStore((s) => s.addExpense);
  const updateExpense = useFinanceStore((s) => s.updateExpense);
  const deleteExpense = useFinanceStore((s) => s.deleteExpense);
  const convert = useCurrencyStore((s) => s.convert);
  const wallets = useCurrencyStore((s) => s.wallets);
  const mainCurrency = useCurrencyStore((s) => s.mainCurrency);
  const monthKey = getMonthKey();
  const expenses = allExpenses.filter((e) => e.date.startsWith(monthKey));
  const getCategoryById = (id: string) => categories.find((c) => c.id === id);
  const totalExpenses = expenses.reduce((sum, e) => sum + convert(e.amount, e.currency), 0);

  const sorted = [...expenses].sort(
    (a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt
  );

  
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", amount: "", categoryId: "", currency: mainCurrency, date: getToday() });

  function openEdit(id: string) {
    const e = allExpenses.find((x) => x.id === id);
    if (!e) return;
    setEditId(id);
    setEditForm({ name: e.name, amount: String(e.amount), categoryId: e.categoryId, currency: e.currency || mainCurrency, date: e.date || getToday() });
    setEditOpen(true);
  }

  function handleEdit() {
    if (!editId || !editForm.name.trim() || !editForm.amount) return;
    updateExpense(editId, {
      name: editForm.name.trim(),
      amount: Number(editForm.amount),
      categoryId: editForm.categoryId,
      currency: editForm.currency,
      date: editForm.date || getToday(),
    });
    toast.success("Expense updated");
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
    deleteExpense(deleteId);
    toast.success("Expense deleted");
    setDeleteOpen(false);
  }

  // Utils checklist
  const [utilsOpen, setUtilsOpen] = useState(false);
  const [utilItems, setUtilItems] = useState<UtilItem[]>(
    UTIL_DEFAULTS.map((u) => ({ ...u, checked: true }))
  );
  const [utilDate, setUtilDate] = useState(getToday());

  function openUtils() {
    setUtilItems(UTIL_DEFAULTS.map((u) => ({ ...u, checked: true })));
    setUtilDate(getToday());
    setUtilsOpen(true);
  }

  function handleSubmitUtils() {
    const billsCatId = categories.find((c) => c.id === "cat-bills")?.id ?? categories[0]?.id ?? "";
    const today = getToday();
    const toAdd = utilItems.filter((u) => u.checked && u.amount && Number(u.amount) > 0);
    if (toAdd.length === 0) { toast.error("Check at least one item with an amount"); return; }
    toAdd.forEach((u) => {
      addExpense({ name: u.name, amount: Number(u.amount), categoryId: billsCatId, currency: u.currency, date: utilDate || today, subscriptionId: null });
    });
    toast.success(`${toAdd.length} utility expense${toAdd.length !== 1 ? "s" : ""} added`);
    setUtilsOpen(false);
  }

  return (
    <AppShell title="Finances" actions={
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={openUtils}>+ Add utils</Button>
        <QuickAdd />
      </div>
    }>
      <FinanceNav />

      <div className="flex justify-between items-baseline mb-4">
        <span className="text-[12px] text-muted-foreground uppercase tracking-[0.06em]">
          Expenses
        </span>
        <span className="text-[14px] font-mono tabular-nums">
          Total: <MaskedAmount value={Math.round(totalExpenses)} />
        </span>
      </div>

      <div className="grid grid-cols-[1fr_100px_80px_50px_80px_70px] gap-3 px-0 py-2.5 text-[11px] uppercase tracking-[0.06em] text-muted-foreground border-b border-border">
        <span>Name</span>
        <span>Category</span>
        <span>Date</span>
        <span>Cur</span>
        <span className="text-right">Amount</span>
        <span className="text-right">Actions</span>
      </div>

      {sorted.map((e) => {
        const cat = getCategoryById(e.categoryId);
        return (
          <div
            key={e.id}
            className="grid grid-cols-[1fr_100px_80px_50px_80px_70px] gap-3 py-2.5 text-[13px] border-b border-border last:border-0 hover:bg-white/[0.02] transition-colors"
          >
            <span className="text-foreground truncate">{e.name}</span>
            <span className="text-[12px] text-muted-foreground">{cat?.name}</span>
            <span className="text-[11px] text-muted-foreground font-mono tabular-nums">
              {formatDate(e.date)}
            </span>
            <span className="text-[11px] text-muted-foreground font-mono">
              {e.currency || "—"}
            </span>
            <span className="text-[13px] font-mono tabular-nums text-right">
              <MaskedAmount value={e.amount} currency={e.currency} />
            </span>
            <span className="flex items-center justify-end gap-2">
              <button
                className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                onClick={() => openEdit(e.id)}
              >
                [edit]
              </button>
              <button
                className="text-[11px] text-muted-foreground hover:text-destructive cursor-pointer"
                onClick={() => confirmDelete(e.id)}
              >
                [del]
              </button>
            </span>
          </div>
        );
      })}
      {sorted.length === 0 && (
        <p className="text-[12px] text-muted-foreground text-center py-8">
          No expenses this month
        </p>
      )}

      <AppDialog title="Add utilities" open={utilsOpen} onOpenChange={setUtilsOpen}
        footer={<Button onClick={handleSubmitUtils}>Add expenses</Button>}
      >
        <DatePicker value={utilDate} onChange={setUtilDate} />
        {utilItems.map((item, i) => (
          <div key={item.name} className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={item.checked}
              onChange={(e) => setUtilItems((prev) => prev.map((u, j) => j === i ? { ...u, checked: e.target.checked } : u))}
              className="accent-foreground shrink-0"
            />
            <span className={`text-[13px] w-36 shrink-0 ${!item.checked ? "text-muted-foreground" : "text-foreground"}`}>
              {item.name}
            </span>
            <Input
              type="number"
              placeholder="Amount"
              value={item.amount}
              disabled={!item.checked}
              onChange={(e) => setUtilItems((prev) => prev.map((u, j) => j === i ? { ...u, amount: e.target.value } : u))}
              className="flex-1"
            />
            <span className="text-[11px] text-muted-foreground w-8 shrink-0">{item.currency}</span>
          </div>
        ))}
      </AppDialog>

      <AppDialog title="Edit expense" open={editOpen} onOpenChange={setEditOpen}
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
        <DatePicker value={editForm.date} onChange={(v) => setEditForm((f) => ({ ...f, date: v }))} />
      </AppDialog>

      <AppDialog title="Delete expense?" open={deleteOpen} onOpenChange={setDeleteOpen}
        footer={<><Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button><Button onClick={handleDelete} className="bg-destructive! text-destructive-foreground! border-destructive!">Delete</Button></>}
      >
        <p className="text-[13px] text-muted-foreground">This action cannot be undone.</p>
      </AppDialog>
    </AppShell>
  );
}
