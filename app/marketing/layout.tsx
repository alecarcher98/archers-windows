import type { Metadata, Viewport } from "next";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"
  ),
  title: "RoundMate — done-for-you round management for window cleaners",
  description:
    "I built this for my mum and dad's window-cleaning round. Send me your customer list and I'll set yours up the same way — who's due, who's paid, gate codes and skipped cleans, all on your phone.",
  manifest: "/marketing/manifest.json",
  appleWebApp: { capable: true, title: "RoundMate" },
  openGraph: {
    title: "RoundMate",
    description:
      "Done-for-you round management for window cleaners. Your round, simplified.",
    type: "website",
    images: ["/marketing/logo.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#c2410c",
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
