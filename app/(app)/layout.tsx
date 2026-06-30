import type { Metadata } from "next";
import { BottomNav } from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "RoundMate",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-zinc-50 text-zinc-900">
      <div className="flex flex-1 flex-col items-stretch pb-[calc(4.25rem+env(safe-area-inset-bottom))]">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}

