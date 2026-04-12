const CACHE_NAME = "snagflow-v1";
const STATIC_ASSETS = ["/", "/manifest.json"];

// Install: cache shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first for API, cache-first for static
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and API calls
  if (request.method !== "GET" || url.pathname.startsWith("/api")) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached); // Fallback to cache if offline

      return cached || fetchPromise;
    })
  );
});

// Background sync for offline snag submissions
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-snags") {
    event.waitUntil(syncOfflineSnags());
  }
});

async function syncOfflineSnags() {
  // Retrieve queued snags from IndexedDB and POST them
  // Implementation depends on your offline queue setup
  console.log("[SW] Syncing offline snags...");
}
