"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string };

const items: NavItem[] = [
  { href: "/schedule", label: "Schedule" },
  { href: "/earnings", label: "Earnings" },
  { href: "/settings", label: "Settings" },
];

function isActive(pathname: string, href: string) {
  if (href === "/schedule") {
    return (
      pathname === "/schedule" ||
      pathname === "/today" ||
      pathname === "/week" ||
      pathname === "/tomorrow" ||
      pathname.startsWith("/day/")
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav() {
  const pathname = usePathname() ?? "/";

  return (
    <nav className="sticky bottom-0 z-50 border-t border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className="mx-auto grid max-w-lg grid-cols-3 px-4">
        {items.map((it) => {
          const active = isActive(pathname, it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={[
                "flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-600",
                active
                  ? "text-zinc-900 dark:text-zinc-50"
                  : "text-zinc-500 dark:text-zinc-400",
              ].join(" ")}
            >
              <span className="text-[12px] leading-none">{it.label}</span>
              <span
                className={[
                  "h-0.5 w-10 rounded-full",
                  active ? "bg-zinc-900 dark:bg-zinc-50" : "bg-transparent",
                ].join(" ")}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
