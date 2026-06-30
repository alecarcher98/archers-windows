import type { Metadata } from "next";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";

export const metadata: Metadata = {
  title: "Admin — RoundMate",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <a href="/admin" className="text-base font-semibold tracking-tight text-zinc-900">
            RoundMate Admin
          </a>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href="/admin/maintenance"
              className="h-9 rounded-full border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 inline-flex items-center"
            >
              Maintenance
            </a>
            <AdminLogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
