import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/stores/appStore";
import { useFinanceStore } from "@/stores/financeStore";
import { useCurrencyStore } from "@/stores/currencyStore";
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
              <div className="grid grid-cols-[24px_1fr] gap-3 px-3 py-2 text-[11px] uppercase tracking-[0.06em] text-muted-foreground border-b border-border">
                <span></span>
                <span>Name</span>
              </div>
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="grid grid-cols-[24px_1fr] gap-3 px-3 py-2.5 text-[13px] border-b border-border last:border-0"
                >
                  <div
                    className="w-3 h-3 rounded-sm mt-0.5"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-foreground">{cat.name}</span>
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
      </div>
    </AppShell>
  );
}
