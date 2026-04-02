import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { toast } from "sonner";

export function QuickAdd() {
  const [open, setOpen] = useState(false);
  const categories = useFinanceStore((s) => s.categories);
  const addExpense = useFinanceStore((s) => s.addExpense);
  const wallets = useCurrencyStore((s) => s.wallets);
  const mainCurrency = useCurrencyStore((s) => s.mainCurrency);
  const [form, setForm] = useState({ amount: "", name: "", categoryId: "", currency: mainCurrency });

  function handleSubmit() {
    const amount = parseFloat(form.amount);
    if (!amount || !form.name.trim() || !form.categoryId) return;
    const today = new Date().toISOString().split("T")[0];
    addExpense({
      amount,
      name: form.name.trim(),
      categoryId: form.categoryId,
      currency: form.currency,
      date: today,
      subscriptionId: null,
    });
    toast.success("Expense added");
    setForm({ amount: "", name: "", categoryId: "", currency: mainCurrency });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        + Expense
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add expense</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex gap-2">
            <Input
              placeholder="Amount"
              type="number"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              className="flex-1"
            />
            <Select value={form.currency} onValueChange={(v) => setForm((f) => ({ ...f, currency: v ?? mainCurrency }))}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {wallets.map((w) => (
                  <SelectItem key={w.currency} value={w.currency}>{w.currency}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Input
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <Select
            value={form.categoryId}
            onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v ?? "" }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
