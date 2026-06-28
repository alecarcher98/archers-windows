import {
  ARCHERS_WINDOWS_LIVE_URL,
  CONTACT_EMAIL,
  mailtoLink,
  whatsAppLink,
} from "@/lib/marketingConfig";

export function MarketingFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-lg font-bold text-zinc-900">Get Round Mate</p>
            <p className="mt-1 max-w-sm text-sm text-zinc-600">
              Built by a window cleaner&rsquo;s kid, for window cleaners. Your round, on your
              phone — nothing you don&rsquo;t need.
            </p>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <a
              href={ARCHERS_WINDOWS_LIVE_URL}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-[var(--brand)] hover:underline"
            >
              See the real round live →
            </a>
            <a
              href={whatsAppLink("Hi — I'd like to find out about Get Round Mate")}
              className="text-zinc-700 hover:text-zinc-900"
            >
              WhatsApp
            </a>
            <a href={mailtoLink("Get Round Mate enquiry")} className="text-zinc-700 hover:text-zinc-900">
              {CONTACT_EMAIL}
            </a>
          </div>
        </div>
        <p className="mt-8 text-xs text-zinc-500">
          Your data is yours — exportable any time, never sold. © {new Date().getFullYear()} Get
          Round Mate.
        </p>
      </div>
    </footer>
  );
}
