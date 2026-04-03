import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { FinanceNav } from "@/components/layout/FinanceNav";
import { SavingGoalCard } from "@/components/finances/SavingGoalCard";
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
import { toast } from "sonner";

export default function SavingsPage() {
  const savingGoals = useFinanceStore((s) => s.savingGoals);
  const addSavingGoal = useFinanceStore((s) => s.addSavingGoal);
  const updateSavingGoal = useFinanceStore((s) => s.updateSavingGoal);
  const deleteSavingGoal = useFinanceStore((s) => s.deleteSavingGoal);
  const addToSavingGoal = useFinanceStore((s) => s.addToSavingGoal);
  const wallets = useCurrencyStore((s) => s.wallets);
  const mainCurrency = useCurrencyStore((s) => s.mainCurrency);

  
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    target: "",
    monthly: "",
    isEmergency: false,
    currency: mainCurrency,
  });

  function handleCreate() {
    if (!form.name.trim() || !form.target) return;
    addSavingGoal({
      name: form.name.trim(),
      targetAmount: Number(form.target),
      savedAmount: 0,
      monthlyContribution: Number(form.monthly) || 0,
      isEmergency: form.isEmergency,
      currency: form.currency,
    });
    toast.success("Goal created");
    setForm({ name: "", target: "", monthly: "", isEmergency: false, currency: mainCurrency });
    setOpen(false);
  }

  
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    target: "",
    saved: "",
    monthly: "",
    isEmergency: false,
    currency: mainCurrency,
  });

  function openEdit(id: string) {
    const g = savingGoals.find((x) => x.id === id);
    if (!g) return;
    setEditId(id);
    setEditForm({
      name: g.name,
      target: String(g.targetAmount),
      saved: String(g.savedAmount),
      monthly: String(g.monthlyContribution),
      isEmergency: g.isEmergency,
      currency: g.currency || mainCurrency,
    });
    setEditOpen(true);
  }

  function handleEdit() {
    if (!editId || !editForm.name.trim() || !editForm.target) return;
    updateSavingGoal(editId, {
      name: editForm.name.trim(),
      targetAmount: Number(editForm.target),
      savedAmount: Number(editForm.saved) || 0,
      monthlyContribution: Number(editForm.monthly) || 0,
      isEmergency: editForm.isEmergency,
      currency: editForm.currency,
    });
    toast.success("Goal updated");
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
    deleteSavingGoal(deleteId);
    toast.success("Goal deleted");
    setDeleteOpen(false);
  }

  
  const [fundOpen, setFundOpen] = useState(false);
  const [fundId, setFundId] = useState<string | null>(null);
  const [fundAmount, setFundAmount] = useState("");

  function openFund(id: string) {
    setFundId(id);
    setFundAmount("");
    setFundOpen(true);
  }

  function handleFund() {
    if (!fundId || !fundAmount) return;
    addToSavingGoal(fundId, Number(fundAmount));
    toast.success("Funds added");
    setFundOpen(false);
  }

  return (
    <AppShell title="Finances" actions={<Button size="sm" onClick={() => setOpen(true)}>+ New goal</Button>}>
      <FinanceNav />

      <div className="grid grid-cols-3 gap-px bg-border">
        {savingGoals.map((g) => (
          <div key={g.id} className="relative group">
            <SavingGoalCard goal={g} variant="full" />
            <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer" onClick={() => openFund(g.id)}>[+fund]</button>
              <button className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer" onClick={() => openEdit(g.id)}>[edit]</button>
              <button className="text-[11px] text-muted-foreground hover:text-destructive cursor-pointer" onClick={() => confirmDelete(g.id)}>[del]</button>
            </div>
          </div>
        ))}
      </div>

      {savingGoals.length === 0 && (
        <p className="text-[12px] text-muted-foreground text-center py-10">No saving goals yet</p>
      )}

      <AppDialog title="New saving goal" open={open} onOpenChange={setOpen}
        footer={<Button onClick={handleCreate}>Create</Button>}
      >
        <Input placeholder="Goal name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        <div className="flex gap-2">
          <Input placeholder="Target amount" type="number" value={form.target}
            onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))} className="flex-1" />
          <Select value={form.currency} onValueChange={(v) => setForm((f) => ({ ...f, currency: v ?? mainCurrency }))}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>
              {wallets.map((w) => (<SelectItem key={w.currency} value={w.currency}>{w.currency}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <Input placeholder="Monthly contribution" type="number" value={form.monthly} onChange={(e) => setForm((f) => ({ ...f, monthly: e.target.value }))} />
        <label className="flex items-center gap-2 text-[13px] text-foreground">
          <input type="checkbox" checked={form.isEmergency} onChange={(e) => setForm((f) => ({ ...f, isEmergency: e.target.checked }))} />
          Emergency fund
        </label>
      </AppDialog>

      <AppDialog title="Edit saving goal" open={editOpen} onOpenChange={setEditOpen}
        footer={<Button onClick={handleEdit}>Save</Button>}
      >
        <Input placeholder="Goal name" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
        <div className="flex gap-2">
          <Input placeholder="Target amount" type="number" value={editForm.target}
            onChange={(e) => setEditForm((f) => ({ ...f, target: e.target.value }))} className="flex-1" />
          <Select value={editForm.currency} onValueChange={(v) => setEditForm((f) => ({ ...f, currency: v ?? mainCurrency }))}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>
              {wallets.map((w) => (<SelectItem key={w.currency} value={w.currency}>{w.currency}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <Input placeholder="Saved amount" type="number" value={editForm.saved} onChange={(e) => setEditForm((f) => ({ ...f, saved: e.target.value }))} />
        <Input placeholder="Monthly contribution" type="number" value={editForm.monthly} onChange={(e) => setEditForm((f) => ({ ...f, monthly: e.target.value }))} />
        <label className="flex items-center gap-2 text-[13px] text-foreground">
          <input type="checkbox" checked={editForm.isEmergency} onChange={(e) => setEditForm((f) => ({ ...f, isEmergency: e.target.checked }))} />
          Emergency fund
        </label>
      </AppDialog>

      <AppDialog title="Delete saving goal?" open={deleteOpen} onOpenChange={setDeleteOpen}
        footer={<><Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button><Button onClick={handleDelete} className="bg-destructive! text-destructive-foreground! border-destructive!">Delete</Button></>}
      >
        <p className="text-[13px] text-muted-foreground">This action cannot be undone.</p>
      </AppDialog>

      <AppDialog title="Add funds" open={fundOpen} onOpenChange={setFundOpen}
        footer={<Button onClick={handleFund}>Add</Button>}
      >
        <Input placeholder="Amount" type="number" value={fundAmount} onChange={(e) => setFundAmount(e.target.value)} />
      </AppDialog>
    </AppShell>
  );
}
