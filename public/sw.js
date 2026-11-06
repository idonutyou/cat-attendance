const CACHE_NAME = "cat-attendance-v241";
const CACHE_PREFIX = "cat-attendance-v";

const APP_SHELL = [
  "./",
  "./manifest.webmanifest",
  "./holidays.json",
  "./madeby-fireworks.mp3",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-512-maskable.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((cacheName) =>
            cacheName.startsWith(CACHE_PREFIX) && cacheName !== CACHE_NAME
          )
          .map((cacheName) => caches.delete(cacheName))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const pathname = new URL(event.request.url).pathname;

  // Always fetch widget APK and fallback page directly from the server.
  // In particular, never leave a cached blank widget-noop.html in place.
  if (
    pathname.endsWith("/CAT-widget.apk") ||
    pathname.endsWith("/widget-noop.html")
  ) {
    event.respondWith(fetch(event.request, { cache: "no-store" }));
    return;
  }

  // Keep the app document network-first to avoid mismatched JS/CSS bundles.
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, copy);
            });
          }

          return networkResponse;
        })
        .catch(async () =>
          (await caches.match(event.request)) ||
          (await caches.match("./")) ||
          new Response("오프라인 상태입니다.", {
            status: 503,
            headers: {
              "Content-Type": "text/plain; charset=utf-8"
            }
          })
        )
    );
    return;
  }

  if (
    event.request.destination === "script" ||
    event.request.destination === "style"
  ) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, copy);
            });
          }
          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request)
        .then((networkResponse) => {
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type === "opaque"
          ) {
            return networkResponse;
          }

          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, copy);
          });

          return networkResponse;
        })
        .catch(
          () =>
            new Response("오프라인 상태입니다.", {
              status: 503,
              headers: {
                "Content-Type": "text/plain; charset=utf-8"
              }
            })
        );
    })
  );
});
