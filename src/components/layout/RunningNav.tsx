import Link from "next/link";
import { useRouter } from "next/router";

const RUNNING_TABS = [
  { href: "/running", label: "Log" },
  { href: "/running/events", label: "Events" },
  { href: "/running/stats", label: "Stats" },
];

export function RunningNav() {
  const router = useRouter();

  return (
    <div className="flex gap-5 mb-6 border-b border-border pb-2.5">
      {RUNNING_TABS.map((tab) => (
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
