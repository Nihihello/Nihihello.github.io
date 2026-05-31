const CACHE = 'vocab-v1.2';
const PRECACHE = [
  './',
  './index.html',
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=JetBrains+Mono:wght@300;400&display=swap',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Network first for dictionary API; cache first for everything else
  if (e.request.url.includes('dictionaryapi.dev')) {
    e.respondWith(
      fetch(e.request).catch(() => new Response('[]', { headers: { 'Content-Type': 'application/json' }}))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.status === 200 && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
