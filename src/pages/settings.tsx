import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAppStore } from "@/stores/appStore";
import { useFinanceStore } from "@/stores/financeStore";
import { useHabitStore } from "@/stores/habitStore";
import { useCurrencyStore } from "@/stores/currencyStore";
import { HABIT_CATEGORIES } from "@/lib/constants";
import { toast } from "sonner";

const AVAILABLE_CURRENCIES = [
  "USD", "EUR", "GBP", "JPY", "THB", "ZAR", "AUD", "CAD", "SGD",
  "MYR", "PHP", "IDR", "VND", "BRL", "MXN", "INR", "KRW", "CNY",
  "CHF", "SEK", "NOK", "DKK", "NZD", "HKD", "TWD",
];

export default function SettingsPage() {
  const { identityStatement, setIdentityStatement } = useAppStore();
  const categories = useFinanceStore((s) => s.categories);
  const addCategory = useFinanceStore((s) => s.addCategory);
  const updateCategory = useFinanceStore((s) => s.updateCategory);
  const deleteCategory = useFinanceStore((s) => s.deleteCategory);
  const habits = useHabitStore((s) => s.habits);
  const addHabit = useHabitStore((s) => s.addHabit);
  const updateHabit = useHabitStore((s) => s.updateHabit);
  const deleteHabit = useHabitStore((s) => s.deleteHabit);
  const {
    mainCurrency,
    wallets,
    exchangeRates,
    isFetching,
    setMainCurrency,
    addWallet,
    removeWallet,
    fetchRates,
    getSymbol,
  } = useCurrencyStore();

  const [identity, setIdentity] = useState(identityStatement);
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState("#888888");
  const [newWalletCurrency, setNewWalletCurrency] = useState("");
  const [newWalletLabel, setNewWalletLabel] = useState("");

  // Category edit/delete state
  const [editCatOpen, setEditCatOpen] = useState(false);
  const [editCatId, setEditCatId] = useState<string | null>(null);
  const [editCatForm, setEditCatForm] = useState({ name: "", color: "#888888" });
  const [deleteCatOpen, setDeleteCatOpen] = useState(false);
  const [deleteCatId, setDeleteCatId] = useState<string | null>(null);

  // Habit state
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitIcon, setNewHabitIcon] = useState("◐");
  const [newHabitCategory, setNewHabitCategory] = useState<string>("system");
  const [editHabitOpen, setEditHabitOpen] = useState(false);
  const [editHabitId, setEditHabitId] = useState<string | null>(null);
  const [editHabitForm, setEditHabitForm] = useState({ name: "", icon: "", category: "system", active: true });
  const [deleteHabitOpen, setDeleteHabitOpen] = useState(false);
  const [deleteHabitId, setDeleteHabitId] = useState<string | null>(null);

  function handleSaveIdentity() {
    setIdentityStatement(identity);
    toast.success("Identity updated");
  }

  function handleAddCategory() {
    if (!newCatName.trim()) return;
    addCategory({ name: newCatName.trim(), color: newCatColor });
    setNewCatName("");
    setNewCatColor("#888888");
    toast.success("Category added");
  }

  function openEditCat(id: string) {
    const cat = categories.find((c) => c.id === id);
    if (!cat) return;
    setEditCatId(id);
    setEditCatForm({ name: cat.name, color: cat.color });
    setEditCatOpen(true);
  }

  function handleEditCat() {
    if (!editCatId || !editCatForm.name.trim()) return;
    updateCategory(editCatId, { name: editCatForm.name.trim(), color: editCatForm.color });
    toast.success("Category updated");
    setEditCatOpen(false);
  }

  function confirmDeleteCat(id: string) {
    setDeleteCatId(id);
    setDeleteCatOpen(true);
  }

  function handleDeleteCat() {
    if (!deleteCatId) return;
    deleteCategory(deleteCatId);
    toast.success("Category deleted");
    setDeleteCatOpen(false);
  }

  function handleAddHabit() {
    if (!newHabitName.trim()) return;
    addHabit({ name: newHabitName.trim(), icon: newHabitIcon, category: newHabitCategory as any, active: true });
    setNewHabitName("");
    setNewHabitIcon("◐");
    setNewHabitCategory("system");
    toast.success("Habit added");
  }

  function openEditHabit(id: string) {
    const h = habits.find((x) => x.id === id);
    if (!h) return;
    setEditHabitId(id);
    setEditHabitForm({ name: h.name, icon: h.icon, category: h.category, active: h.active });
    setEditHabitOpen(true);
  }

  function handleEditHabit() {
    if (!editHabitId || !editHabitForm.name.trim()) return;
    updateHabit(editHabitId, {
      name: editHabitForm.name.trim(),
      icon: editHabitForm.icon,
      category: editHabitForm.category as any,
      active: editHabitForm.active,
    });
    toast.success("Habit updated");
    setEditHabitOpen(false);
  }

  function confirmDeleteHabit(id: string) {
    setDeleteHabitId(id);
    setDeleteHabitOpen(true);
  }

  function handleDeleteHabit() {
    if (!deleteHabitId) return;
    deleteHabit(deleteHabitId);
    toast.success("Habit deleted");
    setDeleteHabitOpen(false);
  }

  function handleAddWallet() {
    if (!newWalletCurrency) return;
    addWallet({
      currency: newWalletCurrency,
      label: newWalletLabel || newWalletCurrency,
    });
    setNewWalletCurrency("");
    setNewWalletLabel("");
    toast.success("Wallet added");
  }

  function handleSetMain(currency: string) {
    setMainCurrency(currency);
    toast.success(`Main currency set to ${currency}`);
    fetchRates();
  }

  const ratesAge = exchangeRates
    ? Math.round((Date.now() - exchangeRates.lastFetched) / (1000 * 60 * 60))
    : null;

  return (
    <AppShell title="Settings">
      <div className="space-y-8">

        <section className="max-w-[700px]">
          <div className="text-[12px] uppercase tracking-[0.06em] text-muted-foreground mb-3">
            Identity Statement
          </div>
          <div className="flex gap-2">
            <Input
              value={identity}
              onChange={(e) => setIdentity(e.target.value)}
              className="flex-1"
              placeholder="I am someone who..."
            />
            <Button onClick={handleSaveIdentity}>Save</Button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">
            Displayed on your overview dashboard as a daily reminder.
          </p>
        </section>

       

        <div className="grid grid-cols-[1fr_320px] gap-8">
          <section>
            <div className="text-[12px] uppercase tracking-[0.06em] text-muted-foreground mb-3">
              Currencies
            </div>

            <div className="mb-4">
              <div className="text-[13px] text-foreground mb-2">Main display currency</div>
              <Select value={mainCurrency} onValueChange={(v) => handleSetMain(v ?? mainCurrency)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {wallets.map((w) => (
                    <SelectItem key={w.currency} value={w.currency}>
                      {getSymbol(w.currency)} {w.currency} — {w.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground mt-1.5">
                All amounts are auto-converted to this currency for display.
              </p>
            </div>

            <div className="mb-4">
              <div className="text-[13px] text-foreground mb-2">Wallets</div>
              <div className="bg-card">
                <div className="grid grid-cols-[60px_1fr_120px_60px] gap-3 px-3 py-2 text-[11px] uppercase tracking-[0.06em] text-muted-foreground border-b border-border">
                  <span>Code</span>
                  <span>Label</span>
                  <span>1 = {mainCurrency}</span>
                  <span></span>
                </div>
                {wallets.map((w) => {
                  const rate = exchangeRates?.rates[w.currency];
                  const isMain = w.currency === mainCurrency;
                  const toMain = rate && rate > 0 ? 1 / rate : null;
                  return (
                    <div
                      key={w.currency}
                      className="grid grid-cols-[60px_1fr_120px_60px] gap-3 px-3 py-2.5 text-[13px] border-b border-border last:border-0"
                    >
                      <span className="text-foreground font-mono">{w.currency}</span>
                      <span className="text-foreground/70">
                        {w.label}
                        {isMain && <span className="text-muted-foreground ml-1">(main)</span>}
                      </span>
                      <span className="text-[12px] text-muted-foreground font-mono tabular-nums">
                        {isMain ? "1.0000" : toMain ? toMain.toFixed(2) : "—"}
                      </span>
                      <span>
                        {!isMain && (
                          <button
                            className="text-[11px] text-muted-foreground hover:text-destructive cursor-pointer"
                            onClick={() => removeWallet(w.currency)}
                          >
                            remove
                          </button>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Select value={newWalletCurrency} onValueChange={(v) => setNewWalletCurrency(v ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Currency code" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_CURRENCIES.filter(
                      (c) => !wallets.some((w) => w.currency === c)
                    ).map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input
                value={newWalletLabel}
                onChange={(e) => setNewWalletLabel(e.target.value)}
                placeholder="Label (optional)"
                className="flex-1"
              />
              <Button onClick={handleAddWallet}>Add wallet</Button>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <p className="text-[11px] text-muted-foreground">
                Rates base: {exchangeRates?.base || "—"}
                {ratesAge !== null && ` · Updated ${ratesAge}h ago`}
              </p>
              <button
                className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                onClick={() => {
                  useCurrencyStore.setState({ exchangeRates: null });
                  fetchRates();
                  toast.success("Refreshing rates...");
                }}
                disabled={isFetching}
              >
                [{isFetching ? "fetching..." : "refresh"}]
              </button>
            </div>
          </section>

          <section>
            <div className="text-[12px] uppercase tracking-[0.06em] text-muted-foreground mb-3">
              Expense Categories
            </div>

            <div className="bg-card mb-4">
              <div className="grid grid-cols-[24px_1fr_70px] gap-3 px-3 py-2 text-[11px] uppercase tracking-[0.06em] text-muted-foreground border-b border-border">
                <span></span>
                <span>Name</span>
                <span className="text-right">Actions</span>
              </div>
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="grid grid-cols-[24px_1fr_70px] gap-3 px-3 py-2.5 text-[13px] border-b border-border last:border-0"
                >
                  <div
                    className="w-3 h-3 rounded-sm mt-0.5"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-foreground">{cat.name}</span>
                  <span className="flex items-center justify-end gap-2">
                    <button
                      className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                      onClick={() => openEditCat(cat.id)}
                    >
                      [edit]
                    </button>
                    <button
                      className="text-[11px] text-muted-foreground hover:text-destructive cursor-pointer"
                      onClick={() => confirmDeleteCat(cat.id)}
                    >
                      [del]
                    </button>
                  </span>
                </div>
              ))}
            </div>

            <div className="flex gap-2 items-end">
              <Input
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Category name"
                className="flex-1"
              />
              <input
                type="color"
                value={newCatColor}
                onChange={(e) => setNewCatColor(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer bg-transparent border border-border"
              />
              <Button onClick={handleAddCategory}>Add</Button>
            </div>
          </section>
        </div>

         <section>
          <div className="text-[12px] uppercase tracking-[0.06em] text-muted-foreground mb-3">
            Systems (Habits)
          </div>

          <div className="bg-card mb-4 max-w-[700px]">
            <div className="grid grid-cols-[32px_1fr_80px_60px_70px] gap-3 px-3 py-2 text-[11px] uppercase tracking-[0.06em] text-muted-foreground border-b border-border">
              <span>Icon</span>
              <span>Name</span>
              <span>Category</span>
              <span>Status</span>
              <span className="text-right">Actions</span>
            </div>
            {habits.map((h) => (
              <div
                key={h.id}
                className="grid grid-cols-[32px_1fr_80px_60px_70px] gap-3 px-3 py-2.5 text-[13px] border-b border-border last:border-0"
              >
                <span>{h.icon}</span>
                <span className={h.active ? "text-foreground" : "text-muted-foreground line-through"}>{h.name}</span>
                <span className="text-[11px] text-muted-foreground capitalize">{h.category}</span>
                <span className="text-[11px] text-muted-foreground">{h.active ? "active" : "off"}</span>
                <span className="flex items-center justify-end gap-2">
                  <button
                    className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                    onClick={() => openEditHabit(h.id)}
                  >
                    [edit]
                  </button>
                  <button
                    className="text-[11px] text-muted-foreground hover:text-destructive cursor-pointer"
                    onClick={() => confirmDeleteHabit(h.id)}
                  >
                    [del]
                  </button>
                </span>
              </div>
            ))}
            {habits.length === 0 && (
              <p className="text-[12px] text-muted-foreground text-center py-4">No habits yet</p>
            )}
          </div>

          <div className="flex gap-2 items-end max-w-[700px]">
            <Input
              value={newHabitIcon}
              onChange={(e) => setNewHabitIcon(e.target.value)}
              placeholder="Icon"
              className="w-16"
            />
            <Input
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              placeholder="Habit name"
              className="flex-1"
            />
            <Select value={newHabitCategory} onValueChange={(v) => setNewHabitCategory(v ?? "system")}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HABIT_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAddHabit}>Add</Button>
          </div>
        </section>
      </div>

      <Dialog open={editCatOpen} onOpenChange={setEditCatOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit category</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 items-end py-4">
            <Input
              placeholder="Name"
              value={editCatForm.name}
              onChange={(e) => setEditCatForm((f) => ({ ...f, name: e.target.value }))}
              className="flex-1"
            />
            <input
              type="color"
              value={editCatForm.color}
              onChange={(e) => setEditCatForm((f) => ({ ...f, color: e.target.value }))}
              className="w-10 h-10 rounded cursor-pointer bg-transparent border border-border"
            />
          </div>
          <DialogFooter>
            <Button onClick={handleEditCat}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editHabitOpen} onOpenChange={setEditHabitOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit habit</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <div className="flex gap-2">
              <Input
                placeholder="Icon"
                value={editHabitForm.icon}
                onChange={(e) => setEditHabitForm((f) => ({ ...f, icon: e.target.value }))}
                className="w-16"
              />
              <Input
                placeholder="Name"
                value={editHabitForm.name}
                onChange={(e) => setEditHabitForm((f) => ({ ...f, name: e.target.value }))}
                className="flex-1"
              />
            </div>
            <div className="flex gap-2">
              <Select value={editHabitForm.category} onValueChange={(v) => setEditHabitForm((f) => ({ ...f, category: v ?? "system" }))}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HABIT_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={editHabitForm.active ? "active" : "inactive"} onValueChange={(v) => setEditHabitForm((f) => ({ ...f, active: v === "active" }))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleEditHabit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteHabitOpen} onOpenChange={setDeleteHabitOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete habit?</DialogTitle>
          </DialogHeader>
          <p className="text-[13px] text-muted-foreground py-4 px-6">
            This will delete the habit and all its log history. This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteHabitOpen(false)}>Cancel</Button>
            <Button
              onClick={handleDeleteHabit}
              className="!bg-destructive !text-destructive-foreground !border-destructive"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteCatOpen} onOpenChange={setDeleteCatOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete category?</DialogTitle>
          </DialogHeader>
          <p className="text-[13px] text-muted-foreground py-4 px-6">
            Expenses using this category will keep their data but show no category. This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteCatOpen(false)}>Cancel</Button>
            <Button
              onClick={handleDeleteCat}
              className="!bg-destructive !text-destructive-foreground !border-destructive"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
