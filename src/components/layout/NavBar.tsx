import Link from "next/link";
import { useRouter } from "next/router";

const NAV_ITEMS = [
  { href: "/", label: "Overview" },
  { href: "/sidequests", label: "Projects" },
  { href: "/schedule", label: "Schedule" },
  { href: "/finances", label: "Finances" },
  { href: "/settings", label: "Settings" },
];

export function NavBar() {
  const router = useRouter();

  function isActive(href: string): boolean {
    if (href === "/") return router.pathname === "/";
    return router.pathname.startsWith(href);
  }

  return (
    <nav className="flex gap-5">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`text-[13px] transition-opacity ${
            isActive(item.href)
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
