import Image from "next/image";
import { whatsAppLink } from "@/lib/marketingConfig";

export function MarketingFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Image src="/marketing/mark.png" alt="" width={28} height={28} className="h-7 w-7" />
              <p className="text-lg font-bold text-zinc-900">RoundMate</p>
            </div>
            <p className="mt-2 max-w-sm text-sm text-zinc-600">
              Done-for-you round management for cleaners — your round, on your phone,
              nothing you don&rsquo;t need.
            </p>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <a
              href={whatsAppLink("Hi — I'd like to find out about RoundMate")}
              target="_blank"
              rel="noopener"
              className="text-zinc-700 hover:text-zinc-900"
            >
              WhatsApp
            </a>
          </div>
        </div>
        <p className="mt-8 text-xs text-zinc-500">
          Your data is yours — exportable any time, never sold. © {new Date().getFullYear()}{" "}
          RoundMate.
        </p>
      </div>
    </footer>
  );
}
