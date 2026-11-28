const CACHE_NAME = 'shikshana-parva-offline-test-v2';
const APP_FILES = [
  './offline-prototype.html',
  './offline-sw.js'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_FILES);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    // Delete only older caches belonging to this isolated prototype.
    await Promise.all(keys.filter(k =>
      k.startsWith('shikshana-parva-offline-test-') && k !== CACHE_NAME
    ).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate' || url.pathname.endsWith('/offline-prototype.html')) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match('./offline-prototype.html');
      try {
        const fresh = await fetch(request);
        if (fresh.ok) await cache.put('./offline-prototype.html', fresh.clone());
        return fresh;
      } catch {
        return cached || new Response('Offline prototype page is not cached yet. Open it once while online.', {
          status: 503, headers: {'Content-Type':'text/plain; charset=utf-8'}
        });
      }
    })());
  }
});
