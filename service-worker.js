// Each installed path has an independent shell; draft updates cannot evict another path.
const SCOPE = self.registration.scope;
const CACHE_PREFIX = 'noel-sca:' + encodeURIComponent(new URL(SCOPE).pathname) + ':';
const APP_CACHE = CACHE_PREFIX + 'app-v18';
const NETWORK_TIMEOUT_MS = 4000;
const APP_SHELL_FILES = [
  './index.html', './offline.html', './manifest.json', './flavor-reference.js',
  './data-store.js', './extras.js', './theme.js', './team.js',
  './workflow-tools.js', './workflow-tools.css',
  './icons/icon-192.png', './icons/icon-512.png', './icons/header-logo.png'
];
// Pin the same versions as index.html. Precache them before declaring offline readiness.
const LIBRARY_FILES = [
  'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css',
  'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.2/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js',
  'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
  'https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js',
  'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.2/webfonts/fa-solid-900.woff2',
  'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.2/webfonts/fa-regular-400.woff2',
  'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.2/webfonts/fa-brands-400.woff2'
];
const SHELL_URLS = new Set([...APP_SHELL_FILES.map(path=>new URL(path,SCOPE).href),...LIBRARY_FILES]);
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(APP_CACHE);
    // The prior worker stays active if any essential file cannot be cached.
    await cache.addAll([...SHELL_URLS]);
    await self.skipWaiting();
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith(CACHE_PREFIX) && key!==APP_CACHE).map(key=>caches.delete(key)));
    // Unscoped legacy caches are deliberately retained: another tab may still use them.
    await self.clients.claim();
  })());
});
async function fetchWithDeadline(request) {
  const controller=new AbortController();
  let timer;
  try {
    return await Promise.race([
      fetch(request,{signal:controller.signal}),
      new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('network timeout'));},NETWORK_TIMEOUT_MS);})
    ]);
  } finally { clearTimeout(timer); }
}
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  const isNavigation=request.mode==='navigate' && url.href.startsWith(SCOPE);
  // No interception/caching of Firebase/Auth/Firestore or unrelated origin requests.
  if(!isNavigation && !SHELL_URLS.has(url.href))return;
  event.respondWith((async()=>{
    const cache=await caches.open(APP_CACHE);
    const shellUrl=isNavigation && (url.pathname===new URL(SCOPE).pathname || url.pathname===new URL('index.html',SCOPE).pathname)
      ? new URL('index.html',SCOPE).href : request;
    const cached=await cache.match(shellUrl);
    // An installed shell is a consistent release and works without waiting for a failed network.
    if(cached)return cached;
    try {
      const response=await fetchWithDeadline(request);
      if(response.ok)return response;
      if(!isNavigation || response.status<500)return response;
    } catch(_) { /* Offline fallback below. */ }
    if(isNavigation) {
      const offline=await cache.match(new URL('offline.html',SCOPE).href);
      if(offline)return offline;
    }
    return new Response('Network error',{status:503,statusText:'Service Unavailable'});
  })());
});
