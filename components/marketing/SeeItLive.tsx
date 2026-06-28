import { ARCHERS_WINDOWS_LIVE_URL, DEMO_VIDEO_EMBED_URL } from "@/lib/marketingConfig";
import { RevealOnScroll } from "./RevealOnScroll";

function PlayIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

export function SeeItLive() {
  const hasVideo = Boolean(DEMO_VIDEO_EMBED_URL) && DEMO_VIDEO_EMBED_URL !== "#";

  return (
    <section id="see-it-live" className="px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <RevealOnScroll>
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-10">
            <h2 className="text-2xl font-bold text-zinc-900 sm:text-3xl">
              See it live — no demo smoke and mirrors
            </h2>
            <p className="mt-3 max-w-2xl text-zinc-600">
              <strong className="text-zinc-900">Archer&rsquo;s Windows</strong> is the real round I
              built this for — my parents&rsquo; actual business, running on this exact app, every
              week. It&rsquo;s free, live, and stays that way forever.
            </p>
            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
              <a
                href={ARCHERS_WINDOWS_LIVE_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                Open Archer&rsquo;s Windows →
              </a>
              <span className="text-sm text-zinc-500">Real customers. Real round. Free, forever.</span>
            </div>
            <div className="mt-8 aspect-video w-full overflow-hidden rounded-2xl bg-zinc-900">
              {hasVideo ? (
                <iframe
                  src={DEMO_VIDEO_EMBED_URL}
                  title="60-second demo"
                  className="h-full w-full"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-zinc-400">
                  <PlayIcon />
                  <p className="text-sm">60-second demo video — drop your link in lib/marketingConfig.ts</p>
                </div>
              )}
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
