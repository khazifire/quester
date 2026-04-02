import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { MaskedAmount } from "@/components/shared/MaskedAmount";
import { useFinanceStore } from "@/stores/financeStore";
import { useProjectStore } from "@/stores/projectStore";
import { useCurrencyStore } from "@/stores/currencyStore";
import { useAppStore } from "@/stores/appStore";

export default function InvoiceViewPage() {
  const router = useRouter();
  const id = router.query.id as string;

  const allInvoices = useFinanceStore((s) => s.invoices);
  const allProjects = useProjectStore((s) => s.projects);
  const allClients = useProjectStore((s) => s.clients);
  const convert = useCurrencyStore((s) => s.convert);
  const mainCurrency = useCurrencyStore((s) => s.mainCurrency);
  const getSymbol = useCurrencyStore((s) => s.getSymbol);

  const showAmounts = useAppStore((s) => s.showAmounts);

  const [hiddenClients, setHiddenClients] = useState<Set<string>>(new Set());
  const [displayCurrency, setDisplayCurrency] = useState<string | null>(null);
  const wallets = useCurrencyStore((s) => s.wallets);

  const fmt = (value: number, currency?: string) => {
    const sym = getSymbol(currency);
    if (!showAmounts) return `${sym}${"•".repeat(String(Math.round(value)).length)}`;
    return `${sym}${Math.round(value).toLocaleString("en-US")}`;
  };

  const invoice = useMemo(
    () => allInvoices.find((inv) => inv.id === id),
    [allInvoices, id]
  );

  if (!invoice) {
    return (
      <AppShell title="Invoice">
        <div className="py-20 text-center">
          <p className="text-[13px] text-muted-foreground">Invoice not found</p>
          <Link
            href="/finances/invoices"
            className="text-[12px] text-muted-foreground hover:text-foreground underline underline-offset-2 mt-2 inline-block"
          >
            Back to invoices
          </Link>
        </div>
      </AppShell>
    );
  }

  const projectIds = invoice.projectIds?.length
    ? invoice.projectIds
    : invoice.projectId
      ? [invoice.projectId]
      : [];

  const invoiceProjects = projectIds
    .map((pid) => allProjects.find((p) => p.id === pid))
    .filter(Boolean) as typeof allProjects;

  const uniqueClients = [...new Map(
    invoiceProjects.map((p) => {
      const c = allClients.find((cl) => cl.id === p.clientId);
      return [p.clientId, c?.name || "Unknown"] as const;
    })
  ).entries()];

  const clientNames = uniqueClients
    .filter(([cid]) => !hiddenClients.has(cid))
    .map(([, name]) => name);

  const visibleProjects = invoiceProjects.filter(
    (p) => !hiddenClients.has(p.clientId)
  );

  const issuedDate = new Date(invoice.issuedDate + "T00:00:00");
  const monthName = issuedDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const formattedDate = issuedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  function toggleClient(clientId: string) {
    setHiddenClients((prev) => {
      const next = new Set(prev);
      if (next.has(clientId)) next.delete(clientId);
      else next.add(clientId);
      return next;
    });
  }

  const subtotal = visibleProjects.reduce(
    (sum, p) => sum + convert(p.amount, p.currency),
    0
  );
  const rawFees = hiddenClients.size > 0
    ? 0
    : (invoice.estimatedFees || 0);
  const feesInMain = rawFees > 0
    ? convert(rawFees, invoice.feesCurrency || invoice.currency)
    : 0;
  const total = subtotal - feesInMain;
  const cur = displayCurrency || mainCurrency;

  const mainToDisplay = (amountInMain: number) => {
    if (cur === mainCurrency) return amountInMain;
    const rates = useCurrencyStore.getState().exchangeRates;
    if (!rates || rates.base !== mainCurrency) return amountInMain;
    const rate = rates.rates[cur];
    if (!rate || rate === 0) return amountInMain;
    return amountInMain * rate;
  };

  const toDisplay = (amount: number, fromCurrency: string | undefined) => {
    const inMain = convert(amount, fromCurrency);
    return mainToDisplay(inMain);
  };

  return (
    <AppShell
      title="Invoice"
      actions={
        <Link
          href="/finances/invoices"
          className="text-[12px] text-muted-foreground hover:text-foreground"
        >
          &larr; Back
        </Link>
      }
    >
      <div className="max-w-3xl mx-auto">
        <div className="border-b border-border pb-5 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[22px] font-medium tracking-tight">
                Invoice
              </div>
              <div className="text-[12px] text-muted-foreground mt-1">
                {monthName}
              </div>
            </div>
            <div className="text-right">
              <span
                className={`text-[11px] uppercase tracking-[0.06em] ${
                  invoice.status === "paid"
                    ? "text-foreground/50"
                    : invoice.status === "overdue"
                      ? "text-destructive"
                      : "text-muted-foreground"
                }`}
              >
                {invoice.status}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-[0.06em] mb-1">
              Issued
            </div>
            <div className="text-[13px] font-mono tabular-nums">{formattedDate}</div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-[0.06em] mb-1">
              Due
            </div>
            <div className="text-[13px] font-mono tabular-nums">
              {new Date(invoice.dueDate + "T00:00:00").toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-[0.06em] mb-1">
              Client
            </div>
            <div className="text-[13px]">{clientNames.join(", ")}</div>
          </div>
        </div>

        {(uniqueClients.length > 1 || wallets.length > 1) && (
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
            {uniqueClients.length > 1 && (
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-muted-foreground uppercase tracking-[0.06em]">Show</span>
                {uniqueClients.map(([cid, name]) => (
                  <button
                    key={cid}
                    onClick={() => toggleClient(cid)}
                    className={`text-[11px] cursor-pointer transition-opacity ${
                      hiddenClients.has(cid)
                        ? "text-muted-foreground/40 line-through"
                        : "text-foreground"
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
            {uniqueClients.length <= 1 && <div />}
            {wallets.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground uppercase tracking-[0.06em]">Currency</span>
                {wallets.map((w) => (
                  <button
                    key={w.currency}
                    onClick={() => setDisplayCurrency(
                      w.currency === mainCurrency && !displayCurrency ? null :
                      w.currency === displayCurrency ? null : w.currency
                    )}
                    className={`text-[11px] font-mono cursor-pointer transition-opacity ${
                      (displayCurrency || mainCurrency) === w.currency
                        ? "text-foreground"
                        : "text-muted-foreground/50"
                    }`}
                  >
                    {w.currency}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mb-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground border-b border-border">
                <th className="py-2.5 text-left font-normal">Company</th>
                <th className="py-2.5 text-left font-normal">Project</th>
                <th className="py-2.5 text-left font-normal">Type</th>
                <th className="py-2.5 text-left font-normal">Currency</th>
                <th className="py-2.5 text-right font-normal">Amount</th>
              </tr>
            </thead>
            <tbody>
              {visibleProjects.map((p) => {
                const clientName = allClients.find((c) => c.id === p.clientId)?.name || "—";
                const isOriginalCurrency = (p.currency || mainCurrency) === cur;
                const displayAmount = toDisplay(p.amount, p.currency);
                return (
                  <tr key={p.id} className="text-[13px] border-b border-border">
                    <td className="py-3 pr-4 text-muted-foreground whitespace-nowrap">{clientName}</td>
                    <td className="py-3 pr-4 text-foreground whitespace-nowrap">{p.name}</td>
                    <td className="py-3 pr-4 text-[11px] text-muted-foreground capitalize">{p.billingType}</td>
                    <td className="py-3 pr-4 text-[11px] text-muted-foreground font-mono">{p.currency || mainCurrency}</td>
                    <td className="py-3 text-right font-mono tabular-nums whitespace-nowrap">
                      <MaskedAmount value={p.amount} currency={p.currency} showOriginal />
                      {!isOriginalCurrency && (
                        <span className="text-muted-foreground text-[11px] ml-1.5">
                          ({fmt(displayAmount, cur)})
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {invoiceProjects.length === 0 &&
                invoice.items.map((item, i) => {
                  const itemCur = item.currency || invoice.currency || mainCurrency;
                  const isOriginalCurrency = itemCur === cur;
                  const displayAmount = toDisplay(item.amount, item.currency);
                  return (
                    <tr key={i} className="text-[13px] border-b border-border">
                      <td className="py-3 pr-4 text-muted-foreground">—</td>
                      <td className="py-3 pr-4 text-foreground">{item.description}</td>
                      <td className="py-3 pr-4 text-[11px] text-muted-foreground">—</td>
                      <td className="py-3 pr-4 text-[11px] text-muted-foreground font-mono">{itemCur}</td>
                      <td className="py-3 text-right font-mono tabular-nums whitespace-nowrap">
                        <MaskedAmount value={item.amount} currency={item.currency} showOriginal />
                        {!isOriginalCurrency && (
                          <span className="text-muted-foreground text-[11px] ml-1.5">
                            ({fmt(displayAmount, cur)})
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <div className="border-t border-border pt-4 max-w-xs ml-auto">
          <div className="flex justify-between py-1.5">
            <span className="text-[12px] text-muted-foreground">Subtotal</span>
            <span className="text-[14px] font-mono tabular-nums">
              {fmt(mainToDisplay(subtotal), cur)}
            </span>
          </div>

          {feesInMain > 0 && (
            <div className="flex justify-between py-1.5">
              <span className="text-[12px] text-muted-foreground">
                Estimated fees
              </span>
              <span className="text-[14px] font-mono tabular-nums text-destructive">
                &minus; {fmt(mainToDisplay(feesInMain), cur)}
              </span>
            </div>
          )}

          <div className="flex justify-between py-3 mt-2 border-t border-border">
            <span className="text-[14px] text-foreground font-medium">Total</span>
            <span className="text-[20px] font-mono tabular-nums font-medium">
              {fmt(mainToDisplay(total), cur)}
            </span>
          </div>

          {invoice.paidDate && (
            <div className="text-[11px] text-muted-foreground text-right mt-1">
              Paid on{" "}
              {new Date(invoice.paidDate + "T00:00:00").toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
