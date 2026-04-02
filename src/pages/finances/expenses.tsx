import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { FinanceNav } from "@/components/layout/FinanceNav";
import { QuickAdd } from "@/components/finances/QuickAdd";
import { MaskedAmount } from "@/components/shared/MaskedAmount";
import { Button } from "@/components/ui/button";
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
import { useCurrencyStore } from "@/stores/currencyStore";
import { getMonthKey, formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function ExpensesPage() {
  const allExpenses = useFinanceStore((s) => s.expenses);
  const categories = useFinanceStore((s) => s.categories);
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
  const [editForm, setEditForm] = useState({ name: "", amount: "", categoryId: "", currency: mainCurrency });

  function openEdit(id: string) {
    const e = allExpenses.find((x) => x.id === id);
    if (!e) return;
    setEditId(id);
    setEditForm({ name: e.name, amount: String(e.amount), categoryId: e.categoryId, currency: e.currency || mainCurrency });
    setEditOpen(true);
  }

  function handleEdit() {
    if (!editId || !editForm.name.trim() || !editForm.amount) return;
    updateExpense(editId, {
      name: editForm.name.trim(),
      amount: Number(editForm.amount),
      categoryId: editForm.categoryId,
      currency: editForm.currency,
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

  return (
    <AppShell title="Finances" actions={<QuickAdd />}>
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

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit expense</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <Input
              placeholder="Name"
              value={editForm.name}
              onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
            />
            <div className="flex gap-2">
              <Input
                placeholder="Amount"
                type="number"
                value={editForm.amount}
                onChange={(e) => setEditForm((f) => ({ ...f, amount: e.target.value }))}
                className="flex-1"
              />
              <Select value={editForm.currency} onValueChange={(v) => setEditForm((f) => ({ ...f, currency: v ?? mainCurrency }))}>
                <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {wallets.map((w) => (
                    <SelectItem key={w.currency} value={w.currency}>{w.currency}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Select value={editForm.categoryId} onValueChange={(v) => setEditForm((f) => ({ ...f, categoryId: v ?? "" }))}>
              <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button onClick={handleEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete expense?</DialogTitle>
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
    </AppShell>
  );
}
