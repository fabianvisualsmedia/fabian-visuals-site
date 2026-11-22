// Kochbuch Service Worker: App offline nutzbar, Updates kommen trotzdem sofort an (erst Netz, dann Cache).
const VERSION = "kochbuch-v1";
const FONTS = "kochbuch-fonts";
const CORE = [
  "/kochbuch/", "/kochbuch/app.js", "/kochbuch/nutrition.js", "/kochbuch/recipes.js",
  "/kochbuch/manifest.webmanifest", "/kochbuch/icons/icon-192.png", "/kochbuch/icons/icon-512.png", "/kochbuch/icons/apple-touch-icon.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith("kochbuch") && k !== VERSION && k !== FONTS).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(caches.open(FONTS).then(async c => {
      const hit = await c.match(req);
      const net = fetch(req).then(r => { if (r.ok || r.type === "opaque") c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  if (url.origin !== location.origin || !url.pathname.startsWith("/kochbuch/")) return; // /api/ nie cachen
  const key = req.mode === "navigate" ? "/kochbuch/" : req;
  e.respondWith(fetch(req).then(r => {
    if (r.ok && !r.redirected) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(key, copy)); }
    return r;
  }).catch(() => caches.match(key)));
});
