import Link from "next/link";

const links = [
  { href: "/tomorrow", label: "Tomorrow", desc: "Preview jobs due tomorrow" },
  { href: "/customers", label: "Customers", desc: "Search, import/export, notes" },
  { href: "/review", label: "Review", desc: "Removed jobs and restore" },
] as const;

export function ScheduleMorePanel() {
  return (
    <ul className="divide-y divide-zinc-200 overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
      {links.map((l) => (
        <li key={l.href}>
          <Link href={l.href} className="block px-4 py-4 hover:bg-zinc-50">
            <p className="text-base font-semibold text-zinc-900">{l.label}</p>
            <p className="mt-0.5 text-sm text-zinc-600">{l.desc}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
