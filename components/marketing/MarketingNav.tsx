import Image from "next/image";
import Link from "next/link";

export function MarketingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/marketing/mark.png"
            alt=""
            width={32}
            height={32}
            sizes="32px"
            priority
            className="h-8 w-8"
          />
          <span className="text-lg font-bold tracking-tight text-zinc-900">RoundMate</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-zinc-700 sm:flex">
          <a href="#what-it-does" className="hover:text-zinc-900">
            What it does
          </a>
          <a href="#how-it-works" className="hover:text-zinc-900">
            How it works
          </a>
          <a href="#pricing" className="hover:text-zinc-900">
            Pricing
          </a>
          <a href="#faq" className="hover:text-zinc-900">
            FAQ
          </a>
        </nav>
        <a
          href="#pricing"
          className="rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--brand-dark)]"
        >
          Get set up — £99
        </a>
      </div>
    </header>
  );
}
