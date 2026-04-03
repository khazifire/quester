import Link from "next/link";
import { useRouter } from "next/router";

const FINANCE_TABS = [
  { href: "/finances", label: "Report" },
  { href: "/finances/expenses", label: "Expenses" },
  { href: "/finances/income", label: "Income" },
  { href: "/finances/invoices", label: "Invoices" },
  { href: "/finances/subscriptions", label: "Subscriptions" },
  { href: "/finances/savings", label: "Savings" },
];

export function FinanceNav() {
  const router = useRouter();

  return (
    <div className="flex gap-5 mb-6 border-b border-border pb-2.5">
      {FINANCE_TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`text-[13px] pb-1 transition-opacity ${
            router.pathname === tab.href
              ? "text-foreground border-b border-foreground/40"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
