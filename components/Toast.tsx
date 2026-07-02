"use client";

import { useCallback, useEffect, useState } from "react";

export function useToast() {
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 2000);
    return () => clearTimeout(t);
  }, [msg]);

  // Stable across renders so callers can safely list it as a useCallback/useMemo
  // dependency without that dependency forcing a fresh function every render.
  const showToast = useCallback((m: string) => {
    setMsg(m);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(10);
      } catch {
        /* ignore */
      }
    }
  }, []);

  return { toast: msg, showToast };
}

export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-20 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-lg">
      {message}
    </div>
  );
}
