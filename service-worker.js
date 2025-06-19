const CACHE_NAME = 'mollis-sca-v3';
const urlsToCache = [
  './',
  './index.html',
  './offline.html',
  './manifest.json',
  './extras.js',
  './theme.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/header-logo.png',
  'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css',
  'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.2/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js',
  'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
  'https://cdn.jsdelivr.net/npm/hammerjs@2.0.8/hammer.min.js',
  'https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js'
];
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  return self.clients.claim();
});
self.addEventListener('fetch', event => {
  event.respondWith(
        caches.match(event.request).then(resp => {
      return resp || fetch(event.request).catch(() => caches.match('./offline.html'));
    })
  );
});
