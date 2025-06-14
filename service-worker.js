const CACHE_NAME = 'mollis-sca-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css',
  'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.2/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js',
  'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
  'https://cdn.jsdelivr.net/npm/hammerjs@2.0.8/hammer.min.js',
  'https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js'
];
self.addEventListener('install', event => {
자기addEventListener('설치', 이벤트 => {
  event.waitUntil(
 이벤트.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
 캐시.open(CACHE_NAME)입니다.then(cache => 캐시.addAll(urlsToCache))를 사용합니다.
  );
});
self.addEventListener('fetch', event => {
자기addEventListener('가져오기', 이벤트 => {
  event.respondWith(
 이벤트.응답With(
    caches.match(event.request).then(resp => resp || fetch(event.request))
 캐시.match(이벤트.요청).then(resp => resp || fetch(이벤트.요청))
  );
});
