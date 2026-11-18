// FV Studio Service Worker – App-Shell offline, Wetter network-first.
const VERSION = 'fvs-v1';
const SHELL = [
  './', './index.html', './manifest.webmanifest', './css/studio.css',
  './js/app.js', './js/store.js', './js/sun.js', './js/weather.js', './js/ai.js', './js/voice.js', './js/icons.js',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname === 'api.anthropic.com') return; // KI nie cachen

  // Eigene Dateien: Netz zuerst (Updates sofort), offline aus dem Cache
  if (url.origin === location.origin) {
    e.respondWith(
      fetch(req).then((res) => { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); return res; })
        .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('./index.html')))
    );
    return;
  }
  // Fonts & SDK: Cache zuerst
  if (/fonts\.(googleapis|gstatic)\.com|cdn\.jsdelivr\.net/.test(url.hostname)) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); return res; })));
  }
});
