const CACHE = "archers-v2";

self.addEventListener("install", (event) => {
  // Only precache the offline fallback itself — precaching an auth-gated
  // route here (before login) would cache whatever it redirects to (the
  // login page) under that route's URL, poisoning later cache lookups.
  event.waitUntil(caches.open(CACHE).then((c) => c.add("/offline")));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.pathname.startsWith("/api/")) return;

  const isNavigation = event.request.mode === "navigate";

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(event.request, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // Only substitute the offline page for a full page load — doing
          // this for scripts/styles/images would hand the browser HTML in
          // place of the asset it asked for and break rendering entirely.
          if (isNavigation) return caches.match("/offline");
          return Response.error();
        }),
      ),
  );
});
