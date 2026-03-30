const CACHE_NAME = "lager-v2.3.7";

// Cacht nur die statischen Einstiegspunkte.
// Die von Vite gebauten JS/CSS Dateien (mit Hash im Namen)
// werden vom fetch-Event unten dynamisch gecacht!
const PRECACHE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-512.png",
  "./icon.svg",
];

// 1. Installation: Basis-Assets cachen
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

// 2. Activation: Alte Caches löschen (Wichtig für Updates!)
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            if (cache !== CACHE_NAME) {
              console.log("[SW] Lösche alten Cache:", cache);
              return caches.delete(cache);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// 3. Fetch-Strategie: Stale-While-Revalidate
self.addEventListener("fetch", (event) => {
  // Ignoriere P2P Verbindungen
  if (
    event.request.url.includes("peerjs") ||
    event.request.url.includes("stun")
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          const isCacheable =
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === "basic" &&
            event.request.url.startsWith("http");

          if (isCacheable) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {});

      return cachedResponse || fetchPromise;
    })
  );
});
