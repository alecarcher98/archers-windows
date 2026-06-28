import type { Metadata } from "next";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export const metadata: Metadata = {
  title: "Get Round Mate — done-for-you round management for window cleaners",
  description:
    "I built this for my mum and dad's window-cleaning round. Send me your customer list and I'll set yours up the same way — who's due, who's paid, gate codes and skipped cleans, all on your phone.",
  openGraph: {
    title: "Get Round Mate",
    description:
      "Done-for-you round management for window cleaners. Your whole round, on your phone.",
    type: "website",
  },
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="marketing flex min-h-full flex-col bg-white text-zinc-900">
      <MarketingNav />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
