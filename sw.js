// Ilerioluwa GK — service worker.
// HTML: network-first (always fresh content when online, cached fallback offline).
// Assets (css/js/img): cache-first (instant on mobile data; versioned URLs bust stale).
var CACHE = 'igtc-v1';
var PRECACHE = [
  './index.html', './programs.html', './trials.html', './coaches.html',
  './stories.html', './schedule.html', './gallery.html', './faq.html',
  './contact.html', './drills.html', './safeguarding.html', './404.html',
  './assets/css/style.css?v=4', './assets/js/config.js',
  './assets/js/main.js?v=3', './assets/js/keeper-game.js?v=6',
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
  var isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').indexOf('text/html') !== -1;
  if (isHTML) {
    // network-first
    e.respondWith(fetch(req).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(req, copy); });
      return res;
    }).catch(function () {
      return caches.match(req).then(function (hit) { return hit || caches.match('./index.html'); });
    }));
  } else {
    // cache-first
    e.respondWith(caches.match(req).then(function (hit) {
      return hit || fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
        return res;
      });
    }));
  }
});
