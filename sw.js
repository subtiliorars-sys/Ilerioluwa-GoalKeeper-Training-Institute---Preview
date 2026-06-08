// Ilerioluwa GK — service worker.
// HTML: network-first (always fresh content when online, cached fallback offline).
// Assets (css/js/img): cache-first (instant on mobile data; versioned URLs bust stale).
// PUBLISH CHECKLIST: when bumping any ?v=, update PRECACHE to match; when editing an
// UNVERSIONED asset (config.js, logo, favicon, manifest), bump the CACHE name too —
// PWA visitors otherwise keep the old copy forever.
var CACHE = 'igtc-v3';
var PRECACHE = [
  './', './index.html', './programs.html', './trials.html', './coaches.html',
  './stories.html', './schedule.html', './gallery.html', './faq.html',
  './contact.html', './drills.html', './safeguarding.html', './404.html',
  './glossary.html', './news.html', './offline.html',
  './assets/css/style.css?v=5', './assets/js/config.js',
  './assets/js/main.js?v=5', './assets/js/keeper-game.js?v=6',
  './assets/img/logo-lockup.jpg', './assets/img/favicon.svg'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(PRECACHE); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;                       // never cache cross-origin (analytics, embeds)
  if (url.pathname.indexOf('/assets/img/gallery/') !== -1) return;  // gallery = network-only: photo TAKEDOWNS must propagate (48h promise)
  var isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').indexOf('text/html') !== -1;
  if (isHTML) {
    // network-first
    e.respondWith(fetch(req).then(function (res) {
      if (res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
      return res;
    }).catch(function () {
      return caches.match(req).then(function (hit) { return hit || caches.match('./offline.html'); });
    }));
  } else {
    // cache-first
    e.respondWith(caches.match(req).then(function (hit) {
      return hit || fetch(req).then(function (res) {
        if (res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
        return res;
      });
    }));
  }
});
