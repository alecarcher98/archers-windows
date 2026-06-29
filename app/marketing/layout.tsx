import type { Metadata, Viewport } from "next";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { StickyMobileCta } from "@/components/marketing/StickyMobileCta";

// Never derive this from VERCEL_URL — that's the per-deployment preview URL,
// not the custom domain, and it's what was leaking into shared link previews.
const SITE_URL =
  process.env.NODE_ENV === "production" ? "https://roundmate.org" : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "RoundMate — done-for-you round management for window cleaners",
  description:
    "Done-for-you round management for window cleaning rounds (and other cleaning rounds too). Send your customer list and I'll have your round — who's due, who's paid, gate codes and skipped cleans — running on your phone within 24 hours.",
  manifest: "/marketing/manifest.json",
  appleWebApp: { capable: true, title: "RoundMate" },
  openGraph: {
    title: "RoundMate",
    description: "Done-for-you round management for window cleaners. Your round, simplified.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#c2410c",
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="marketing flex min-h-full flex-col bg-white text-zinc-900 pb-20 sm:pb-0">
      <MarketingNav />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
      <StickyMobileCta />
    </div>
  );
}
