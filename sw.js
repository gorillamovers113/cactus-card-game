/* What's The Point? — service worker (offline + installable) */
const CACHE = "wtp-cactus-v3";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-180.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()).catch(()=>self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  // Network-first for the page itself so updates land immediately when online; cache fallback offline.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then(res => { const c = res.clone(); caches.open(CACHE).then(x => x.put("./index.html", c)); return res; })
        .catch(() => caches.match("./index.html").then(r => r || caches.match("./")))
    );
    return;
  }
  // Cache-first for everything else (icons, CDN scripts), with runtime caching.
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      try { const c = res.clone(); caches.open(CACHE).then(x => x.put(req, c)); } catch (_) {}
      return res;
    }).catch(() => hit))
  );
});
