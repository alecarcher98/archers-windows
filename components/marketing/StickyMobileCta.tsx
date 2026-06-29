import { whatsAppLink } from "@/lib/marketingConfig";

export function StickyMobileCta() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-white/95 p-3 backdrop-blur sm:hidden">
      <a
        href={whatsAppLink("Hi — I'd like to get my round set up for £99")}
        className="flex h-12 w-full items-center justify-center rounded-full bg-[var(--brand)] text-base font-semibold text-white shadow-md transition hover:bg-[var(--brand-dark)]"
      >
        Get set up — £99
      </a>
    </div>
  );
}
