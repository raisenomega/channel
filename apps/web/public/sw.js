// PWA Service Worker — HUB by Raisen
// Cachea assets, offline support, background sync
const CACHE = "hub-cache-v1";
const APP = "/";

const CACHEABLE = [
  APP, "/index.html", "/manifest.json",
  "/icons/", "/screenshots/",
];

self.addEventListener("install", (e) => {
  self.skipWaiting = true;
  e.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll(CACHEABLE.map((url) => new Request(url)))
    )
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((resp) => {
        if (resp.ok && CACHEABLE.some((p) => e.request.url.includes(p))) {
          const clone = resp.clone();
          caches.open(CACHE).then((cache) => cache.put(e.request, clone));
        }
        return resp;
      });
    }).catch(() => {
      // offline fallback — serve cached version
      return caches.match(APP);
    })
  );
});