// Tagwerk Service Worker: App-Shell und Icons offline verfügbar halten.
const VERSION = "tagwerk-v1";
const FONTS = "tagwerk-fonts";
const CORE = [
  "/tagwerk/",
  "/tagwerk/manifest.webmanifest",
  "/tagwerk/icons/icon-192.png",
  "/tagwerk/icons/icon-512.png",
  "/tagwerk/icons/apple-touch-icon.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== FONTS).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Google Fonts: aus dem Cache, im Hintergrund auffrischen.
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(caches.open(FONTS).then(async c => {
      const hit = await c.match(req);
      const net = fetch(req).then(r => { if (r.ok || r.type === "opaque") c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  if (url.origin !== location.origin || !url.pathname.startsWith("/tagwerk/")) return;

  // Seite selbst: erst Netz (damit Updates ankommen), offline aus dem Cache.
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(r => {
      if (r.ok && !r.redirected) caches.open(VERSION).then(c => c.put("/tagwerk/", r.clone()));
      return r;
    }).catch(() => caches.match("/tagwerk/")));
    return;
  }

  // Icons, Manifest: erst Cache.
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
    return r;
  })));
});
