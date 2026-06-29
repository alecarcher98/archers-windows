"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    // location.pathname is the original request path, not the rewritten
    // target — "/" and "/demo" alias to the marketing site (see proxy.ts),
    // so they need excluding by name, not by prefix alone.
    const path = location.pathname;
    if (path === "/" || path === "/demo" || path.startsWith("/marketing")) return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => null);
  }, []);
  return null;
}
