const CACHE_NAME = 'nivas-cache-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/logo.svg',
  '/favicon.svg',
  '/manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch(err => console.log("Cache pre-fill failed:", err));
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // Only handle local GET requests
  if (e.request.url.startsWith(self.location.origin) && e.request.method === 'GET') {
    
    // For navigation requests (pages/subroutes), serve the cached index.html to support client-side SPA routing
    if (e.request.mode === 'navigate') {
      e.respondWith(
        caches.match('/index.html').then((cachedResponse) => {
          return cachedResponse || fetch(e.request);
        })
      );
      return;
    }

    // For static assets, use cache-first and dynamically cache new responses
    e.respondWith(
      caches.match(e.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(e.request).then((response) => {
          // Cache successful assets dynamically if they are static files
          if (response && response.status === 200 && response.type === 'basic') {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, responseClone);
            });
          }
          return response;
        }).catch(() => {
          // Offline fallback
          return caches.match('/index.html') || caches.match('/');
        });
      })
    );
  }
});
