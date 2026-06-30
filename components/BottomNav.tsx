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
    <nav className="sticky bottom-0 z-50 border-t border-zinc-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto grid max-w-lg grid-cols-3 px-4">
        {items.map((it) => {
          const active = isActive(pathname, it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={[
                "flex min-h-16 touch-manipulation flex-col items-center justify-center gap-1.5 py-4 text-xs font-medium transition-colors active:scale-[0.97] active:bg-zinc-100",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]",
                active ? "text-[var(--brand-dark)]" : "text-zinc-500",
              ].join(" ")}
            >
              <span className="text-sm leading-none">{it.label}</span>
              <span
                className={[
                  "h-0.5 w-10 rounded-full transition-colors",
                  active ? "bg-[var(--brand)]" : "bg-transparent",
                ].join(" ")}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
