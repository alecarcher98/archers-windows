export function PhoneMockup({
  children,
  label,
}: {
  children: React.ReactNode;
  label?: string;
}) {
  return (
    <div className="mx-auto w-[260px] shrink-0 sm:w-[280px]">
      <div className="rounded-[2.5rem] border-[6px] border-zinc-900 bg-zinc-900 p-2 shadow-xl">
        <div className="relative overflow-hidden rounded-[2rem] bg-white">
          <div className="absolute top-0 left-1/2 z-10 h-5 w-28 -translate-x-1/2 rounded-b-xl bg-zinc-900" />
          <div className="flex items-center justify-between px-5 pt-3 pb-1 text-[11px] font-medium text-zinc-900">
            <span>9:41</span>
            <span aria-hidden>●●●●</span>
          </div>
          <div className="min-h-[420px] px-4 pt-2 pb-5">{children}</div>
        </div>
      </div>
      {label ? (
        <p className="mt-3 text-center text-sm font-medium text-zinc-600">{label}</p>
      ) : null}
    </div>
  );
}
