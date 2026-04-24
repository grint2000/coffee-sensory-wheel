const APP_CACHE = 'noel-sca-app-v5';
const RUNTIME_CACHE = 'noel-sca-runtime-v5';

const APP_SHELL_FILES = [
  './',
  './index.html',
  './offline.html',
  './manifest.json',
  './extras.js',
  './theme.js',
  './team.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/header-logo.png'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(APP_CACHE);
    await Promise.allSettled(APP_SHELL_FILES.map(file => cache.add(file)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(key => key !== APP_CACHE && key !== RUNTIME_CACHE)
        .map(key => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  event.respondWith((async () => {
    const url = new URL(request.url);

    const isRuntimeAsset =
      url.origin === self.location.origin ||
      url.hostname.includes('cdn.jsdelivr.net') ||
      url.hostname.includes('gstatic.com') ||
      url.hostname.includes('googleapis.com');

    if (!isRuntimeAsset) {
      return fetch(request);
    }

    const runtimeCache = await caches.open(RUNTIME_CACHE);
    const cached = await runtimeCache.match(request);

    try {
      const networkResponse = await fetch(request);
      if (networkResponse && networkResponse.ok) {
        runtimeCache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (_) {
      if (cached) return cached;
      if (request.mode === 'navigate') {
        const offline = await caches.match('./offline.html');
        if (offline) return offline;
      }
      return new Response('Network error', { status: 503, statusText: 'Service Unavailable' });
    }
  })());
});
