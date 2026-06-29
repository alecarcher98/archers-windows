import type { Metadata } from "next";
import { BottomNav } from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "Archers Windows",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-zinc-50 text-zinc-900">
      <div className="flex flex-1 flex-col items-stretch">{children}</div>
      <BottomNav />
    </div>
  );
}

