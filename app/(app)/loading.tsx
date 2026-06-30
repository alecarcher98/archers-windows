export default function AppLoading() {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-lg items-center gap-3 px-4 py-3">
          <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-zinc-100" />
          <div className="h-4 w-24 animate-pulse rounded-full bg-zinc-100" />
        </div>
      </header>
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4">
        <div className="flex flex-col gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100/70"
              style={{ animationDelay: `${i * 75}ms` }}
            />
          ))}
        </div>
      </main>
    </>
  );
}
